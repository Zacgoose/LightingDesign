import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import CippFormComponent from "/src/components/CippComponents/CippFormComponent";
import { Stack } from "@mui/material";
import CippFormSection from "/src/components/CippFormPages/CippFormSection";
import { useRouter } from "next/router";
import { ApiGetCall } from "/src/api/ApiCall";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  const formControl = useForm({
    mode: "onChange",
  });

  // Fetch store data
  const storeData = ApiGetCall({
    url: "/api/ListStores",
    queryKey: `Store-${id}`,
    enabled: !!id,
  });

  // Set form values when data is loaded
  const store = storeData.data?.Results?.find((s) => s.storeId === id);

  if (store && !formControl.formState.isDirty) {
    formControl.reset({
      storeId: store.storeId,
      storeName: store.storeName,
      storeCode: store.storeCode,
      location: store.location,
      status: store.status
        ? { value: store.status, label: store.status.charAt(0).toUpperCase() + store.status.slice(1) }
        : { value: "active", label: "Active" },
    });
  }

  return (
    <>
      <Head>
        <title>Edit Store - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="StoresList"
        title="Edit Store"
        backButtonTitle="Stores"
        postUrl="/api/ExecStore"
        customDataformatter={(values) => {
          return {
            ...values,
            Action: "AddEdit",
            status: values.status?.value,
          };
        }}
      >
        <CippFormSection title="Store Details" formControl={formControl}>
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
        </CippFormSection>
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
