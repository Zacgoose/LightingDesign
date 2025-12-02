import Head from "next/head";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import { JobForm } from "/src/components/designer/JobForm";
import { ApiGetCall } from "/src/api/ApiCall";
import { useEffect } from "react";
import { Button } from "@mui/material";
import { DesignServices } from "@mui/icons-material";
import Link from "next/link";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  const formControl = useForm({
    mode: "onChange",
  });

  // Fetch job details
  const jobDetails = ApiGetCall({
    url: "/api/ExecGetJob",
    data: { jobId: id },
    queryKey: `Job-${id}`,
    waiting: !!id,
  });

  // Update form when job details load
  useEffect(() => {
    if (jobDetails.isSuccess && jobDetails.data) {
      const cleanedData = {
        ...jobDetails.data,
        relatedTrades: jobDetails.data.relatedTrades || undefined,
        builders: jobDetails.data.builders || undefined,
      };
      
      formControl.reset(cleanedData);
    }
  }, [jobDetails.isSuccess, jobDetails.data]);

  return (
    <>
      <Head>
        <title>Job Details - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        title={`Job: ${jobDetails.data?.jobName || "Loading..."}`}
        backButtonTitle="Jobs"
        postUrl="/api/ExecEditJob"
        customDataformatter={(values) => {
          // Helper to safely extract value
          const extractValue = (obj) => {
            if (!obj) return null;
            if (typeof obj === 'string') return obj;
            return obj.value || null;
          };

          const extractArrayValues = (arr) => {
            if (!Array.isArray(arr) || arr.length === 0) return [];
            return arr.map(extractValue).filter(v => v != null);
          };

          return {
            jobId: id,
            jobName: values.jobName || null,
            customerId: extractValue(values.customerId),
            storeId: extractValue(values.storeId),
            status: extractValue(values.status),
            description: values.description || null,
            address: values.address || null,
            city: values.city || null,
            state: values.state || null,
            postalCode: values.postalCode || null,
            contactName: values.contactName || null,
            contactPhone: values.contactPhone || null,
            contactEmail: values.contactEmail || null,
            estimatedValue: values.estimatedValue || null,
            notes: values.notes || null,
            assignedDesigner: extractValue(values.assignedDesigner),
            builders: extractArrayValues(values.builders),
            relatedTrades: extractArrayValues(values.relatedTrades),
            pricingMatrix: values.pricingMatrix || null,
          };
        }}
        addedButtons={
          <Button
            component={Link}
            href={`/jobs/design?id=${id}`}
            variant="outlined"
            startIcon={<DesignServices />}
            disabled={!id}
          >
            Open Design
          </Button>
        }
      >
        <JobForm formControl={formControl} mode="edit" />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
