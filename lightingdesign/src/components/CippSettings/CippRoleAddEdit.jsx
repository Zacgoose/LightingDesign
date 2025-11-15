import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Alert,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  SvgIcon,
  Skeleton,
} from "@mui/material";

import { Grid } from "@mui/system";
import { ApiGetCall, ApiGetCallWithPagination, ApiPostCall } from "../../api/ApiCall";
import { CippOffCanvas } from "/src/components/CippComponents/CippOffCanvas";
import { CippFormStoreSelector } from "/src/components/CippComponents/CippFormStoreSelector";
import { Save, WarningOutlined } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CippFormComponent from "../CippComponents/CippFormComponent";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { CippApiResults } from "../CippComponents/CippApiResults";
import cippRoles from "../../data/cipp-roles.json";
import { GroupHeader, GroupItems } from "../CippComponents/CippAutocompleteGrouping";

export const CippRoleAddEdit = ({ selectedRole }) => {
  const updatePermissions = ApiPostCall({
    urlFromData: true,
    relatedQueryKeys: ["customRoleList", "customRoleTable"],
  });

  const [allStoreSelected, setAllStoreSelected] = useState(false);
  const [cippApiRoleSelected, setCippApiRoleSelected] = useState(false);
  const [selectedRoleState, setSelectedRoleState] = useState(null);
  const [updateDefaults, setUpdateDefaults] = useState(false);
  const [baseRolePermissions, setBaseRolePermissions] = useState({});
  const [isBaseRole, setIsBaseRole] = useState(false);

  const formControl = useForm({
    mode: "onChange",
  });

  const formState = useFormState({ control: formControl.control });

  const validateRoleName = (value) => {
    if (
      customRoleList?.pages?.[0]?.some(
        (role) => role?.RowKey?.toLowerCase() === value?.toLowerCase(),
      )
    ) {
      return `Role '${value}' already exists`;
    }
    return true;
  };

  const selectedStore = useWatch({ control: formControl.control, name: "allowedStores" });
  const blockedStores = useWatch({ control: formControl.control, name: "blockedStores" });
  const blockedEndpoints = useWatch({ control: formControl.control, name: "BlockedEndpoints" });
  const setDefaults = useWatch({ control: formControl.control, name: "Defaults" });
  const selectedPermissions = useWatch({ control: formControl.control, name: "Permissions" });
  const selectedEntraGroup = useWatch({ control: formControl.control, name: "EntraGroup" });

  const {
    data: apiPermissions = [],
    isFetching: apiPermissionFetching,
    isSuccess: apiPermissionSuccess,
  } = ApiGetCall({
    url: "/api/ExecAPIPermissionList",
    queryKey: "apiPermissions",
  });

  const {
    data: customRoleList = [],
    isFetching: customRoleListFetching,
    isSuccess: customRoleListSuccess,
  } = ApiGetCallWithPagination({
    url: "/api/ExecCustomRole",
    queryKey: "customRoleList",
  });

  const { data: { pages = [] } = {}, isSuccess: storesSuccess } = ApiGetCallWithPagination({
    url: "/api/ListStores?AllStoreSelector=true",
    queryKey: "ListStores-AllStoreSelector",
  });
  const stores = pages[0] || [];

  const matchPattern = (pattern, value) => {
    const regex = new RegExp(`^${pattern.replace("*", ".*")}$`);
    return regex.test(value);
  };

  const getBaseRolePermissions = (role) => {
    const roleConfig = cippRoles[role];
    if (!roleConfig) return {};

    const permissions = {};
    Object.keys(apiPermissions).forEach((cat) => {
      Object.keys(apiPermissions[cat]).forEach((obj) => {
        const includeRead = roleConfig.include.some((pattern) =>
          matchPattern(pattern, `${cat}.${obj}.Read`),
        );
        const includeReadWrite = roleConfig.include.some((pattern) =>
          matchPattern(pattern, `${cat}.${obj}.ReadWrite`),
        );
        const excludeRead = roleConfig.exclude.some((pattern) =>
          matchPattern(pattern, `${cat}.${obj}.Read`),
        );
        const excludeReadWrite = roleConfig.exclude.some((pattern) =>
          matchPattern(pattern, `${cat}.${obj}.ReadWrite`),
        );

        if ((includeRead || includeReadWrite) && !(excludeRead || excludeReadWrite)) {
          if (!permissions[cat]) permissions[cat] = {};
          permissions[cat][obj] = includeReadWrite ? `ReadWrite` : `Read`;
        }
        if (!permissions[cat] || !permissions[cat][obj]) {
          if (!permissions[cat]) permissions[cat] = {};
          permissions[cat][obj] = `None`;
        }
      });
    });
    return permissions;
  };

  useEffect(() => {
    if (selectedRole && cippRoles[selectedRole]) {
      setBaseRolePermissions(getBaseRolePermissions(selectedRole));
      setIsBaseRole(true);
    } else {
      setBaseRolePermissions({});
      setIsBaseRole(false);
    }
  }, [selectedRole, apiPermissions]);

  useEffect(() => {
    if (
      !customRoleListSuccess ||
      !storesSuccess ||
      !selectedRole ||
      selectedRoleState === selectedRole
    ) {
      return;
    }

    setSelectedRoleState(selectedRole);
    const isApiRole = selectedRole === "api-role";
    setCippApiRoleSelected(isApiRole);

    const currentPermissions = customRoleList?.pages?.[0]?.find(
      (role) => role.RowKey === selectedRole,
    );

    // Process allowed stores - handle both groups and store IDs
    var newAllowedStores = [];
    currentPermissions?.AllowedStores?.forEach((item) => {
      if (typeof item === "object" && item.type === "Group") {
        newAllowedStores.push({
          label: item.label,
          value: item.value,
          type: "Group",
        });
      } else {
        var storeInfo = stores.find((s) => s.storeId === item);
        if (storeInfo?.storeName) {
          var label = `${storeInfo.storeName} (${storeInfo.storeCode || storeInfo.storeId})`;
          newAllowedStores.push({
            label: label,
            value: storeInfo.storeId,
            type: "Store",
            addedFields: {
              storeId: storeInfo.storeId,
              storeName: storeInfo.storeName,
              storeCode: storeInfo.storeCode,
            },
          });
        } else {
          // Log warning when store can't be found
          console.warn(`Store not found for ID: ${item}`);
        }
      }
    });

    // Process blocked stores - handle both groups and store IDs
    var newBlockedStores = [];
    currentPermissions?.BlockedStores?.forEach((item) => {
      if (typeof item === "object" && item.type === "Group") {
        newBlockedStores.push({
          label: item.label,
          value: item.value,
          type: "Group",
        });
      } else {
        var storeInfo = stores.find((s) => s.storeId === item);
        if (storeInfo?.storeName) {
          var label = `${storeInfo.storeName} (${storeInfo.storeCode || storeInfo.storeId})`;
          newBlockedStores.push({
            label: label,
            value: storeInfo.storeId,
            type: "Store",
            addedFields: {
              storeId: storeInfo.storeId,
              storeName: storeInfo.storeName,
              storeCode: storeInfo.storeCode,
            },
          });
        } else {
          console.warn(`Store not found for ID: ${item}`);
        }
      }
    });

    const basePermissions = {};
    Object.entries(getBaseRolePermissions(selectedRole)).forEach(([cat, objects]) => {
      Object.entries(objects).forEach(([obj, permission]) => {
        basePermissions[`${cat}${obj}`] = `${cat}.${obj}.${permission}`;
      });
    });

    const processPermissions = (permissions) => {
      const processed = {};
      Object.keys(apiPermissions).forEach((cat) => {
        Object.keys(apiPermissions[cat]).forEach((obj) => {
          const key = `${cat}${obj}`;
          const existingPerm = permissions?.[key];
          processed[key] = existingPerm || `${cat}.${obj}.None`;
        });
      });
      return processed;
    };

    const processedBlockedEndpoints =
      currentPermissions?.BlockedEndpoints?.map((endpoint) => ({
        label: endpoint,
        value: endpoint,
      })) || [];

    formControl.reset({
      Permissions:
        basePermissions && Object.keys(basePermissions).length > 0
          ? basePermissions
          : processPermissions(currentPermissions?.Permissions),
      RoleName: selectedRole ?? currentPermissions?.RowKey,
      allowedStores: newAllowedStores,
      blockedStores: newBlockedStores,
      BlockedEndpoints: processedBlockedEndpoints,
      EntraGroup: currentPermissions?.EntraGroup,
    });
  }, [
    customRoleList,
    customRoleListSuccess,
    storesSuccess,
    selectedRole,
    stores,
    apiPermissions,
    formControl,
  ]);

  useEffect(() => {
    if (updateDefaults !== setDefaults) {
      setUpdateDefaults(setDefaults);
      var newPermissions = {};
      Object.keys(apiPermissions).forEach((cat) => {
        Object.keys(apiPermissions[cat]).forEach((obj) => {
          var newval = "";
          if (cat == "CIPP" && obj == "Core" && setDefaults == "None") {
            newval = "Read";
          } else {
            newval = setDefaults;
          }
          newPermissions[`${cat}${obj}`] = `${cat}.${obj}.${newval}`;
        });
      });
      formControl.setValue("Permissions", newPermissions);
    }
  }, [setDefaults, updateDefaults]);

  useEffect(() => {
    var allstore = false;
    selectedStore?.map((store) => {
      if (store?.value === "AllStores") {
        allstore = true;
      }
    });
    if (allstore) {
      setAllStoreSelected(true);
    } else {
      setAllStoreSelected(false);
    }
  }, [selectedStore, blockedStores]);

  useEffect(() => {
    if (selectedRole) {
      formControl.setValue("RoleName", selectedRole);
    }
  }, [selectedRole]);

  const handleSubmit = () => {
    let values = formControl.getValues();

    // Process allowed stores - preserve groups and convert stores to IDs
    const processedAllowedStores =
      selectedStore
        ?.map((store) => {
          if (store.type === "Group") {
            // Keep groups as-is for backend processing
            return {
              type: "Group",
              value: store.value,
              label: store.label,
            };
          } else {
            // Convert store values to store IDs
            const storeInfo = stores.find((s) => s.storeId === store.value);
            return storeInfo?.storeId;
          }
        })
        .filter(Boolean) || [];

    // Process blocked stores - preserve groups and convert stores to IDs
    const processedBlockedStores =
      blockedStores
        ?.map((store) => {
          if (store.type === "Group") {
            // Keep groups as-is for backend processing
            return {
              type: "Group",
              value: store.value,
              label: store.label,
            };
          } else {
            // Convert store values to store IDs
            const storeInfo = stores.find((s) => s.storeId === store.value);
            return storeInfo?.storeId;
          }
        })
        .filter(Boolean) || [];

    const processedBlockedEndpoints =
      values?.["BlockedEndpoints"]?.map((endpoint) => {
        // Extract the endpoint value
        return endpoint.value || endpoint;
      }) || [];

    updatePermissions.mutate({
      url: "/api/ExecCustomRole?Action=AddUpdate",
      data: {
        RoleName: values?.["RoleName"],
        Permissions: selectedPermissions,
        EntraGroup: selectedEntraGroup,
        AllowedStores: processedAllowedStores,
        BlockedStores: processedBlockedStores,
        BlockedEndpoints: processedBlockedEndpoints,
      },
    });
  };

  const ApiPermissionRow = ({ obj, cat, readOnly }) => {
    const [offcanvasVisible, setOffcanvasVisible] = useState(false);
    const [descriptionOffcanvasVisible, setDescriptionOffcanvasVisible] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState({ name: "", description: "" });

    const handleDescriptionClick = (name, description) => {
      setSelectedDescription({ name, description });
      setDescriptionOffcanvasVisible(true);
    };

    return (
      <Stack
        direction="row"
        display="flex"
        alignItems="center"
        justifyContent={"space-between"}
        width={"100%"}
      >
        <Typography variant="h6">{obj}</Typography>
        <Stack direction="row" spacing={3} size={{ xl: 8 }}>
          <Button onClick={() => setOffcanvasVisible(true)} size="sm" color="info">
            <SvgIcon fontSize="small">
              <InformationCircleIcon />
            </SvgIcon>
          </Button>
          <CippFormComponent
            type="radio"
            row={true}
            name={`Permissions.${cat}${obj}`}
            options={[
              {
                label: "None",
                value: `${cat}.${obj}.None`,
                disabled: cat === "CIPP" && obj === "Core",
              },
              { label: "Read", value: `${cat}.${obj}.Read`, disabled: readOnly },
              {
                label: "Read / Write",
                value: `${cat}.${obj}.ReadWrite`,
              },
            ]}
            formControl={formControl}
            disabled={readOnly}
          />
        </Stack>
        {/* Main offcanvas */}
        <CippOffCanvas
          visible={offcanvasVisible}
          onClose={() => setOffcanvasVisible(false)}
          title={`${cat}.${obj} Endpoints`}
        >
          <Stack spacing={2}>
            <Typography variant="body1" sx={{ mx: 3 }}>
              Listed below are the available API endpoints based on permission level. ReadWrite
              level includes endpoints under Read.
            </Typography>
            {Object.keys(apiPermissions[cat][obj]).map((type, typeIndex) => {
              var items = [];
              for (var api in apiPermissions[cat][obj][type]) {
                const apiFunction = apiPermissions[cat][obj][type][api];
                items.push({
                  name: apiFunction.Name,
                  description: apiFunction.Description?.[0]?.Text || null,
                });
              }
              return (
                <Stack key={`${type}-${typeIndex}`} spacing={2}>
                  <Typography variant="h4">{type}</Typography>
                  <Stack spacing={1}>
                    {items.map((item, idx) => (
                      <Stack key={`${type}-${idx}`} direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: "bold", flexGrow: 1 }}>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Button
                            size="small"
                            onClick={() => handleDescriptionClick(item.name, item.description)}
                            sx={{ minWidth: "auto", p: 0.5 }}
                          >
                            <SvgIcon fontSize="small" color="info">
                              <InformationCircleIcon />
                            </SvgIcon>
                          </Button>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </CippOffCanvas>

        {/* Description offcanvas */}
        <CippOffCanvas
          visible={descriptionOffcanvasVisible}
          onClose={() => setDescriptionOffcanvasVisible(false)}
          title="Function Description"
        >
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {selectedDescription.name}
            </Typography>
            <Typography variant="body1">{selectedDescription.description}</Typography>
          </Stack>
        </CippOffCanvas>
      </Stack>
    );
  };

  return (
    <>
      <Stack spacing={3} direction="row">
        <Box width={"80%"}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Role Options
            </Typography>
            {!selectedRole && (
              <CippFormComponent
                type="textField"
                name="RoleName"
                label="Custom Role"
                placeholder="Enter a unique role name"
                formControl={formControl}
                validators={{ validate: validateRoleName }}
                fullWidth={true}
                required={true}
              />
            )}
            {selectedRole &&
              isBaseRole &&
              ["admin", "superadmin", "lightingdesigner"].includes(selectedRole) && (
                <Alert color="warning" icon={<WarningOutlined />}>
                  This is a highly privileged role and overrides any custom role restrictions.
                </Alert>
              )}
            {cippApiRoleSelected && (
              <Alert color="info">
                This is the default role for all API clients in the CIPP-API integration. If you
                would like different permissions for specific applications, create a role per
                application and select it from the CIPP-API integrations page.
              </Alert>
            )}
            <CippFormComponent
              type="autoComplete"
              name="EntraGroup"
              label="Entra Group Assignment"
              placeholder="Select an Entra Group to assign this role to, leave blank for none."
              api={{
                url: "/api/ExecCustomRole",
                data: { Action: "ListEntraGroups" },
                type: "GET",
                queryKey: "PartnerEntraGroups",
                dataKey: "Results",
                labelField: "displayName",
                valueField: "id",
              }}
              formControl={formControl}
              fullWidth={true}
              sortOptions={true}
              multiple={false}
              creatable={false}
              helperText="Assigning an Entra group will automatically assign this role to all users in that group. This does not work with users invited directly to Static Web App."
            />
          </Stack>
          {!isBaseRole && (
            <>
              <Stack spacing={1} sx={{ my: 3 }}>
                <CippFormStoreSelector
                  label="Allowed Stores"
                  formControl={formControl}
                  type="multiple"
                  allStores={true}
                  name="allowedStores"
                  fullWidth={true}
                  includeGroups={true}
                  helperText="Select the stores that users should have access to with this role."
                />
                {allStoreSelected && blockedStores?.length == 0 && (
                  <Alert color="warning">
                    All stores selected, no store restrictions will be applied unless blocked
                    stores are specified.
                  </Alert>
                )}
              </Stack>
              {allStoreSelected && (
                <Box sx={{ mb: 3 }}>
                  <CippFormStoreSelector
                    label="Blocked Stores"
                    formControl={formControl}
                    type="multiple"
                    allStores={false}
                    name="blockedStores"
                    fullWidth={true}
                    includeGroups={true}
                    helperText="Select stores that this role should not have access to."
                  />
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <CippFormComponent
                  type="autoComplete"
                  name="BlockedEndpoints"
                  label="Blocked Endpoints"
                  placeholder="Select API endpoints to block for this role"
                  options={
                    apiPermissionSuccess
                      ? (() => {
                          const allEndpoints = [];
                          Object.keys(apiPermissions)
                            .sort()
                            .forEach((cat) => {
                              Object.keys(apiPermissions[cat])
                                .sort()
                                .forEach((obj) => {
                                  Object.keys(apiPermissions[cat][obj]).forEach((type) => {
                                    Object.keys(apiPermissions[cat][obj][type]).forEach(
                                      (apiKey) => {
                                        const apiFunction = apiPermissions[cat][obj][type][apiKey];
                                        const descriptionText = apiFunction.Description?.[0]?.Text;
                                        allEndpoints.push({
                                          label: descriptionText
                                            ? `${apiFunction.Name} - ${descriptionText}`
                                            : apiFunction.Name,
                                          value: apiFunction.Name,
                                          category: `${cat}.${obj}.${type}`,
                                        });
                                      },
                                    );
                                  });
                                });
                            });
                          // Sort endpoints alphabetically within each category
                          return allEndpoints.sort((a, b) => {
                            if (a.category !== b.category) {
                              return a.category.localeCompare(b.category);
                            }
                            return a.label.localeCompare(b.label);
                          });
                        })()
                      : []
                  }
                  formControl={formControl}
                  fullWidth={true}
                  multiple={true}
                  creatable={false}
                  groupBy={(option) => option.category}
                  renderGroup={(params) => (
                    <li key={params.key}>
                      <GroupHeader>{params.group}</GroupHeader>
                      <GroupItems>{params.children}</GroupItems>
                    </li>
                  )}
                  helperText="Select specific API endpoints to block for this role, this overrides permission settings below."
                />
              </Box>
            </>
          )}
          {apiPermissionFetching && (
            <>
              <Typography variant="h5">
                <Skeleton width={150} />
              </Typography>
              <Stack
                direction="row"
                display="flex"
                alignItems="center"
                justifyContent={"space-between"}
                width={"100%"}
                sx={{ my: 2 }}
              >
                <Skeleton width={180} />
                <Box sx={{ pr: 5 }}>
                  <Skeleton width={300} height={40} />
                </Box>
              </Stack>
              {[...Array(5)].map((_, index) => (
                <Accordion variant="outlined" key={`skeleton-accordion-${index}`} disabled>
                  <AccordionSummary>
                    <Skeleton width={100} />
                  </AccordionSummary>
                </Accordion>
              ))}
            </>
          )}
          {apiPermissionSuccess && (
            <>
              {/* Display include/exclude patterns for base roles */}
              {isBaseRole && selectedRole && cippRoles[selectedRole]?.include && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Defined Permissions
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, fontWeight: "bold", color: "success.main" }}
                    >
                      Include Patterns:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      These patterns define which permissions are included for this base role:
                    </Typography>
                    <Box sx={{ fontFamily: "monospace", fontSize: "0.875rem", mb: 2 }}>
                      {cippRoles[selectedRole].include.map((pattern, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            py: 0.5,
                            px: 1,
                            backgroundColor: "success.main",
                            color: "success.contrastText",
                            mb: 1,
                            borderRadius: 1,
                            opacity: 0.8,
                            display: "inline-block",
                            mr: 1,
                          }}
                        >
                          {pattern}
                        </Box>
                      ))}
                    </Box>

                    {cippRoles[selectedRole]?.exclude &&
                      cippRoles[selectedRole].exclude.length > 0 && (
                        <>
                          <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, fontWeight: "bold", color: "error.main" }}
                          >
                            Exclude Patterns:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            These patterns define which permissions are explicitly excluded from
                            this base role:
                          </Typography>
                          <Box sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                            {cippRoles[selectedRole].exclude.map((pattern, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  py: 0.5,
                                  px: 1,
                                  backgroundColor: "error.main",
                                  color: "error.contrastText",
                                  mb: 1,
                                  borderRadius: 1,
                                  opacity: 0.8,
                                  display: "inline-block",
                                  mr: 1,
                                }}
                              >
                                {pattern}
                              </Box>
                            ))}
                          </Box>
                        </>
                      )}
                  </Box>
                </>
              )}

              <Typography variant="h5" sx={{ mb: 2 }}>
                API Permissions
              </Typography>
              {!isBaseRole && (
                <Stack
                  direction="row"
                  display="flex"
                  alignItems="center"
                  justifyContent={"space-between"}
                  width={"100%"}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">Set All Permissions</Typography>

                  <Box sx={{ pr: 5 }}>
                    <CippFormComponent
                      type="radio"
                      name="Defaults"
                      options={[
                        {
                          label: "None",
                          value: "None",
                        },
                        { label: "Read", value: "Read" },
                        {
                          label: "Read / Write",
                          value: "ReadWrite",
                        },
                      ]}
                      formControl={formControl}
                      row={true}
                    />
                  </Box>
                </Stack>
              )}
              <Box>
                <>
                  {Object.keys(apiPermissions)
                    .sort()
                    .map((cat, catIndex) => (
                      <Accordion variant="outlined" key={`accordion-item-${catIndex}`}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>{cat}</AccordionSummary>
                        <AccordionDetails>
                          {Object.keys(apiPermissions[cat])
                            .sort()
                            .map((obj, index) => {
                              const readOnly = baseRolePermissions?.[cat] ? true : false;
                              return (
                                <Grid container key={`row-${catIndex}-${index}`} className="mb-3">
                                  <ApiPermissionRow obj={obj} cat={cat} readOnly={readOnly} />
                                </Grid>
                              );
                            })}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                </>
              </Box>
            </>
          )}
        </Box>

        <Box size={{ md: 12, xl: 3 }} width="30%">
          {selectedEntraGroup && (
            <Alert color="info">
              This role will be assigned to the Entra Group:{" "}
              <strong>{selectedEntraGroup.label}</strong>
            </Alert>
          )}
          {selectedStore?.length > 0 && (
            <>
              <h5>Allowed Stores</h5>
              <ul>
                {selectedStore.map((store, idx) => (
                  <li key={`allowed-store-${idx}`}>{store?.label}</li>
                ))}
              </ul>
            </>
          )}
          {blockedStores?.length > 0 && (
            <>
              <h5>Blocked Stores</h5>
              <ul>
                {blockedStores.map((store, idx) => (
                  <li key={`blocked-store-${idx}`}>{store?.label}</li>
                ))}
              </ul>
            </>
          )}
          {blockedEndpoints?.length > 0 && (
            <>
              <h5>Blocked Endpoints</h5>
              <ul>
                {blockedEndpoints.map((endpoint, idx) => (
                  <li
                    key={`blocked-endpoint-${idx}`}
                    style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}
                  >
                    {endpoint?.label || endpoint?.value || endpoint}
                  </li>
                ))}
              </ul>
            </>
          )}
          {selectedPermissions && apiPermissionSuccess && (
            <>
              <h5>Selected Permissions</h5>
              <ul>
                {selectedPermissions &&
                  Object.keys(selectedPermissions)
                    ?.sort()
                    .map((cat, idx) => (
                      <React.Fragment key={`permission-${idx}`}>
                        {selectedPermissions?.[cat] &&
                          typeof selectedPermissions[cat] === "string" &&
                          !selectedPermissions[cat]?.includes("None") && (
                            <li>{selectedPermissions[cat]}</li>
                          )}
                      </React.Fragment>
                    ))}
              </ul>
            </>
          )}
        </Box>
      </Stack>

      <CippApiResults apiObject={updatePermissions} />
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          className="me-2"
          type="submit"
          variant="contained"
          disabled={updatePermissions.isPending || customRoleListFetching || !formState.isValid}
          startIcon={
            <SvgIcon fontSize="small">
              <Save />
            </SvgIcon>
          }
          onClick={handleSubmit}
        >
          Save
        </Button>
      </Stack>
    </>
  );
};

export default CippRoleAddEdit;
