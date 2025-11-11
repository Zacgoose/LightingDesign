import Head from "next/head";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import { CippFormStoreSelector } from "/src/components/CippComponents/CippFormStoreSelector";
import CippFormComponent from "/src/components/CippComponents/CippFormComponent";
import { Stack } from "@mui/material";
import { ApiGetCall } from "/src/api/ApiCall";
import { useEffect } from "react";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  // Fetch store group data
  const groupData = ApiGetCall({
    url: "/api/ExecGetStoreGroup",
    data: { groupId: id },
    queryKey: `StoreGroup-${id}`,
    enabled: !!id,
  });

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      groupName: "",
      groupDescription: "",
      members: [],
    },
  });

  // Update form when group data loads
  useEffect(() => {
    if (groupData.data) {
      formControl.reset({
        groupId: groupData.data.groupId,
        groupName: groupData.data.groupName,
        groupDescription: groupData.data.groupDescription,
        members: groupData.data.members || [],
      });
    }
  }, [groupData.data]);

  return (
    <>
      <Head>
        <title>Edit Store Group - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="StoreGroupsList"
        title={`Edit Store Group: ${groupData.data?.groupName || "Loading..."}`}
        backButtonTitle="Store Groups"
        postUrl="/api/ExecStoreGroup"
        customDataformatter={(values) => {
          return {
            Action: "AddEdit",
            groupId: id,
            groupName: values.groupName,
            groupDescription: values.groupDescription,
            members: values.members?.map((m) => m.value) || [],
          };
        }}
      >
        <Stack spacing={2}>
          <CippFormComponent
            type="textField"
            name="groupName"
            label="Group Name"
            placeholder="Enter the name for this group"
            formControl={formControl}
            required
          />
          <CippFormComponent
            type="textField"
            name="groupDescription"
            label="Group Description"
            placeholder="Enter a description for this group"
            formControl={formControl}
          />
          <CippFormStoreSelector
            formControl={formControl}
            multiple={true}
            required={false}
            disableClearable={false}
            name="members"
            valueField="storeId"
            placeholder="Select stores to add to this group"
          />
        </Stack>
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
