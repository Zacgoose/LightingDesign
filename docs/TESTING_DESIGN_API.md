# Testing Guide for Job Design Save/Load API

This guide provides manual testing steps to verify the job design save/load functionality.

## Prerequisites

1. Azure Storage Emulator must be running (run `Start-DevEmulators.ps1`)
2. Azure Functions API must be running (`func start` in lightingdesign-api directory)
3. Next.js frontend must be running (`npm run dev` in lightingdesign directory)

## Test Scenarios

### Test 1: Create a New Job

1. Navigate to http://localhost:3000/jobs
2. Click "New Job" button
3. Fill in the form:
   - Job Number: TEST-001
   - Select a customer (or leave empty)
   - Status: Pending
   - Description: Test job for design save
   - Fill in contact details
4. Click "Submit"
5. Verify success message appears
6. Verify new job appears in the jobs list

**Expected Result:** Job is created and visible in the list

### Test 2: View Job Details

1. From the jobs list, click on the TEST-001 job
2. Verify all entered details are displayed correctly
3. Verify "Open Design" button is visible

**Expected Result:** All job details are displayed correctly

### Test 3: Open Design Page

1. From the job details page, click "Open Design" button
2. Verify the design page loads with an empty canvas
3. Check browser console for any errors

**Expected Result:** Design page loads successfully with empty canvas

### Test 4: Add Products to Design

1. On the design page, click on a product type in the drawer
2. Click on the canvas to place products
3. Add 3-5 different products
4. Verify products appear on the canvas

**Expected Result:** Products are placed successfully on the canvas

### Test 5: Manual Save

1. After adding products, click the "Save" button in the toolbar
2. Verify a success toast notification appears
3. Check browser console for "Design saved successfully" message

**Expected Result:** Save succeeds with confirmation message

### Test 6: Reload and Verify Persistence

1. Refresh the browser page (F5)
2. Wait for the design to load
3. Verify all previously placed products are still present
4. Verify product positions and properties are correct

**Expected Result:** Design loads with all saved products in correct positions

### Test 7: Add Connectors

1. Click the "Connect" tool in the toolbar
2. Click on one product, then click on another to create a connector
3. Add 2-3 connectors between products
4. Click "Save" button
5. Refresh the page
6. Verify connectors are restored

**Expected Result:** Connectors are saved and restored correctly

### Test 8: Auto-Save

1. Add or move some products
2. Wait for 2 minutes without saving manually
3. Check browser console for "Auto-saving design..." message
4. Verify a save operation occurs
5. Refresh the page to verify changes were saved

**Expected Result:** Design auto-saves after 2 minutes and changes persist

### Test 9: Navigate Away and Return

1. While on the design page with unsaved changes
2. Click the back button or navigate to jobs list
3. Navigate back to the job details
4. Click "Open Design" again
5. Verify the design loads with the last saved state

**Expected Result:** Last saved state is preserved

### Test 10: Edit Job Details

1. Navigate back to job details page
2. Click "Submit" to edit the job
3. Change job status to "In Progress"
4. Save the changes
5. Verify changes are saved
6. Click "Open Design" again
7. Verify design still loads correctly

**Expected Result:** Job edits don't affect design data

### Test 11: Delete Job

1. Navigate to jobs list
2. Click "Delete Job" action for TEST-001
3. Confirm the deletion
4. Verify job is removed from the list
5. Try to navigate to the job's design page directly
6. Verify appropriate error or empty state

**Expected Result:** Job and associated design are deleted

## API Testing with cURL

You can also test the API endpoints directly:

### Create a Job
```bash
curl -X POST http://localhost:7071/api/ExecNewJob \
  -H "Content-Type: application/json" \
  -d '{
    "jobNumber": "API-TEST-001",
    "status": "pending",
    "description": "Test via API"
  }'
```

### Get Job Details
```bash
curl "http://localhost:7071/api/ExecGetJob?jobId={job-guid}"
```

### Save Design
```bash
curl -X POST http://localhost:7071/api/ExecSaveDesign \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "{job-guid}",
    "designData": {
      "products": [
        {
          "id": "test-product-1",
          "product_type": "beacon",
          "x": 100,
          "y": 200
        }
      ],
      "connectors": [],
      "layers": []
    }
  }'
```

### Get Design
```bash
curl "http://localhost:7071/api/ExecGetDesign?jobId={job-guid}"
```

### List Jobs
```bash
curl "http://localhost:7071/api/ListJobs?ListJobs=true"
```

### Delete Job
```bash
curl -X POST http://localhost:7071/api/ExecDeleteJob \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "{job-guid}"
  }'
```

## Troubleshooting

### Issue: Design doesn't load
- Check browser console for errors
- Verify job ID is present in the URL
- Check API is running and accessible
- Check Azure Storage Emulator is running

### Issue: Save fails
- Check browser console for error messages
- Verify API endpoint is accessible
- Check network tab in browser dev tools for API response
- Verify job ID is valid

### Issue: Auto-save not working
- Check browser console for "Auto-saving design..." messages
- Verify there are unsaved changes
- Wait the full 2 minutes
- Check `hasUnsavedChanges` state in React DevTools

### Issue: Products disappear after reload
- Verify save was successful (check for success toast)
- Check that design was actually saved (use browser network tab)
- Verify GetDesign API returns correct data
- Check for JavaScript errors in console

## Performance Testing

For larger designs:
1. Add 50+ products to the canvas
2. Save the design
3. Measure save time (should be < 2 seconds)
4. Reload the page
5. Measure load time (should be < 3 seconds)
6. Verify all products render correctly

## Browser Compatibility

Test in:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

Verify all functionality works consistently across browsers.
