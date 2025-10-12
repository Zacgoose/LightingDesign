# Customer and Job Detail Page Enhancements - Implementation Summary

## Overview
This document summarizes the enhancements made to the customer and job detail pages, adding comprehensive relationship tracking, pricing information, and resource assignment capabilities.

---

## Customer Enhancements

### New Fields Added

1. **Customer Type** (Single Select)
   - Options: Residential, Commercial, Builder, Trade
   - Purpose: Categorize customers for better filtering and reporting
   - Field: `customerType`

2. **Related Builders** (Multi-Select)
   - Select from customers marked as "Builder" type
   - Purpose: Track which builders the customer works with
   - Field: `relatedBuilders` (array of customer IDs)

3. **Trade Associations** (Multi-Select)
   - Options: Electrical, Plumbing, HVAC, Carpentry, Painting, Flooring, Landscaping
   - Purpose: Track which trades the customer is associated with
   - Field: `tradeAssociations` (array of trade values)

### Form Layout
The customer form now has the following structure:
- **Customer Information Section**
  - Customer Name*
  - Status* (Active/Inactive)
  - Email*
  - Phone
  - Customer Type (NEW)
  - Related Builders (NEW - Multi-select)
  - Trade Associations (NEW - Multi-select)

- **Address Section**
  - Street Address
  - City
  - State
  - Postal Code

- **Additional Information Section**
  - Notes (Multi-line text)

### API Changes

#### New Endpoints
- `GET /api/GetCustomer` - Retrieve customer by ID
- `POST /api/EditCustomer` - Update customer details

#### Updated Endpoints
- `POST /api/ExecNewCustomer` - Enhanced to support new fields
- `GET /api/ListCustomers` - Returns additional fields (customerType, email, phone)

---

## Job Enhancements

### New Fields Added

1. **Assigned Designer** (Single Select)
   - Options: John Doe, Jane Smith, Bob Johnson (hardcoded, can be API-driven)
   - Purpose: Track which designer is responsible for the job
   - Field: `assignedDesigner` (object with value/label)

2. **Builders** (Multi-Select)
   - Select from customers marked as "Builder" type
   - Purpose: Track which builders are involved in the job
   - Field: `builders` (array of customer objects with value/label)

3. **Related Trades** (Multi-Select)
   - Options: Electrical, Plumbing, HVAC, Carpentry, Painting, Flooring, Landscaping
   - Purpose: Track which trades are involved in the job
   - Field: `relatedTrades` (array of trade objects with value/label)

4. **Pricing Matrix** (New Section)
   Particularly useful for completed jobs to calculate costs for different parties:
   - Customer Price
   - Trade Price
   - Builder Price
   - Cost Basis
   - Markup Percentage
   - Field: `pricingMatrix` (object with nested fields)

### Form Layout
The job form now has the following structure:

- **Job Information Section**
  - Job Number*
  - Customer* (Dropdown)
  - Status* (Pending/In Progress/On Hold/Completed)
  - Estimated Value
  - Assigned Designer (NEW)
  - Builders (NEW - Multi-select)
  - Related Trades (NEW - Multi-select)
  - Description (Multi-line)

- **Location Section**
  - Address
  - City
  - State
  - Postal Code

- **Contact Information Section**
  - Contact Name
  - Contact Phone
  - Contact Email

- **Pricing Matrix Section** (NEW)
  - Customer Price
  - Trade Price
  - Builder Price
  - Cost Basis
  - Markup Percentage

- **Notes Section**
  - Internal Notes (Multi-line)

### API Changes

#### Updated Endpoints
- `GET /api/GetJob` - Returns new fields (relatedTrades, builders, assignedDesigner, pricingMatrix)
- `POST /api/EditJob` - Enhanced to support new fields
- `POST /api/ExecNewJob` - Enhanced to support new fields

---

## Technical Implementation Details

### Backend (PowerShell APIs)

#### Data Storage
All new fields are stored in Azure Table Storage with JSON serialization for complex objects:
- Arrays are stored as JSON strings using `ConvertTo-Json -Compress`
- Objects are retrieved and deserialized using `ConvertFrom-Json`

