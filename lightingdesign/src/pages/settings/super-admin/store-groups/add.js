import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import CippAddEditStoreGroups from "/src/components/CippComponents/CippAddEditStoreGroups";

const Page = () => {
  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      groupName: "",
      groupDescription: "",
      members: [],
    },
  });

  return (
    <>
      <Head>
        <title>Add Store Group - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="StoreGroupsList"
        title="Add Store Group"
        backButtonTitle="Store Groups"
      >
        <CippAddEditStoreGroups
          formControl={formControl}
          title="Store Group Details"
          backButtonTitle="Store Groups"
        />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
