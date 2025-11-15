import { Layout as DashboardLayout } from "/src/layouts/index";
import { CippTablePage } from "/src/components/CippComponents/CippTablePage";
import { Button } from "@mui/material";
import Link from "next/link";
import { Add, Edit, Delete, Visibility } from "@mui/icons-material";

const Page = () => {
  const pageTitle = "Customers";

  // Define actions for each customer row
  const actions = [
    {
      label: "View Customer Details",
      link: "/customers/info?id=[id]",
      icon: <Visibility />,
      color: "primary",
      target: "_self",
    },
    {
      label: "Edit Customer",
      link: "/customers/info?id=[id]&edit=true",
      icon: <Edit />,
      color: "success",
      target: "_self",
    },
    {
      label: "Delete Customer",
      type: "POST",
      url: "/api/execDeleteCustomer",
      data: {
        customerId: "id",
      },
      confirmText:
        "Are you sure you want to delete this customer? This will also affect related jobs.",
      icon: <Delete />,
      color: "danger",
    },
  ];

  // Define off-canvas details when clicking a row
  const offCanvas = {
    extendedInfoFields: ["customerName", "Status", "Email"],
    actions: actions,
  };

  // Filter options for the table
  const filterList = [
    {
      filterName: "Active Customers",
      value: [{ id: "status", value: "active" }],
      type: "column",
    },
    {
      filterName: "Inactive Customers",
      value: [{ id: "status", value: "inactive" }],
      type: "column",
    },
    {
      filterName: "New This Month",
      value: [{ id: "isNew", value: true }],
      type: "column",
    },
  ];

  // Columns to display in the table
  const simpleColumns = ["customerName", "Status", "Email"];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListCustomers"
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={simpleColumns}
      filters={filterList}
      cardButton={
        <Button component={Link} href="/customers/new" startIcon={<Add />} variant="contained">
          New Customer
        </Button>
      }
    />
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
