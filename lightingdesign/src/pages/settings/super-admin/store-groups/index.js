import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { Button, SvgIcon } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { CippTablePage } from "/src/components/CippComponents/CippTablePage";
import Link from "next/link";

const Page = () => {
  const pageTitle = "Store Groups";

  const actions = [
    {
      label: "Edit Store Group",
      link: "/settings/super-admin/store-groups/edit?id=[groupId]",
      icon: <Edit />,
      color: "success",
      target: "_self",
    },
    {
      label: "Delete Store Group",
      type: "POST",
      url: "/api/ExecStoreGroup",
      data: {
        Action: "Delete",
        groupId: "groupId",
      },
      confirmText: "Are you sure you want to delete this store group?",
      icon: <Delete />,
      color: "danger",
    },
  ];

  const offCanvas = {
    extendedInfoFields: ["groupName", "groupDescription", "groupId", "members"],
    actions: actions,
  };

  const simpleColumns = ["groupName", "groupDescription"];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListStoreGroups"
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={simpleColumns}
      tenantInTitle={false}
      cardButton={
        <Button
          component={Link}
          href="/settings/super-admin/store-groups/add"
          startIcon={
            <SvgIcon fontSize="small">
              <Add />
            </SvgIcon>
          }
          variant="contained"
        >
          Add Store Group
        </Button>
      }
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
