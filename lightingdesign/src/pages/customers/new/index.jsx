import Head from "next/head";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import { CustomerForm } from "/src/components/designer/CustomerForm";

const Page = () => {
  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      status: { value: "active", label: "Active" },
      notes: "",
    },
  });

  return (
    <>
      <Head>
        <title>New Customer - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="AddCustomer"
        title="New Customer"
        backButtonTitle="Customers"
        postUrl="/api/AddCustomer"
        customDataformatter={(values) => {
          return {
            customerName: values.customerName,
            email: values.email,
            phone: values.phone,
            address: values.address,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            status: values.status?.value,
            notes: values.notes,
          };
        }}
      >
        <CustomerForm formControl={formControl} mode="new" />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;