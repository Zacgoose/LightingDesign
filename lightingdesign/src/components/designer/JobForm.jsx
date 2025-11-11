import { Box, Divider } from "@mui/material";
import { Grid } from "@mui/system";
import CippFormComponent from "../CippComponents/CippFormComponent";
import { CippFormStoreSelector } from "../CippComponents/CippFormStoreSelector";
import { ApiGetCall } from "../../api/ApiCall";

export const JobForm = ({ formControl, mode = "new" }) => {
  // Fetch customers for dropdown
  const customers = ApiGetCall({
    url: "/api/ListCustomers",
    queryKey: "Customers",
  });
  // Ensure customers.data is always an array
  const customerOptions = Array.isArray(customers.data)
    ? customers.data.map((customer) => ({
        value: customer.id,
        label: customer.customerName,
      }))
    : [];

  // Job status options
  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
  ];

  // Builder options (customers marked as builders)
  const builderOptions = Array.isArray(customers.data)
    ? customers.data
        .filter((c) => c.customerType === "builder" || !c.customerType)
        .map((customer) => ({
          value: customer.id,
          label: customer.customerName,
        }))
    : [];

  // Trade options
  const tradeOptions = [
    { value: "electrical", label: "Electrical" },
    { value: "plumbing", label: "Plumbing" },
    { value: "hvac", label: "HVAC" },
    { value: "carpentry", label: "Carpentry" },
    { value: "painting", label: "Painting" },
    { value: "flooring", label: "Flooring" },
    { value: "landscaping", label: "Landscaping" },
  ];

  // Designer options (for now, hardcoded - can be fetched from API later)
  const designerOptions = [
    { value: "designer1", label: "John Doe" },
    { value: "designer2", label: "Jane Smith" },
    { value: "designer3", label: "Bob Johnson" },
  ];

  return (
    <Grid container spacing={2}>
      {/* Job Information Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Job Information</Box>
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Job Number"
          name="jobNumber"
          formControl={formControl}
          validators={{ required: "Job Number is required" }}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="autoComplete"
          label="Customer"
          name="customerName"
          formControl={formControl}
          options={customerOptions}
          validators={{ required: "Customer is required" }}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormStoreSelector
          formControl={formControl}
          name="storeId"
          type="single"
          required={true}
          label="Store"
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
          label="Estimated Value"
          name="estimatedValue"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="autoComplete"
          label="Assigned Designer"
          name="assignedDesigner"
          formControl={formControl}
          options={designerOptions}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="autoComplete"
          label="Builders"
          name="builders"
          formControl={formControl}
          options={builderOptions}
          multiple
        />
      </Grid>

      <Grid size={12}>
        <CippFormComponent
          type="autoComplete"
          label="Related Trades"
          name="relatedTrades"
          formControl={formControl}
          options={tradeOptions}
          multiple
        />
      </Grid>

      <Grid size={12}>
        <CippFormComponent
          type="textField"
          label="Description"
          name="description"
          formControl={formControl}
          multiline
          rows={3}
        />
      </Grid>

      <Divider sx={{ my: 2, width: "100%" }} />

      {/* Location Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Location</Box>
      </Grid>

      <Grid size={12}>
        <CippFormComponent
          type="textField"
          label="Address"
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

      {/* Contact Information Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Contact Information</Box>
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Contact Name"
          name="contactName"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Contact Phone"
          name="contactPhone"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Contact Email"
          name="contactEmail"
          formControl={formControl}
        />
      </Grid>

      <Divider sx={{ my: 2, width: "100%" }} />

      {/* Pricing Matrix Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Pricing Matrix</Box>
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Customer Price"
          name="pricingMatrix.customerPrice"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Trade Price"
          name="pricingMatrix.tradePrice"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Builder Price"
          name="pricingMatrix.builderPrice"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Cost Basis"
          name="pricingMatrix.costBasis"
          formControl={formControl}
        />
      </Grid>

      <Grid size={{ md: 6, xs: 12 }}>
        <CippFormComponent
          type="textField"
          label="Markup Percentage"
          name="pricingMatrix.markupPercentage"
          formControl={formControl}
        />
      </Grid>

      <Divider sx={{ my: 2, width: "100%" }} />

      {/* Notes Section */}
      <Grid size={12}>
        <Box sx={{ mb: 2, fontSize: "1.1rem", fontWeight: 600 }}>Notes</Box>
      </Grid>

      <Grid size={12}>
        <CippFormComponent
          type="textField"
          label="Internal Notes"
          name="notes"
          formControl={formControl}
          multiline
          rows={4}
        />
      </Grid>
    </Grid>
  );
};
