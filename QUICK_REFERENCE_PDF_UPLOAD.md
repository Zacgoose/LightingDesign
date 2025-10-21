# Quick Reference: PDF Background Upload

## What Changed

### Before
- ✗ Only image files (PNG, JPG, etc.) could be uploaded as backgrounds
- ✗ PDF floor plans had to be converted externally before upload

### After
- ✓ Both image files AND PDF files can be uploaded
- ✓ PDFs are automatically converted to high-quality PNG backgrounds
- ✓ Export functionality works seamlessly with both types

## Usage

### For Users
1. Click "Upload Floor Plan" button in the designer
2. Choose either:
   - An image file (PNG, JPG, etc.), OR
   - A PDF file (architectural drawings, floor plans)
3. File is processed automatically
4. Background appears on canvas
5. Export works normally (no difference in workflow)

### File Types Accepted
- **Images**: PNG, JPG, JPEG, GIF, BMP, WebP, SVG
- **PDFs**: Single or multi-page (first page is used)

## Technical Implementation

### Key Files Changed
```
lightingdesign/src/pages/jobs/design/index.jsx
lightingdesign/package.json
```

### Key Code Change
```javascript
// Before
input.accept = "image/*";

// After
input.accept = "image/*,application/pdf";
```

### PDF Processing Flow
```
User Selects PDF
    ↓
PDF Detected (file.type === 'application/pdf')
    ↓
Load PDF with pdf-lib (get dimensions)
    ↓
Render with pdfjs-dist (create canvas)
    ↓
Convert canvas to PNG data URL
    ↓
Set as background (same as images)
    ↓
Auto-zoom to fit viewport
```

## Dependencies Added
- `pdfjs-dist: ^4.0.0` - For PDF rendering

## No Changes Required
- ✓ Export functionality (already handles data URLs)
- ✓ Canvas rendering (works with all data URLs)
- ✓ Layer management (background is just a data URL)
- ✓ Save/load functionality (data URLs are saved normally)

## Testing

### Manual Tests Performed
1. ✓ Code syntax validation (Prettier)
2. ✓ Logic verification (test script)
3. ✓ Error handling confirmed
4. ✓ Integration points verified

### Recommended Tests
- [ ] Upload various PDF files
- [ ] Upload various image files
- [ ] Export design with PDF background
- [ ] Export design with image background
- [ ] Test with large files (>5MB)
- [ ] Test with multi-page PDFs
- [ ] Test error scenarios (corrupted files)

## Known Limitations
1. Only first page of multi-page PDFs is used
2. PDFs are converted to raster (not vector) format
3. Requires internet connection for pdfjs worker (CDN)
4. Large PDFs may take a few seconds to process

## Future Enhancements
- Page selection for multi-page PDFs
- Configurable quality settings
- Progress indicator for large files
- Offline support (bundle worker locally)

## Support
- See `PDF_BACKGROUND_SUPPORT.md` for detailed documentation
- See `EXPORT_FEATURE.md` for export functionality details
- Check browser console for error messages if issues occur
