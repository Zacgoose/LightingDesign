import Head from "next/head";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "/src/layouts/index";
import { useForm } from "react-hook-form";
import CippFormPage from "/src/components/CippFormPages/CippFormPage";
import { CustomerForm } from "/src/components/designer/CustomerForm";
import { ApiGetCall } from "/src/api/ApiCall";
import { useEffect } from "react";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  // Fetch customer details
  const customerDetails = ApiGetCall({
    url: "/api/GetCustomer",
    data: { customerId: id },
    queryKey: `Customer-${id}`,
    enabled: !!id,
  });

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
      customerType: null,
      relatedBuilders: [],
      tradeAssociations: [],
    },
  });

  // Update form when customer details load
  useEffect(() => {
    if (customerDetails.data) {
      formControl.reset(customerDetails.data);
    }
  }, [customerDetails.data]);

  return (
    <>
      <Head>
        <title>Customer Details - Lighting Design</title>
      </Head>
      <CippFormPage
        formControl={formControl}
        queryKey="EditCustomer"
        title={`Customer: ${customerDetails.data?.customerName || "Loading..."}`}
        backButtonTitle="Customers"
        postUrl="/api/EditCustomer"
        customDataformatter={(values) => {
          return {
            customerId: id,
            customerName: values.customerName,
            email: values.email,
            phone: values.phone,
            address: values.address,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            status: values.status?.value,
            notes: values.notes,
            customerType: values.customerType?.value,
            relatedBuilders: values.relatedBuilders?.map((b) => b.value) || [],
            tradeAssociations: values.tradeAssociations?.map((t) => t.value) || [],
          };
        }}
      >
        <CustomerForm formControl={formControl} mode="edit" />
      </CippFormPage>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
