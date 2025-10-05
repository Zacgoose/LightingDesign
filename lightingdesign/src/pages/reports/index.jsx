import Head from "next/head";
import { Box, Container, Typography, Card, CardContent } from "@mui/material";
import { Grid } from "@mui/system";
import { Layout as DashboardLayout } from "../../layouts/index";
import { DocumentChartBarIcon } from "@heroicons/react/24/outline";

const Page = () => {
  return (
    <>
      <Head>
        <title>Reports - Lighting Design</title>
      </Head>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth={false}>
          <Grid container spacing={3}>
            <Grid size={{ md: 12, xs: 12 }}>
              <Card>
                <CardContent sx={{ textAlign: "center", py: 8 }}>
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                    <DocumentChartBarIcon style={{ width: 80, height: 80, opacity: 0.5 }} />
                  </Box>
                  <Typography variant="h4" gutterBottom>
                    Reports
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    This page will contain various reports including job reports, customer analytics, 
                    product usage statistics, and more.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Coming soon...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;