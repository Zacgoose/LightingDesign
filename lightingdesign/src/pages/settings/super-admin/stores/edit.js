import Head from "next/head";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import CippFormComponent from "/src/components/CippComponents/CippFormComponent";
import { Stack } from "@mui/material";
import { ApiGetCall } from "/src/api/ApiCall";
import { useEffect } from "react";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  // Fetch store data
  const storeData = ApiGetCall({
    url: "/api/ExecGetStore",
    data: { storeId: id },
    queryKey: `Store-${id}`,
    enabled: !!id,
  });

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      storeName: "",
      storeCode: "",
      location: "",
      status: { value: "active", label: "Active" },
    },
  });

  // Update form when store data loads
  useEffect(() => {
    if (storeData.data) {
      formControl.reset({
        storeId: storeData.data.storeId,
        storeName: storeData.data.storeName,
        storeCode: storeData.data.storeCode,
        location: storeData.data.location,
        status: storeData.data.status
          ? {
              value: storeData.data.status,
              label: storeData.data.status.charAt(0).toUpperCase() + storeData.data.status.slice(1),
            }
          : { value: "active", label: "Active" },
      });
    }
  }, [storeData.data]);

  return (
    <>
      <Head>
        <title>Edit Store - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey={["Stores", `Store-${id}`]}
        title={`Edit Store: ${storeData.data?.storeName || "Loading..."}`}
        backButtonTitle="Stores"
        postUrl="/api/ExecStore"
        customDataformatter={(values) => {
          return {
            Action: "AddEdit",
            storeId: id,
            storeName: values.storeName,
            storeCode: values.storeCode,
            location: values.location,
            status: values.status?.value || "active",
          };
        }}
      >
        <Stack spacing={2}>
          <CippFormComponent
            type="textField"
            name="storeName"
            label="Store Name"
            placeholder="Enter the store name"
            formControl={formControl}
            required
          />
          <CippFormComponent
            type="textField"
            name="storeCode"
            label="Store Code"
            placeholder="Enter the store code"
            formControl={formControl}
            required
          />
          <CippFormComponent
            type="textField"
            name="location"
            label="Location"
            placeholder="Enter the store location"
            formControl={formControl}
          />
          <CippFormComponent
            type="autoComplete"
            name="status"
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            formControl={formControl}
            required
          />
        </Stack>
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
