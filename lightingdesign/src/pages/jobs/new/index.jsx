import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import { JobForm } from "/src/components/designer/JobForm";

const Page = () => {
  const formControl = useForm({
    mode: "onChange",
  });

  return (
    <>
      <Head>
        <title>New Job - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="Jobs"
        title="New Job"
        backButtonTitle="Jobs"
        postUrl="/api/ExecNewJob"
        customDataformatter={(values) => ({
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
          builders: values.builders?.map((b) => b.value || b) || [],
          relatedTrades: values.relatedTrades?.map((t) => t.value || t) || [],
          pricingMatrix: values.pricingMatrix,
        })}
      >
        <JobForm formControl={formControl} mode="new" />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
