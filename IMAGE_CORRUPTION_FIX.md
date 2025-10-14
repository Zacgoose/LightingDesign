# Image Corruption Fix - Implementation Summary

## Problem
When saving designs with large background images (base64 data URLs), the images were becoming visually corrupted upon retrieval. The user reported that:
- Data sent to the API was correct
- Data retrieved from Azure Tables was corrupted
- Specifically, the second image in multi-layer designs showed corruption (fuzzy/scaled portions)

## Root Cause Analysis

After extensive code analysis, we identified two potential causes:

### 1. Non-Deterministic Property Ordering
When an entity exceeds Azure Table Storage's size limits (~500KB), it must be split across multiple table rows. The original code distributed properties across rows by iterating through `$HashTable.Keys`, which has **non-deterministic order** in PowerShell.

This meant:
- Save #1: Properties might be distributed as: [A, B, C] → Row1, [D, E, F] → Row2
- Save #2: Properties might be distributed as: [C, A, D] → Row1, [B, F, E] → Row2

During reassembly, if the code relied on any implicit ordering assumptions, this could cause data to be reconstructed incorrectly.

### 2. Aggressive Chunk Size
Properties larger than 30KB were split into 30KB chunks. While Azure Table Storage supports up to 64KB per property, the original chunk size left only ~34KB headroom. Potential issues:
- Azure's size calculation might include overhead not accounted for
- Edge cases near the limit could cause unexpected behavior
- Larger chunks mean fewer split points, increasing impact if one chunk is corrupted

## Implemented Fixes

### 1. Deterministic Property Distribution
**File**: `Add-CIPPAzDataTableEntity.ps1`  
**Line**: ~105

Changed from:
```powershell
foreach ($key in $SingleEnt.Keys) {
```

To:
```powershell
$sortedKeys = $SingleEnt.Keys | Sort-Object
foreach ($key in $sortedKeys) {
```

This ensures properties are always distributed in the same order (alphabetically), making the splitting process deterministic and reproducible.

### 2. Conservative Chunk Size
**File**: `Add-CIPPAzDataTableEntity.ps1`  
**Line**: 27-32

Changed from:
```powershell
$MaxSize = 30kb  # 30,720 bytes
```

To:
```powershell
$MaxSize = 20kb  # 20,480 bytes
```

Benefits:
- More safety margin below Azure's 64KB limit
- Better distribution of data across chunks
- Reduced risk of edge cases at property boundaries

### 3. Enhanced Logging
**File**: `Get-CIPPAzDatatableEntity.ps1`  
**Lines**: 58-80, 82-106

Added detailed logging to track:
- Row reassembly process (how many parts, what's being concatenated)
- Property reassembly from split chunks
- Missing parts (with warnings)
- Data lengths at each stage

This will help diagnose any future issues and confirm the fix works correctly.

### 4. Additional Safeguards
**File**: `Add-CIPPAzDataTableEntity.ps1`  
**Line**: 112

Added warning for unexpected scenarios:
```powershell
Write-Warning "Property $key is larger than MaxRowSize..."
```

This alerts if a property that should have been split earlier somehow ends up being too large during row distribution.

## Testing Instructions

### 1. Basic Functionality Test
1. Create a new job in the application
2. Open the design view for that job
3. Upload 2-3 background images (each should be 500KB-1MB for adequate testing)
4. Add some products to each layer
5. Save the design (Ctrl+S or click Save button)
6. Refresh the page or navigate away and back
7. **Verify**: All background images display correctly without corruption

### 2. Consistency Test
1. Using the same job from Test #1
2. Make a small change (add one product)
3. Save again
4. Repeat steps 2-3 several times
5. **Verify**: Images remain uncorrupted across multiple saves

### 3. Large Design Test
1. Create a job with 5+ layers
2. Add large background images to each layer (>1MB each if possible)
3. Add 50+ products across all layers
4. Save the design
5. **Verify**: 
   - All images display correctly
   - All products are present
   - No errors in console/logs

### 4. Log Verification
1. After performing the above tests, check the Azure Functions logs
2. Look for:
   - `Write-Information` messages about reassembling entities and properties
   - Any `Write-Warning` messages (these indicate issues)
   - The logs should show parts being reassembled in consistent order

Example log output you should see:
```
Reassembling entity from 3 row parts
  Processing row part 0
    Adding DesignData_Part0 : length = 20480
    Adding DesignData_Part1 : length = 20480
  Processing row part 1
    Adding DesignData_Part2 : length = 20480
    Adding DesignData_Part3 : length = 15234
  Processing row part 2
    Adding SplitOverProps : length = 342
Reassembling property: DesignData from 4 parts
  DesignData_Part0 : length = 20480
  DesignData_Part1 : length = 20480
  DesignData_Part2 : length = 20480
  DesignData_Part3 : length = 15234
Reassembled DesignData: total length = 76674
```

## Expected Outcomes

After this fix:
1. ✅ Images should not show visual corruption
2. ✅ Multi-layer designs with large images should save/load correctly
3. ✅ Repeated saves should produce consistent results
4. ✅ No data loss or truncation
5. ✅ Logs should show clean reassembly without warnings

## Rollback Plan

If issues persist or new issues arise:
1. The chunk size can be adjusted further (try 16KB or 24KB)
2. The sorting can be disabled by reverting to `foreach ($key in $SingleEnt.Keys)`
3. The logging can be adjusted for more/less detail
4. Revert the commit using: `git revert 3d308dc`

## Additional Notes

### Why This Fix Should Work

1. **Deterministic ordering** eliminates any possibility of properties being split differently across saves, which could cause reassembly to produce different results
2. **Smaller chunks** reduce the risk of hitting Azure Table edge cases and distribute data more evenly
3. **Better logging** makes future issues easier to diagnose

### Performance Impact

- Minimal performance impact expected
- Sorting hashtable keys adds negligible overhead (< 1ms for typical entities)
- Smaller chunks means slightly more table rows, but:
  - Still well within Azure Table limits
  - Retrieval performance unaffected (all rows fetched in one query)
  - Negligible storage cost increase

### Backward Compatibility

- Fully backward compatible with existing saved designs
- The `Get-CIPPAzDataTableEntity` function handles both old and new data formats
- No migration needed for existing data

## Questions or Issues?

If you encounter any issues after deploying this fix:
1. Check the Azure Functions logs for warnings or errors
2. Try saving a simple design (single layer, small image) first
3. Gradually increase complexity to isolate the issue
4. Provide log excerpts when reporting issues

The enhanced logging will make it much easier to diagnose any remaining problems.
