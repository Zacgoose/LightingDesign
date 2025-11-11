import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import CippFormComponent from "/src/components/CippComponents/CippFormComponent";
import { Stack } from "@mui/material";

const Page = () => {
  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      storeName: "",
      storeCode: "",
      location: "",
      status: { value: "active", label: "Active" },
    },
  });

  return (
    <>
      <Head>
        <title>Add Store - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="StoresList"
        title="Add Store"
        backButtonTitle="Stores"
        postUrl="/api/ExecStore"
        customDataformatter={(values) => {
          return {
            Action: "AddEdit",
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
