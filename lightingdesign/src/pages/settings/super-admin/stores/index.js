import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { Button, SvgIcon } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { CippTablePage } from "/src/components/CippComponents/CippTablePage";
import Link from "next/link";

const Page = () => {
  const pageTitle = "Stores";

  const actions = [
    {
      label: "Edit Store",
      link: "/settings/super-admin/stores/edit?id=[storeId]",
      icon: <Edit />,
      color: "success",
      target: "_self",
    },
    {
      label: "Delete Store",
      type: "POST",
      url: "/api/ExecStore",
      data: {
        Action: "Delete",
        storeId: "storeId",
      },
      confirmText: "Are you sure you want to delete this store?",
      icon: <Delete />,
      color: "danger",
    },
  ];

  const offCanvas = {
    extendedInfoFields: ["storeName", "storeCode", "storeId", "location", "status"],
    actions: actions,
  };

  const simpleColumns = ["storeName", "storeCode", "location", "status"];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListStores"
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={simpleColumns}
      tenantInTitle={false}
      cardButton={
        <Button
          component={Link}
          href="/settings/super-admin/stores/add"
          startIcon={
            <SvgIcon fontSize="small">
              <Add />
            </SvgIcon>
          }
          variant="contained"
        >
          Add Store
        </Button>
      }
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
