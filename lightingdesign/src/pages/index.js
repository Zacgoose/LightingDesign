import Head from "next/head";
import { Box, Container, Button, Card, CardContent } from "@mui/material";
import { Grid } from "@mui/system";
import { Layout as DashboardLayout } from "../layouts/index.js";
import { CippInfoBar } from "../components/CippCards/CippInfoBar";
import { CippChartCard } from "../components/CippCards/CippChartCard";
import { CippPropertyListCard } from "../components/CippCards/CippPropertyListCard";
import { ApiGetCall } from "../api/ApiCall.jsx";
import Link from "next/link";
import { Add, Visibility } from "@mui/icons-material";

const Page = () => {
  // Fetch user information
  const userInfo = ApiGetCall({
    url: "/api/GetUserInfo",
    queryKey: "UserInfo",
  });

  // Fetch user's assigned stores
  const assignedStores = ApiGetCall({
    url: "/api/ListUserStores",
    queryKey: "UserStores",
  });

  // Fetch job statistics for the user
  const jobStats = ApiGetCall({
    url: "/api/GetUserJobStats",
    queryKey: "UserJobStats",
  });

  // Top bar info - User details
  const userInfoBar = [
    {
      name: "Active Stores",
      data: assignedStores.data?.length || 0,
    },
  ];

  return (
    <>
      <Head>
        <title>Dashboard - Lighting Design</title>
      </Head>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth={false}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid size={{ md: 12, xs: 12 }}>
              <Card>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
                  <Button component={Link} href="/jobs" variant="contained" startIcon={<Add />}>
                    New Job
                  </Button>
                  <Button
                    component={Link}
                    href="/jobs"
                    variant="outlined"
                    startIcon={<Visibility />}
                  >
                    View All Jobs
                  </Button>
                  <Button
                    component={Link}
                    href="/customers"
                    variant="outlined"
                    startIcon={<Visibility />}
                  >
                    View Customers
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* User Info Bar */}
            <Grid size={{ md: 12, xs: 12 }}>
              <CippInfoBar data={userInfoBar} isFetching={userInfo.isFetching} />
            </Grid>

            {/* Job Status Chart */}
            <Grid size={{ md: 4, xs: 12 }}>
              <CippChartCard
                title="My Jobs Status"
                isFetching={jobStats.isFetching}
                chartType="pie"
                totalLabel="Total Jobs"
                customTotal={jobStats.data?.totalJobs}
                chartSeries={[
                  Number(jobStats.data?.pendingJobs || 0),
                  Number(jobStats.data?.inProgressJobs || 0),
                  Number(jobStats.data?.completedJobs || 0),
                ]}
                labels={["Pending", "In Progress", "Completed"]}
              />
            </Grid>

            {/* Jobs This Month */}
            <Grid size={{ md: 4, xs: 12 }}>
              <CippChartCard
                title="Jobs This Month"
                isFetching={jobStats.isFetching}
                chartType="bar"
                chartSeries={[
                  Number(jobStats.data?.jobsThisWeek || 0),
                  Number(jobStats.data?.jobsThisMonth || 0),
                ]}
                labels={["This Week", "This Month"]}
              />
            </Grid>

            {/* Customer Stats */}
            <Grid size={{ md: 4, xs: 12 }}>
              <CippChartCard
                title="Customer Overview"
                isFetching={jobStats.isFetching}
                chartType="donut"
                chartSeries={[
                  Number(jobStats.data?.activeCustomers || 0),
                  Number(jobStats.data?.newCustomers || 0),
                ]}
                labels={["Active Customers", "New Customers"]}
              />
            </Grid>

            {/* Assigned Stores */}
            <Grid size={{ md: 6, xs: 12 }}>
              <CippPropertyListCard
                title="Assigned Stores"
                showDivider={true}
                copyItems={false}
                isFetching={assignedStores.isFetching}
                propertyItems={assignedStores.data?.map((store) => ({
                  label: store.storeName,
                  value: store.location || "N/A",
                }))}
              />
            </Grid>

            {/* Quick Stats */}
            <Grid size={{ md: 6, xs: 12 }}>
              <CippPropertyListCard
                title="Quick Stats"
                showDivider={true}
                copyItems={false}
                isFetching={jobStats.isFetching}
                propertyItems={[
                  {
                    label: "Total Jobs",
                    value: jobStats.data?.totalJobs || 0,
                  },
                  {
                    label: "Jobs This Week",
                    value: jobStats.data?.jobsThisWeek || 0,
                  },
                  {
                    label: "Jobs This Month",
                    value: jobStats.data?.jobsThisMonth || 0,
                  },
                  {
                    label: "Active Customers",
                    value: jobStats.data?.activeCustomers || 0,
                  },
                ]}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
