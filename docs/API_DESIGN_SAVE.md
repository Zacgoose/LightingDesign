# Job Design Save/Load API Documentation

This document describes the new API endpoints and frontend functionality for managing job designs in the LightingDesign application.

## Overview

The system now supports full CRUD operations for jobs and their associated designs. Users can:
- Create new jobs with complete job information
- Edit existing job details
- Delete jobs (which also deletes associated designs)
- Save and load design data (products, connectors, layers, canvas settings)
- Auto-save designs every 2 minutes

## Backend API Endpoints

All endpoints are located in `/lightingdesign-api/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Designer/Jobs/`

### 1. Create a New Job
**Endpoint:** `/api/ExecNewJob`  
**Method:** POST  
**File:** `Invoke-ExecNewJob.ps1`

**Request Body:**
```json
{
  "jobNumber": "JOB-001",
  "customerId": "customer-guid",
  "status": "pending",
  "description": "Job description",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "postalCode": "12345",
  "contactName": "John Doe",
  "contactPhone": "555-1234",
  "contactEmail": "john@example.com",
  "estimatedValue": "10000",
  "notes": "Additional notes"
}
```

**Response:**
```json
{
  "Results": "Job created successfully",
  "JobId": "newly-created-guid",
  "RowKey": "newly-created-guid"
}
```

### 2. Get Job Details
**Endpoint:** `/api/ExecGetJob?jobId={jobId}`  
**Method:** GET  
**File:** `Invoke-ExecGetJob.ps1`

**Response:**
```json
{
  "jobId": "job-guid",
  "jobNumber": "JOB-001",
  "customerName": {
    "value": "customer-guid",
    "label": "Customer Name"
  },
  "status": {
    "value": "pending",
    "label": "Pending"
  },
  "description": "Job description",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "postalCode": "12345",
  "contactName": "John Doe",
  "contactPhone": "555-1234",
  "contactEmail": "john@example.com",
  "estimatedValue": "10000",
  "notes": "Additional notes",
  "createdDate": "2025-10-12T08:00:00Z",
  "user": "username"
}
```

### 3. Edit Job
**Endpoint:** `/api/ExecEditJob`  
**Method:** POST  
**File:** `Invoke-ExecEditJob.ps1`

**Request Body:**
```json
{
  "jobId": "job-guid",
  "jobNumber": "JOB-001-UPDATED",
  "customerId": "customer-guid",
  "status": "in_progress",
  // ... other job fields
}
```

**Response:**
```json
{
  "Results": "Job updated successfully",
  "JobId": "job-guid"
}
```

### 4. Delete Job
**Endpoint:** `/api/ExecDeleteJob`  
**Method:** POST  
**File:** `Invoke-ExecDeleteJob.ps1`

**Request Body:**
```json
{
  "jobId": "job-guid"
}
```

**Response:**
```json
{
  "Results": "Job deleted successfully"
}
```

**Note:** This endpoint also deletes any associated design data.

### 5. Save Design
**Endpoint:** `/api/ExecSaveDesign`  
**Method:** POST  
**File:** `Invoke-ExecSaveDesign.ps1`

**Request Body:**
```json
{
  "jobId": "job-guid",
  "designData": {
    "products": [
      {
        "id": "product-1",
        "product_type": "beacon",
        "x": 100,
        "y": 200,
        "rotation": 45,
        "size": 10,
        "color": "#ff0000"
      }
    ],
    "connectors": [
      {
        "id": "connector-1",
        "from": "product-1",
        "to": "product-2",
        "points": [100, 200, 300, 400]
      }
    ],
    "layers": [],
    "canvasSettings": {
      "width": 4200,
      "height": 2970,
      "scale": 1,
      "position": { "x": 2100, "y": 1485 }
    }
  }
}
```

**Response:**
```json
{
  "Results": "Design saved successfully",
  "DesignId": "design-guid",
  "JobId": "job-guid"
}
```

**Notes:**
- If a design already exists for the job, it will be updated
- If no design exists, a new one will be created
- Design data is stored as JSON in the Designs table

### 6. Get Design
**Endpoint:** `/api/ExecGetDesign?jobId={jobId}`  
**Method:** GET  
**File:** `Invoke-ExecGetDesign.ps1`

**Response:**
```json
{
  "designId": "design-guid",
  "jobId": "job-guid",
  "designData": {
    "products": [...],
    "connectors": [...],
    "layers": [],
    "canvasSettings": {...}
  },
  "lastModified": "2025-10-12T08:30:00",
  "created": "2025-10-12T08:00:00Z"
}
```

