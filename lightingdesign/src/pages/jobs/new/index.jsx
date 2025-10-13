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
      >
        <JobForm formControl={formControl} mode="new" />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;