#### Field Structure
```powershell
# Customer Entity
$Entity = [PSCustomObject]@{
    # ... existing fields ...
    CustomerType      = $CustomerType
    RelatedBuilders   = ($RelatedBuilders | ConvertTo-Json -Compress)
    TradeAssociations = ($TradeAssociations | ConvertTo-Json -Compress)
}

# Job Entity
$Entity = [PSCustomObject]@{
    # ... existing fields ...
    RelatedTrades    = ($RelatedTrades | ConvertTo-Json -Compress)
    Builders         = ($Builders | ConvertTo-Json -Compress)
    AssignedDesigner = ($AssignedDesigner | ConvertTo-Json -Compress)
    PricingMatrix    = ($PricingMatrix | ConvertTo-Json -Compress)
}
```

### Frontend (React/Next.js)

#### Form Components
All new fields use the `CippFormComponent` with appropriate types:
- Single select: `type="autoComplete"`
- Multi-select: `type="autoComplete"` with `multiple` prop
- Text input: `type="textField"`

#### Data Transformation
Form data is transformed before API submission:
```javascript
// Multi-select fields
relatedBuilders: values.relatedBuilders?.map((b) => b.value) || []

// Single select with object
assignedDesigner: values.assignedDesigner?.value 
  ? { value: values.assignedDesigner.value, label: values.assignedDesigner.label }
  : null

// Nested object (pricing matrix)
pricingMatrix: values.pricingMatrix || {}
```

---

## Benefits

1. **Better Relationship Tracking**
   - Track connections between customers, builders, and trades
   - Understand which builders work with which customers
   - See trade associations at a glance

2. **Resource Management**
   - Assign designers to jobs for accountability
   - Track which builders and trades are on each job
   - Better resource planning and allocation

3. **Pricing Transparency**
   - Store pricing information for completed jobs
   - Calculate different prices for different parties (customer, trade, builder)
   - Track markup and cost basis for profitability analysis

4. **Improved Reporting**
   - Filter customers by type
   - Generate reports by designer, builder, or trade
   - Analyze pricing across jobs

---

## Future Enhancements

Potential improvements that could be made:

1. **Dynamic Designer List**
   - Create a user management system
   - Fetch designers from an API instead of hardcoded list

2. **Trade Management**
   - Move trades to database for dynamic management
   - Add custom trade types per installation

3. **Builder Dashboard**
   - Create a view for builders to see their associated customers and jobs
   - Add builder-specific reporting

4. **Pricing Calculator**
   - Add automatic markup calculation
   - Create pricing templates
   - Generate quotes based on pricing matrix

5. **Advanced Filtering**
   - Filter jobs by assigned designer
   - Filter by builder or trade
   - Create saved filter sets

---

## Files Modified

### Backend API Files
1. `lightingdesign-api/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Designer/Customers/`
   - `Invoke-ExecGetCustomer.ps1` (NEW)
   - `Invoke-ExecEditCustomer.ps1` (NEW)
   - `Invoke-ExecNewCustomer.ps1` (MODIFIED)
   - `Invoke-ListCustomers.ps1` (MODIFIED)

2. `lightingdesign-api/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Designer/Jobs/`
   - `Invoke-ExecGetJob.ps1` (MODIFIED)
   - `Invoke-ExecEditJob.ps1` (MODIFIED)
   - `Invoke-ExecNewJob.ps1` (MODIFIED)

### Frontend Files
1. `lightingdesign/src/components/designer/`
   - `CustomerForm.jsx` (MODIFIED)
   - `JobForm.jsx` (MODIFIED)

2. `lightingdesign/src/pages/customers/`
   - `new/index.jsx` (MODIFIED)
   - `info/index.jsx` (MODIFIED)

3. `lightingdesign/src/pages/jobs/`
   - `new/index.jsx` (MODIFIED)
   - `info/index.jsx` (MODIFIED)

---

## Testing Checklist

- [x] Backend APIs created and updated
- [x] Frontend forms updated with new fields
- [x] Build process completed successfully
- [ ] Create new customer with all fields
- [ ] Edit existing customer with new fields
- [ ] Create new job with all fields
- [ ] Edit existing job with new fields
- [ ] Verify data persistence
- [ ] Test multi-select functionality
- [ ] Test pricing matrix calculations
- [ ] Verify dropdown options load correctly

---

## Conclusion

This implementation significantly enhances the customer and job management capabilities of the Lighting Design application by:
- Adding relationship tracking between customers, builders, and trades
- Implementing designer assignment for better resource management
- Creating a comprehensive pricing matrix for job cost tracking
- Improving data organization with customer type categorization

The changes are backward compatible, with all new fields being optional, ensuring existing data remains functional.
