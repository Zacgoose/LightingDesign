import { useEffect, useState } from "react";
import { CippFormComponent } from "./CippFormComponent";
import { GroupHeader, GroupItems } from "../CippComponents/CippAutocompleteGrouping";
import { ApiGetCall } from "/src/api/ApiCall";

export const CippFormStoreSelector = ({
  formControl,
  componentType = "autoComplete",
  allStores = false,
  type = "multiple",
  name = "storeFilter",
  valueField = "storeId",
  required = true,
  disableClearable = true,
  includeGroups = false,
  ...other
}) => {
  const validators = () => {
    if (required) {
      return {
        required: { value: true, message: "This field is required" },
      };
    }
    return {};
  };

  // Build the API URL with query parameters
  const buildApiUrl = () => {
    const baseUrl = allStores ? "/api/ListStores?AllStoreSelector=true" : "/api/ListStores";
    const params = new URLSearchParams();

    if (allStores) {
      params.append("AllStoreSelector", "true");
    }

    return params.toString()
      ? `${baseUrl.split("?")[0]}?${params.toString()}`
      : baseUrl.split("?")[0];
  };

  // Fetch store list
  const storeList = ApiGetCall({
    url: buildApiUrl(),
    queryKey: allStores ? "ListStores-FormAllStoreSelector" : "ListStores-FormnotAllStores",
  });

  // Fetch store group list if includeGroups is true
  const storeGroupList = ApiGetCall({
    url: "/api/ListStoreGroups",
    data: { AllStoreSelector: true },
    queryKey: "StoreGroupSelector",
    enabled: includeGroups,
  });

  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (storeList.isSuccess && (!includeGroups || storeGroupList.isSuccess)) {
      const storeData = Array.isArray(storeList.data)
        ? storeList.data.map((store) => ({
            value: store[valueField],
            label: `${store.storeName} (${store.storeCode || store.storeId})`,
            type: "Store",
            addedFields: {
              storeId: store.storeId,
              storeName: store.storeName,
              storeCode: store.storeCode,
              location: store.location,
            },
          }))
        : [];

      const groupData =
        includeGroups && Array.isArray(storeGroupList?.data)
          ? storeGroupList.data.map((group) => ({
              value: group.groupId,
              label: group.groupName,
              type: "Group",
            }))
          : [];

      setOptions([...storeData, ...groupData]);
    }
  }, [storeList.isSuccess, storeGroupList.isSuccess, includeGroups, storeList.data, storeGroupList.data, valueField]);

  return (
    <CippFormComponent
      type={componentType}
      name={name}
      formControl={formControl}
      label="Select a store"
      creatable={false}
      multiple={type === "single" ? false : true}
      disableClearable={disableClearable}
      validators={validators}
      options={options}
      groupBy={(option) => option.type}
      renderGroup={(params) => (
        <li key={params.key}>
          {includeGroups && <GroupHeader>{params.group}</GroupHeader>}
          {includeGroups ? <GroupItems>{params.children}</GroupItems> : params.children}
        </li>
      )}
      isFetching={storeList.isFetching || storeGroupList.isFetching}
      {...other}
    />
  );
};
