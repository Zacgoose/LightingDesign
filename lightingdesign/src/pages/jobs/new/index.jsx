import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import { JobForm } from "/src/components/designer/JobForm";

const Page = () => {
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
      assignedDesigner: null,
      builders: [],
      relatedTrades: [],
      pricingMatrix: {
        customerPrice: "",
        tradePrice: "",
        builderPrice: "",
        costBasis: "",
        markupPercentage: "",
      },
    },
  });

  return (
    <>
      <Head>
        <title>New Job - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="AddJob"
        title="New Job"
        backButtonTitle="Jobs"
        postUrl="/api/ExecNewJob"
        customDataformatter={(values) => {
          return {
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
            assignedDesigner: values.assignedDesigner?.value 
              ? { value: values.assignedDesigner.value, label: values.assignedDesigner.label }
              : null,
            builders: values.builders?.map((b) => ({ value: b.value, label: b.label })) || [],
            relatedTrades: values.relatedTrades?.map((t) => ({ value: t.value, label: t.label })) || [],
            pricingMatrix: values.pricingMatrix || {},
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