**Notes:**
- If no design exists for the job, returns an empty design structure
- Empty structure includes empty arrays for products, connectors, and layers

### 7. List Jobs
**Endpoint:** `/api/ListJobs?ListJobs=true`  
**Method:** GET  
**File:** `Invoke-ListJobs.ps1`

**Response:**
```json
[
  {
    "DateTime": "2025-10-12T08:00:00Z",
    "JobName": "Job Name",
    "JobNumber": "JOB-001",
    "CustomerName": "Customer Name",
    "Status": "pending",
    "User": "username",
    "RowKey": "job-guid",
    "id": "job-guid",
    "createdDate": "2025-10-12T08:00:00Z",
    "assignedTo": "username",
    "totalValue": "10000"
  }
]
```

## Frontend Integration

### Design Page (`/lightingdesign/src/pages/jobs/design/index.jsx`)

The design page now includes:

1. **Loading Design Data**
   - Automatically loads design when the page opens with a job ID
   - Shows a loading indicator while fetching data
   - Populates products, connectors, and layers from saved data

2. **Save Functionality**
   - Manual save via the Save button in the toolbar
   - Displays toast notifications on success/failure
   - Tracks unsaved changes state
   - Records last saved timestamp

3. **Auto-Save**
   - Automatically saves every 2 minutes if there are unsaved changes
   - Only runs when not already saving
   - Logs auto-save events to console

4. **State Management**
   - `isSaving` - Boolean indicating save in progress
   - `lastSaved` - Timestamp of last successful save
   - `hasUnsavedChanges` - Boolean indicating if there are unsaved changes

### Job Info Page (`/lightingdesign/src/pages/jobs/info/index.jsx`)

Added an "Open Design" button that:
- Links to the design page with the current job ID
- Uses the Material-UI Design icon
- Is disabled if no job ID is available

### Job List Page (`/lightingdesign/src/pages/jobs/index.jsx`)

Updated to:
- Use the correct API endpoint with ListJobs parameter
- Use RowKey field for action links
- Support delete operations via ExecDeleteJob endpoint

## Database Schema

### Jobs Table
- **Table Name:** `Jobs`
- **Partition Key:** `'Job'`
- **Row Key:** GUID (job ID)
- **Fields:**
  - JobNumber
  - JobName
  - CustomerId
  - Status
  - Description
  - Address
  - City
  - State
  - PostalCode
  - ContactName
  - ContactPhone
  - ContactEmail
  - EstimatedValue
  - Notes
  - Username
  - Timestamp (auto)

### Designs Table
- **Table Name:** `Designs`
- **Partition Key:** `'Design'`
- **Row Key:** GUID (design ID)
- **Fields:**
  - JobId (references Jobs table)
  - DesignData (JSON string containing products, connectors, layers, canvas settings)
  - LastModified
  - Timestamp (auto)

## Usage Flow

### Creating and Designing a Job

1. User clicks "New Job" on the jobs list page
2. User fills in job details (job number, customer, status, etc.)
3. System creates job via `/api/ExecNewJob`
4. User clicks "Open Design" button on job info page
5. Design page loads with empty canvas
6. User adds products and connectors
7. System auto-saves every 2 minutes or user clicks Save button
8. Design data is saved via `/api/ExecSaveDesign`

### Editing an Existing Job Design

1. User navigates to jobs list
2. User clicks "View Job Details" for a job
3. User clicks "Open Design" button
4. Design page loads existing design via `/api/ExecGetDesign`
5. Products and connectors are restored to canvas
6. User makes changes
7. Changes are saved automatically or manually

### Deleting a Job

1. User navigates to jobs list
2. User clicks "Delete Job" for a job
3. System confirms deletion
4. Job and associated design are deleted via `/api/ExecDeleteJob`

## Error Handling

All API endpoints include error handling for:
- Missing required parameters (returns 400 Bad Request)
- Job/Design not found (returns 404 Not Found)
- Invalid data (returns 400 Bad Request)
- Server errors (returns 500 Internal Server Error)

Frontend shows toast notifications for:
- Successful save operations
- Failed save operations with error message
- Missing job ID when attempting to save

## Future Enhancements

Potential improvements for future versions:
1. Save canvas background image URL
2. Support for versioning/history of design changes
3. Collaborative editing with real-time sync
4. Export designs to various formats (PDF, PNG, etc.)
5. Design templates and libraries
6. Undo/redo across sessions
7. Design validation and warnings
