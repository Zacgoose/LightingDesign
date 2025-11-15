import { Layout as DashboardLayout } from "/src/layouts/index";
import { CippTablePage } from "/src/components/CippComponents/CippTablePage";
import { Button } from "@mui/material";
import Link from "next/link";
import { Add, Feed, Delete, DesignServices } from "@mui/icons-material";

const Page = () => {
  const pageTitle = "Jobs";

  // Define actions for each job row
  const actions = [
    {
      label: "Job Details",
      link: "/jobs/info?id=[RowKey]",
      icon: <Feed />,
      color: "primary",
      target: "_self",
    },
    {
      label: "Design",
      link: "/jobs/design?id=[RowKey]",
      icon: <DesignServices />,
      color: "success",
      target: "_self",
    },
    {
      label: "Delete Job",
      type: "POST",
      url: "/api/ExecDeleteJob",
      data: {
        jobId: "RowKey",
      },
      confirmText: "Are you sure you want to delete this job? This action cannot be undone.",
      icon: <Delete />,
      color: "danger",
    },
  ];

  // Define off-canvas details when clicking a row
  const offCanvas = {
    extendedInfoFields: [
      "jobName",
      "customerName",
      "status",
      "createdDate",
      "dueDate",
      "assignedTo",
      "totalValue",
    ],
    actions: actions,
  };

  // Filter options for the table
  const filterList = [
    {
      filterName: "Pending Jobs",
      value: [{ id: "status", value: "pending" }],
      type: "column",
    },
    {
      filterName: "In Progress",
      value: [{ id: "status", value: "in_progress" }],
      type: "column",
    },
    {
      filterName: "Completed Jobs",
      value: [{ id: "status", value: "completed" }],
      type: "column",
    },
    {
      filterName: "On Hold",
      value: [{ id: "status", value: "on_hold" }],
      type: "column",
    },
  ];

  // Columns to display in the table
  const simpleColumns = ["JobNumber", "CustomerName", "Status", "User", "createdDate"];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListJobs?ListJobs=true"
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={simpleColumns}
      filters={filterList}
      cardButton={
        <Button component={Link} href="/jobs/new" startIcon={<Add />} variant="contained">
          New Job
        </Button>
      }
    />
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
