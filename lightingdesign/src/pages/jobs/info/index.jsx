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
        customDataformatter={(values) => ({
          jobId: id,
          jobName: values.jobName,
          customerId: values.customerId?.value || values.customerId,
          storeId: values.storeId?.value || values.storeId,
          status: values.status?.value || values.status,
          description: values.description,
          address: values.address,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          contactEmail: values.contactEmail,
          estimatedValue: values.estimatedValue,
          notes: values.notes,
          assignedDesigner: values.assignedDesigner?.value || values.assignedDesigner,
          builders: values.builders?.map((b) => b.value || b),
          relatedTrades: values.relatedTrades?.map((t) => t.value || t),
          pricingMatrix: values.pricingMatrix,
        })}
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
