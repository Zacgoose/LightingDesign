import Head from "next/head";
import {
  Box,
  Container,
  Stack,
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Grid } from "@mui/system";
import { Layout as DashboardLayout } from "../../../layouts/index";
import { CippPropertyListCard } from "../../../components/CippCards/CippPropertyListCard";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import { useForm, useFormState } from "react-hook-form";
import { useSettings } from "../../../hooks/use-settings";
import CippDevOptions from "../../../components/CippComponents/CippDevOptions";
import { ApiGetCall, ApiPostCall } from "../../../api/ApiCall";
import { getCippError } from "../../../utils/get-cipp-error";

const Page = () => {
  const settings = useSettings();

  const auth = ApiGetCall({
    url: "/api/me",
    queryKey: "authmecipp",
  });

  const saveSettingsPost = ApiPostCall({
    url: "/api/ExecUserSettings",
    relatedQueryKeys: "userSettings",
  });

  // Default values for all settings
  const defaultSettings = {
    tablePageSize: { value: "25", label: "25" },
    persistFilters: true,
    showGrid: true,
    exportFormat: { value: "pdf", label: "PDF" },
    exportQuality: { value: "medium", label: "Medium" },
    exportIncludeGrid: false,
    autoSaveInterval: { value: "2", label: "2 minutes" },
    gridOpacity: 80,
    backgroundOpacity: 60,
  };

  // Merge user settings with defaults
  const initialFormValues = {
    ...defaultSettings,
    ...settings,
  };

  const formcontrol = useForm({
    mode: "onChange",
    defaultValues: initialFormValues,
  });

  const { isDirty, isValid } = useFormState({ control: formcontrol.control });

  const handleSaveChanges = () => {
    const formValues = formcontrol.getValues();

    const currentSettings = {
      tablePageSize: formValues.tablePageSize,
      persistFilters: formValues.persistFilters,
      showGrid: formValues.showGrid,
      exportFormat: formValues.exportFormat,
      exportQuality: formValues.exportQuality,
      exportIncludeGrid: formValues.exportIncludeGrid,
      autoSaveInterval: formValues.autoSaveInterval,
      gridOpacity: formValues.gridOpacity,
      backgroundOpacity: formValues.backgroundOpacity,
    };

    const shippedValues = {
      user: auth.data?.clientPrincipal?.userDetails || "currentUser",
      currentSettings: currentSettings,
    };

    saveSettingsPost.mutate({ url: "/api/ExecUserSettings", data: shippedValues });
  };

  // Options
  const exportFormatOptions = [
    { value: "pdf", label: "PDF" },
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPG" },
  ];

  const exportQualityOptions = [
    { value: "low", label: "Low (Fast)" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High (Slow)" },
  ];

  const pageSizes = [
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
    { value: "250", label: "250" },
    { value: "500", label: "500" },
  ];

  const autoSaveIntervalOptions = [
    { value: "2", label: "2 minutes" },
    { value: "3", label: "3 minutes" },
    { value: "4", label: "4 minutes" },
    { value: "5", label: "5 minutes" },
    { value: "6", label: "6 minutes" },
    { value: "7", label: "7 minutes" },
    { value: "8", label: "8 minutes" },
  ];

  return (
    <>
      <Head>
        <title>Preferences - Lighting Design</title>
      </Head>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  {/* General Settings */}
                  <CippPropertyListCard
                    showDivider={false}
                    title="General Settings"
                    propertyItems={[
                      {
                        label: "Save last used table filter",
                        value: (
                          <CippFormComponent
                            type="switch"
                            name="persistFilters"
                            formControl={formcontrol}
                          />
                        ),
                      },
                      {
                        label: "Default Table Page Size",
                        value: (
                          <CippFormComponent
                            type="autoComplete"
                            creatable={false}
                            disableClearable={true}
                            name="tablePageSize"
                            formControl={formcontrol}
                            multiple={false}
                            options={pageSizes}
                          />
                        ),
                      },
                    ]}
                  />

                  {/* Canvas Settings */}
                  <CippPropertyListCard
                    showDivider={false}
                    title="Canvas Settings"
                    propertyItems={[
                      {
                        label: "Show Grid by Default",
                        value: (
                          <CippFormComponent
                            type="switch"
                            name="showGrid"
                            formControl={formcontrol}
                          />
                        ),
                      },
                    ]}
                  />

                  {/* Designer Settings */}
                  <CippPropertyListCard
                    showDivider={false}
                    title="Designer Settings"
                    propertyItems={[
                      {
                        label: "Auto-Save Interval",
                        value: (
                          <CippFormComponent
                            type="autoComplete"
                            creatable={false}
                            disableClearable={true}
                            name="autoSaveInterval"
                            formControl={formcontrol}
                            multiple={false}
                            options={autoSaveIntervalOptions}
                          />
                        ),
                      },
                      {
                        label: "Grid Opacity (%)",
                        value: (
                          <CippFormComponent
                            type="number"
                            name="gridOpacity"
                            formControl={formcontrol}
                            validators={{
                              min: { value: 0, message: "Minimum is 0%" },
                              max: { value: 100, message: "Maximum is 100%" },
                            }}
                            helperText="0-100%"
                          />
                        ),
                      },
                      {
                        label: "Background Opacity (%)",
                        value: (
                          <CippFormComponent
                            type="number"
                            name="backgroundOpacity"
                            formControl={formcontrol}
                            validators={{
                              min: { value: 0, message: "Minimum is 0%" },
                              max: { value: 100, message: "Maximum is 100%" },
                            }}
                            helperText="0-100%"
                          />
                        ),
                      },
                    ]}
                  />

                  {/* Export Settings */}
                  <CippPropertyListCard
                    showDivider={false}
                    title="Export Settings"
                    propertyItems={[
                      {
                        label: "Default Export Format",
                        value: (
                          <CippFormComponent
                            type="autoComplete"
                            creatable={false}
                            disableClearable={true}
                            name="exportFormat"
                            formControl={formcontrol}
                            multiple={false}
                            options={exportFormatOptions}
                          />
                        ),
                      },
                      {
                        label: "Export Quality",
                        value: (
                          <CippFormComponent
                            type="autoComplete"
                            creatable={false}
                            disableClearable={true}
                            name="exportQuality"
                            formControl={formcontrol}
                            multiple={false}
                            options={exportQualityOptions}
                          />
                        ),
                      },
                      {
                        label: "Include Grid in Exports",
                        value: (
                          <CippFormComponent
                            type="switch"
                            name="exportIncludeGrid"
                            formControl={formcontrol}
                          />
                        ),
                      },
                    ]}
                  />
                </Stack>
              </Grid>

              {/* Sidebar */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  {/* Save Actions Card */}
                  <Card>
                    <CardHeader title="Actions" />
                    <Divider />
                    <CardContent sx={{ mb: 0, pb: 0 }}>
                      <Stack spacing={1}>
                        {saveSettingsPost.isError && (
                          <Alert severity="error">{getCippError(saveSettingsPost.error)}</Alert>
                        )}
                        {saveSettingsPost.isSuccess && (
                          <Alert severity="success">Settings saved successfully</Alert>
                        )}
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        disabled={!isValid || !isDirty}
                        onClick={handleSaveChanges}
                      >
                        Save Preferences
                        {saveSettingsPost.isPending && <CircularProgress color="info" size={20} />}
                      </Button>
                    </CardActions>
                  </Card>

                  <CippDevOptions />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
