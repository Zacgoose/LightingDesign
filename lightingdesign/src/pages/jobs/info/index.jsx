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

  // Fetch job details
  const jobDetails = ApiGetCall({
    url: "/api/ExecGetJob",
    data: { jobId: id },
    queryKey: `Job-${id}`,
    enabled: !!id,
  });

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      jobNumber: "",
      customerName: null,
      status: { value: "pending", label: "Pending" },
      description: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      estimatedValue: "",
      notes: "",
    },
  });

  // Update form when job details load
  useEffect(() => {
    if (jobDetails.data) {
      formControl.reset(jobDetails.data);
    }
  }, [jobDetails.data]);

  return (
    <>
      <Head>
        <title>Job Details - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="EditJob"
        title={`Job: ${jobDetails.data?.jobNumber || "Loading..."}`}
        backButtonTitle="Jobs"
        postUrl="/api/EditJob"
        customDataformatter={(values) => {
          return {
            jobId: id,
            jobNumber: values.jobNumber,
            customerId: values.customerName?.value,
            status: values.status?.value,
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