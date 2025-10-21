# Design Export Feature

## Overview
A new design export page has been added to allow users to export their lighting designs with configurable options.

## Location
- **Page Path**: `/jobs/design/export?id={jobId}`
- **File**: `lightingdesign/src/pages/jobs/design/export.jsx`

## Features Implemented

### 1. Paper Size Selection
Users can select from standard A-series paper sizes:
- **A4** (210 × 297 mm) - Default
- **A3** (297 × 420 mm)
- **A2** (420 × 594 mm)
- **A1** (594 × 841 mm)
- **A0** (841 × 1189 mm)

### 2. Orientation Selection
- **Landscape** (default)
- **Portrait**

### 3. Floor/Layer Selection
- Checkbox selection for each floor layer in the design
- When a floor is selected, all its sublayers are automatically selected
- When a floor is deselected, all its sublayers are automatically deselected
- Visual hierarchy showing floors and their sublayers

### 4. Sublayer Selection
- Individual checkbox selection for sublayers within each floor
- Only visible when the parent floor is selected
- Allows granular control over what elements are exported
- Common sublayers include:
  - Default (general objects)
  - Cabling (cable/connector layers)
  - Custom sublayers created by users

### 5. Export Summary
- Shows count of selected floors
- Displays selected paper size and orientation
- Validation message if no floors are selected
- Export button (disabled if no valid selection)

## Navigation

### From Designer
The existing "Export" button in the designer toolbar now navigates to this export page instead of just logging to console.

**File Modified**: `lightingdesign/src/pages/jobs/design/index.jsx`
- Changed `handleExport` callback to navigate to `/jobs/design/export?id={jobId}`

### Back to Designer
Export page includes a "Back to Design" button to return to the designer.

## UI Components Used

The page follows the existing design patterns in the application:
- **DashboardLayout**: Consistent layout with navigation
- **Material-UI Components**: Card, Grid, FormControl, Checkbox, Radio, Button, etc.
- **ApiGetCall Hook**: Fetches design data to populate layer/sublayer selections
- **Router**: Next.js router for navigation and query parameters

## Page Structure

```
Export Design Page
├── Back Button (to designer)
├── Title & Description
├── Left Column (Grid)
│   └── Paper Size & Orientation Card
│       ├── Paper Size Selection (Radio Group)
│       └── Orientation Selection (Radio Group)
├── Right Column (Grid)
│   └── Floors and Layers Card
│       └── Floor Checkboxes
│           └── Sublayer Checkboxes (indented)
└── Export Summary Card
    ├── Summary Text
    ├── Validation Alert (if needed)
    └── Export Button
```

## State Management

The page maintains the following state:
- `paperSize`: Selected paper size (default: "A4")
- `orientation`: Selected orientation (default: "landscape")
- `selectedLayers`: Array of selected floor layer IDs
- `selectedSublayers`: Object mapping layer IDs to arrays of sublayer IDs
- `isExporting`: Boolean for export in progress state

## Data Flow

1. User navigates to export page with job ID in query params
2. Page loads design data via `ApiGetCall` hook
3. Design data contains layers array with sublayers
4. All layers and sublayers are selected by default
5. User adjusts selections as needed
6. User clicks "Export Design" button
7. Export configuration is prepared and logged (ready for implementation)

## Next Steps

The basic export page is now functional. Future enhancements can include:

1. **PDF Generation**: Implement actual PDF export using jspdf (already in dependencies)
2. **Canvas Rendering**: Render each selected layer/sublayer to the PDF
3. **Scale Options**: Add scale/zoom options for exports
4. **Title Block**: Add optional title block with job info
5. **Legend**: Generate legend for product types/colors
6. **Multi-page Export**: Support exporting multiple floors to separate pages
7. **Preview**: Show preview before export
8. **Format Options**: Support additional export formats (PNG, SVG, DXF, etc.)

## Testing

To test the page:
1. Navigate to a job with a design (e.g., `/jobs/design?id={jobId}`)
2. Click the "Export" button in the toolbar
3. Verify navigation to export page
4. Check that all UI elements render correctly
5. Test floor and sublayer selection checkboxes
6. Verify paper size and orientation selection
7. Confirm export button is disabled when no floors selected
8. Test "Back to Design" button navigation

## Code Quality

- Follows existing code patterns in the repository
- Uses Material-UI components consistently
- Implements proper React hooks (useState, useCallback)
- Uses Next.js router for navigation
- Includes proper TypeScript-style JSDoc comments
- No linting errors introduced
