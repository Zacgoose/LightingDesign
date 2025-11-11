import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import CippAddEditStoreGroups from "/src/components/CippComponents/CippAddEditStoreGroups";
import { useRouter } from "next/router";
import { ApiGetCall } from "/src/api/ApiCall";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  const formControl = useForm({
    mode: "onChange",
  });

  // Fetch store group data
  const storeGroupData = ApiGetCall({
    url: "/api/ListStoreGroups",
    data: { groupId: id },
    queryKey: `StoreGroup-${id}`,
    enabled: !!id,
  });

  // Set form values when data is loaded
  const group = storeGroupData.data?.Results?.find((g) => g.groupId === id);

  if (group && !formControl.formState.isDirty) {
    formControl.reset({
      groupId: group.groupId,
      groupName: group.groupName,
      groupDescription: group.groupDescription,
      members: group.members || [],
    });
  }

  return (
    <>
      <Head>
        <title>Edit Store Group - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="StoreGroupsList"
        title="Edit Store Group"
        backButtonTitle="Store Groups"
      >
        <CippAddEditStoreGroups
          formControl={formControl}
          title="Store Group Details"
          backButtonTitle="Store Groups"
          initialValues={group}
        />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
