# Background Image Single Floor Fix - Test Plan

## Overview
This document provides comprehensive manual test cases to verify that the background image upload and save functionality works correctly with single and multiple floors.

## Pre-requisites
- LightingDesign application running locally or in a test environment
- Access to the design page (/jobs/design?id={jobId})
- Sample images for testing (at least 3 different images)

## Test Cases

### Test Case 1: Single Floor - New Background Upload
**Objective**: Verify that a background image can be uploaded and saved on a single floor design.

**Steps**:
1. Create a new job or open an existing job with no background images
2. Navigate to the design page
3. Verify that only ONE floor layer exists (check Layer Switcher)
4. Click "Upload Floor Plan" button
5. Select an image file (e.g., floor-plan-1.png)
6. Verify the image appears on the canvas
7. Click "Save Project" button
8. Wait for save confirmation
9. Refresh the browser page
10. Verify the background image is still visible after reload

**Expected Results**:
- ✓ Background image displays immediately after upload
- ✓ Background image is saved with the design
- ✓ Background image persists after page reload
- ✓ No errors in browser console

**Status**: [ ] PASS / [ ] FAIL

---

### Test Case 2: Single Floor - Replace Background Image
**Objective**: Verify that a background image can be replaced on a single floor.

**Steps**:
1. Open a design that already has a background image (use Test Case 1 result)
2. Note the current background image
3. Click "Upload Floor Plan" button
4. Select a DIFFERENT image file
5. Verify the new image appears on the canvas (replacing the old one)
6. Click "Save Project" button
7. Refresh the page
8. Verify the NEW background image is visible (not the old one)

**Expected Results**:
- ✓ New background image replaces the old one immediately
- ✓ New background image is saved correctly
- ✓ No remnants of the old image after reload

**Status**: [ ] PASS / [ ] FAIL

---

### Test Case 3: Multiple Floors - Upload to Each Floor
**Objective**: Verify that different background images can be uploaded to multiple floors.

**Steps**:
1. Create or open a design
2. Add a second floor (if not already present) using Layer Switcher
3. On Floor 1: Upload floor-plan-1.png
4. Switch to Floor 2: Upload floor-plan-2.png
5. Switch back to Floor 1: Verify floor-plan-1.png is displayed
6. Switch to Floor 2: Verify floor-plan-2.png is displayed
7. Click "Save Project"
8. Refresh the page
9. Check Floor 1: Verify floor-plan-1.png is displayed
10. Check Floor 2: Verify floor-plan-2.png is displayed

**Expected Results**:
- ✓ Each floor displays its own background image
- ✓ Images don't get mixed up when switching floors
- ✓ All floor images persist after save and reload

**Status**: [ ] PASS / [ ] FAIL

---

### Test Case 4: Quick Upload and Switch (Timing Test)
**Objective**: Verify that background images are saved correctly even with rapid actions.

**Steps**:
1. Open a design with at least 2 floors
2. Switch to Floor 2
3. Upload a background image
4. **IMMEDIATELY** (within 1 second) switch to Floor 1
5. Upload a different background image to Floor 1
6. **IMMEDIATELY** switch back to Floor 2
7. Verify Floor 2's image is still there
8. Switch to Floor 1
9. Verify Floor 1's image is there
10. Save the design
11. Reload and verify both images are present

**Expected Results**:
- ✓ Both images are preserved despite quick switching
- ✓ No images are lost or corrupted
- ✓ Save and reload maintains both images correctly

**Status**: [ ] PASS / [ ] FAIL

---

### Test Case 5: Load Existing Design with Background
**Objective**: Verify that designs with existing backgrounds load correctly.

**Steps**:
1. Complete Test Case 1 to create a design with a background image
2. Close the browser or navigate away
3. Reopen the design page for the same job
4. Verify the background image appears immediately (no need to switch floors)
5. Upload a new background image (replacing the existing one)
6. Save the design
7. Reload the page
8. Verify the NEW background image is displayed

**Expected Results**:
- ✓ Existing background loads immediately on page load
- ✓ Background can be replaced successfully
- ✓ No console errors about sync refs or layer loading

**Status**: [ ] PASS / [ ] FAIL

---

### Test Case 6: Three Floors with Different Images
**Objective**: Verify that the fix works with 3+ floors.

**Steps**:
1. Create or open a design
2. Add floors until you have 3 total floors
3. Upload image-1 to Floor 1
4. Upload image-2 to Floor 2  
5. Upload image-3 to Floor 3
6. Switch between all floors randomly (1→3→2→1→2→3)
7. Verify each floor maintains its correct image
8. Save the design
9. Reload the page
10. Verify all 3 images are preserved correctly

**Expected Results**:
- ✓ Each floor maintains its own unique background image
- ✓ No cross-contamination between floors
- ✓ All images persist after save/reload

**Status**: [ ] PASS / [ ] FAIL

---

### Test Case 7: Edge Case - Upload Without Switching
**Objective**: Verify that uploads work on the default/first floor without ever switching.

**Steps**:
1. Create a brand new job/design
2. Don't add any additional floors (stay on default Floor 1)
3. Upload a background image
4. Add some products to the design
5. Save the design
6. **DO NOT** switch to another floor at any point
7. Reload the page
8. Verify the background image is present

**Expected Results**:
- ✓ Background image is saved even without switching floors
- ✓ Image persists after reload
- ✓ This is the PRIMARY bug fix scenario

**Status**: [ ] PASS / [ ] FAIL

---

## Console Logging

When running these tests, monitor the browser console for the following log messages:

### Expected Logs (Good)
```
Syncing background to layer: layer-1 { hasImage: true, imageLength: 123456 }
Layer switch effect triggered { ... }
Layer switch complete - sync effects re-enabled
```

### Problem Indicators (Bad)
```
Background sync blocked - loading layer data (should only appear during layer load, not after upload)
Error: Cannot read property 'backgroundImage' of undefined
```

## Success Criteria

The fix is considered successful if:
- [ ] All 7 test cases PASS
- [ ] No console errors appear during testing
- [ ] Background images persist correctly after save/reload
- [ ] Test Case 7 (single floor without switching) works correctly

## Regression Testing

After confirming the fix works, also verify that existing functionality still works:
- [ ] Products can be added, moved, and saved
- [ ] Connectors work correctly
- [ ] Measurements work correctly
- [ ] Layer switching for other purposes (products, connectors) works correctly
- [ ] Undo/Redo functionality works
- [ ] Scale factor per floor is preserved

## Notes

Add any observations, issues, or notes here during testing:

```
[Date/Time]: [Your notes here]
```
