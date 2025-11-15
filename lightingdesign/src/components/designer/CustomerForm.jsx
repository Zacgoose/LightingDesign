import { Box, Divider } from "@mui/material";
import { Grid } from "@mui/system";
import CippFormComponent from "../CippComponents/CippFormComponent";
import { ApiGetCall } from "../../api/ApiCall";

export const CustomerForm = ({ formControl, mode = "new" }) => {
  // Customer status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Customer type options
  const customerTypeOptions = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "builder", label: "Builder" },
    { value: "trade", label: "Trade" },
  ];

  // Fetch customers for builder selection (excluding current customer)
  const customers = ApiGetCall({
    url: "/api/ListCustomers",
    queryKey: "Customers",
  });

  const builderOptions = Array.isArray(customers.data)
    ? customers.data
        .filter((c) => c.customerType === "builder" || !c.customerType)
        .map((customer) => ({
          value: customer.id,
          label: customer.customerName,
        }))
    : [];

  // Trade options (for now, hardcoded - can be moved to API later)
  const tradeOptions = [
    { value: "electrical", label: "Electrical" },
    { value: "plumbing", label: "Plumbing" },
    { value: "hvac", label: "HVAC" },
    { value: "carpentry", label: "Carpentry" },
    { value: "painting", label: "Painting" },
    { value: "flooring", label: "Flooring" },
    { value: "landscaping", label: "Landscaping" },
  ];

  return (
    <Grid container spacing={2}>
      {/* Customer Information Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Customer Information</Box>
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Customer Name"
          name="customerName"
          formControl={formControl}
          validators={{ required: "Customer Name is required" }}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="autoComplete"
          label="Status"
          name="status"
          formControl={formControl}
          options={statusOptions}
          validators={{ required: "Status is required" }}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Email"
          name="email"
          formControl={formControl}
          validators={{
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          }}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent type="textField" label="Phone" name="phone" formControl={formControl} />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="autoComplete"
          label="Customer Type"
          name="customerType"
          formControl={formControl}
          options={customerTypeOptions}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="autoComplete"
          label="Related Builders"
          name="relatedBuilders"
          formControl={formControl}
          options={builderOptions}
          multiple
        />
      </Grid>

      <Grid size={12}>
        <CippFormComponent
          type="autoComplete"
          label="Trade Associations"
          name="tradeAssociations"
          formControl={formControl}
          options={tradeOptions}
          multiple
        />
      </Grid>

      <Divider sx={{ my: 2, width: "100%" }} />

      {/* Address Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Address</Box>
      </Grid>

      <Grid size={12}>
        <CippFormComponent
          type="textField"
          label="Street Address"
          name="address"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent type="textField" label="City" name="city" formControl={formControl} />
      </Grid>

      <Grid size={{ md: 3, xs: 12 }}>
        <CippFormComponent type="textField" label="State" name="state" formControl={formControl} />
      </Grid>

      <Grid size={{ md: 3, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Postal Code"
          name="postalCode"
          formControl={formControl}
        />
      </Grid>

      <Divider sx={{ my: 2, width: "100%" }} />

      {/* Additional Information Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Additional Information</Box>
      </Grid>

      <Grid size={12}>
        <CippFormComponent
          type="textField"
          label="Notes"
          name="notes"
          formControl={formControl}
          multiline
          rows={4}
        />
      </Grid>
    </Grid>
  );
};
