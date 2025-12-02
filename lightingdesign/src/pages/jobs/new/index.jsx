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
      >
        <JobForm formControl={formControl} mode="new" />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
