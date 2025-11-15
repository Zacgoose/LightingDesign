import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import { CustomerForm } from "/src/components/designer/CustomerForm";

const Page = () => {
  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      status: { value: "active", label: "Active" },
    },
  });

  return (
    <>
      <Head>
        <title>New Customer - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        //queryKey="Customers"
        title="New Customer"
        backButtonTitle="Customers"
        postUrl="/api/ExecNewCustomer"
        customDataformatter={(values) => {
          const formattedData = {
            customerName: values.customerName,
            email: values.email,
            phone: values.phone,
            address: values.address,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            status: values.status?.value || values.status,
            notes: values.notes,
            customerType: values.customerType?.value,
          };

          // Only include relatedBuilders if it has values
          if (values.relatedBuilders && values.relatedBuilders.length > 0) {
            formattedData.relatedBuilders = values.relatedBuilders.map((b) => b.value || b);
          }

          // Only include tradeAssociations if it has values
          if (values.tradeAssociations && values.tradeAssociations.length > 0) {
            formattedData.tradeAssociations = values.tradeAssociations.map((t) => t.value || t);
          }

          return formattedData;
        }}
      >
        <CustomerForm formControl={formControl} mode="new" />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
