# Quick Reference: Debug Logging for Design Corruption Issue

## Critical Fix Applied ✅

**Issue:** Part 7 missing during retrieval (30KB data loss)
**Cause:** Split row parts missing queryable properties like `JobId`
**Fix:** All row parts now include critical properties for querying
**File:** `Add-CIPPAzDataTableEntity.ps1`

---

## Purpose
Added comprehensive debug logging to track down image corruption issues during design save/load operations. The logging helps identify where data corruption occurs in the save-to-table and retrieve-from-table pipeline.

## Files Modified

1. **Invoke-ExecSaveDesign.ps1** - Logs design data before and during save
2. **Add-CIPPAzDataTableEntity.ps1** - Logs chunking/splitting operations
3. **Get-CIPPAzDatatableEntity.ps1** - Logs data retrieval and reassembly
4. **Invoke-ExecGetDesign.ps1** - Logs design data after retrieval

## Log Markers to Search For

| Marker | File | Purpose |
|--------|------|---------|
| `=== SAVE DESIGN DEBUG START ===` | Invoke-ExecSaveDesign.ps1 | Start of save operation |
| `=== SAVE DESIGN DEBUG END ===` | Invoke-ExecSaveDesign.ps1 | End of save operation |
| `=== ADD ENTITY DEBUG:` | Add-CIPPAzDataTableEntity.ps1 | Entity storage operations |
| `=== GET ENTITY DEBUG START ===` | Get-CIPPAzDatatableEntity.ps1 | Start of entity retrieval |
| `=== GET ENTITY DEBUG END:` | Get-CIPPAzDatatableEntity.ps1 | End of entity retrieval |
| `=== GET DESIGN DEBUG START ===` | Invoke-ExecGetDesign.ps1 | Start of design load operation |
| `=== GET DESIGN DEBUG END ===` | Invoke-ExecGetDesign.ps1 | End of design load operation |

## What Gets Logged

### During Save:
- ✅ Original design data structure and layer info
- ✅ Background image presence and data length
- ✅ JSON conversion results (length, first/last 100 chars)
- ✅ Background image data URLs in JSON
- ✅ Entity size before storage
- ✅ If data is split: number of chunks, size of each chunk, data samples

### During Load:
- ✅ Raw retrieved data length and samples
- ✅ If data was split: how many parts, reassembly process
- ✅ JSON parsing results
- ✅ Final parsed design structure with layer info
- ✅ Background image presence and data after parsing

## How to Use

1. **Reproduce the corruption**: Save a design with 2 background images (one that works, one that corrupts)

2. **Capture Azure Functions logs**: Look for the log markers above

3. **Compare data at each step**:
   - Check lengths match between save and load
   - Check first/last characters match
   - Check split/reassembly has same number of parts
   - Look for warnings about missing parts

4. **Identify corruption point**: The step where data changes is where corruption happens

## Expected Behavior

- Background images should be in data URL format: `data:image/png;base64,iVBORw0KGgo...`
- Large properties (>30KB) will be split into multiple parts
- Very large entities (>500KB) will be split into multiple rows
- Data should be identical after reassembly

## Common Corruption Indicators

⚠️ **Length mismatch**: Different lengths between save and load
⚠️ **Missing parts**: Warnings about null/missing parts during reassembly
⚠️ **Invalid base64**: Non-base64 characters in data URLs
⚠️ **Truncation**: Last chars of one part don't connect to first chars of next

## See Also

- [DESIGN_CORRUPTION_DEBUG_LOGGING.md](./DESIGN_CORRUPTION_DEBUG_LOGGING.md) - Detailed documentation
- Azure Functions logs - Where the actual debug output appears
