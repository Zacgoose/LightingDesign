# Design Save/Load Corruption - Debug Logging

## Critical Fix Applied

**Issue Found:** Part 7 missing during retrieval causing 30KB data loss

**Root Cause:** When entities were split into multiple rows (due to exceeding 500KB), only the first row contained queryable properties like `JobId`. Subsequent rows (e.g., `rowkey-part1`, `rowkey-part2`) did not have these properties, so they were not returned by queries like `JobId eq 'xxx'`.

**Fix:** Modified `Add-CIPPAzDataTableEntity.ps1` to preserve critical queryable properties (< 1KB, non-part properties like `JobId`, `TenantId`, etc.) in ALL row parts. This ensures all parts can be retrieved by the same query filter.

**Result:** All row parts now contain critical properties, allowing queries to retrieve all parts of a split entity.

---

## Overview
This document describes the debug logging added to track down image corruption issues when saving and loading designs. The corruption appears to affect background images, particularly when data is stored in and retrieved from Azure Table Storage.

## Problem Description
- Data sent to API (imake URLs) are correct with no corruption
- Upon `Invoke-ExecGetDesign` getting the data from the table, it's now corrupt
- Visual corruption: fuzzy black and white chunks, weird scaling
- Issue may be related to how data is stored/escaped in tables or how it's retrieved
- Backend chunks larger files over multiple table rows

## Logging Locations

### 1. Invoke-ExecSaveDesign.ps1
**Location**: `lightingdesign-api/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Designer/Jobs/Invoke-ExecSaveDesign.ps1`

**What's logged**:
- Job ID being saved
- Design data structure (type, has layers, layer count)
- For each layer:
  - Layer name
  - Whether it has a background image
  - Background image length
  - First 50 characters of background image data
- JSON conversion:
  - Total JSON length
  - First 100 characters of JSON
  - Last 100 characters of JSON
  - Number of `backgroundImage` properties found in JSON
  - Start of each background image data URL
- Entity details before save:
  - PartitionKey
  - RowKey
  - DesignData length

**Key markers**:
- `=== SAVE DESIGN DEBUG START ===`
- `=== SAVE DESIGN DEBUG END ===`

### 2. Add-CIPPAzDataTableEntity.ps1
**Location**: `lightingdesign-api/Modules/CIPPCore/Public/Add-CIPPAzDataTableEntity.ps1`

**What's logged**:

#### Normal add (no splitting):
- Entity PartitionKey and RowKey
- All property sizes (logs properties > 10KB)
- For large data properties: first 100 characters
- Total entity size before processing

#### When entity is too large (splitting required):
- Error code that triggered splitting
- Number of large properties found
- List of property names that need splitting
- For each property being split:
  - Original size
  - Number of parts it will be split into
  - Max size per part
  - For each part: length, start position, first/last 50 chars (for data properties)
- Entity size after property splitting
- Whether entity still needs row splitting
- For each row part added: RowKey and PartIndex

**Key markers**:
- `=== ADD ENTITY DEBUG: Attempting to add entity ===`
- `=== ADD ENTITY DEBUG: Entity added successfully without splitting ===`
- `=== ADD ENTITY DEBUG: Entity is too large. Starting split process ===`
- `=== ADD ENTITY DEBUG: Entity still too large, splitting into multiple rows ===`
- `=== ADD ENTITY DEBUG: All row parts added successfully ===`
- `=== ADD ENTITY DEBUG: Entity fits in single row after property splitting ===`

### 3. Get-CIPPAzDatatableEntity.ps1
**Location**: `lightingdesign-api/Modules/CIPPCore/Public/Get-CIPPAzDatatableEntity.ps1`

**What's logged**:

#### Initial retrieval:
- Filter used for query
- Number of raw entities retrieved from table
- For each entity:
  - PartitionKey, RowKey
  - Whether it has OriginalEntityId (indicates it's a part)
  - OriginalEntityId and PartIndex if it's a part
  - Whether it's a root entity or part entity

#### Merging process:
- Number of parts for each merged entity
- When concatenating property parts:
  - Property name
  - Old length + new length = total length
  - When adding new property: length

#### Split property reassembly:
- Number of split properties to reassemble
- For each split property:
  - Original header name
  - List of part names
  - Length of each part
  - Warning if any part is null/missing
  - Total merged length
  - First/last 100 chars (for data properties)

**Key markers**:
- `=== GET ENTITY DEBUG START ===`
- `=== GET ENTITY DEBUG END: Returning X entities ===`

### 4. Invoke-ExecGetDesign.ps1
**Location**: `lightingdesign-api/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Designer/Jobs/Invoke-ExecGetDesign.ps1`

**What's logged**:
- Job ID being retrieved
- Filter used
- Whether row was found
- If row found:
  - RowKey
  - Whether it has DesignData
  - DesignData length
  - First 100 characters of DesignData
  - Last 100 characters of DesignData
  - Number of `backgroundImage` properties found
  - Start of each background image data URL
- JSON parsing:
  - Whether parsing succeeded
  - Whether parsed data has layers
  - Layer count
  - For each layer:
    - Layer name
    - Whether it has background image
    - Background image length
    - First 50 characters of background image
- Return object creation confirmation

**Key markers**:
- `=== GET DESIGN DEBUG START ===`
- `=== GET DESIGN DEBUG END ===`

## How to Use This Logging

1. **Save a design with background images** - Monitor Azure Functions logs for `SAVE DESIGN DEBUG` markers

2. **Check the save process**:
   - Verify background image data is present and correct length
   - Check JSON conversion doesn't corrupt data
   - If splitting occurs, verify each part has correct length and data

3. **Load the design** - Monitor Azure Functions logs for `GET DESIGN DEBUG` markers

4. **Check the retrieval process**:
   - Verify raw DesignData has correct length
   - Check if properties were split and how many parts
   - Verify reassembly correctly concatenates parts
   - Check parsed data has background images with correct length

5. **Compare save vs load**:
   - Background image length should match
   - First/last characters of data should match
   - Number of parts should be consistent

## Key Things to Look For

### Data Corruption Indicators:
1. **Length mismatch**: Background image length differs between save and load
2. **Part count mismatch**: Different number of parts during split vs reassembly
3. **Missing parts**: Warning messages about null/missing parts during reassembly
4. **Data truncation**: Last characters of one part don't connect to first characters of next part
5. **Character corruption**: Non-base64 characters in data URLs, or invalid data URL format

### Expected Behavior:
- Background images in data URL format: `data:image/png;base64,iVBORw0KGgo...`
- Large designs may be split into multiple parts (30KB per part)
- Very large designs may be split into multiple rows (500KB per row)
- Reassembly should restore exact original data

## Performance Impact
The logging is verbose and will generate significant log output for large designs. It should only be enabled during debugging and disabled for production use.

## Next Steps for Debugging
1. Save a design with 2 background images (one known good, one causing corruption)
2. Capture complete logs from save operation
3. Immediately load the same design
4. Capture complete logs from load operation
5. Compare the background image data at each step:
   - Original data sent from frontend
   - JSON after conversion
   - Data after splitting (if split)
   - Raw data retrieved from table
   - Data after reassembly (if was split)
   - Final parsed data
6. Identify at which step the corruption occurs
