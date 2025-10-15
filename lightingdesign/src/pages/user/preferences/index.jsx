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
