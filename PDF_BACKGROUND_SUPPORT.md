# PDF and Image Background Upload Support

## Overview
The lighting design application now supports uploading both PDF files and image files as floor plan backgrounds. This enhancement allows users to work with architectural drawings and floor plans that are commonly provided in PDF format.

## Implementation Details

### Files Modified
1. **`lightingdesign/src/pages/jobs/design/index.jsx`**
   - Updated `handleUploadFloorPlan` function to accept both images and PDFs
   - Added PDF-to-image conversion using pdfjs-dist library
   - File input now accepts: `image/*,application/pdf`

2. **`lightingdesign/package.json`**
   - Added `pdfjs-dist: ^4.0.0` dependency for PDF rendering
   - Fixed `pdf-lib` version to `^1.17.1` (previously had non-existent 1.18.1)

### How It Works

#### For Image Files (Existing Functionality)
- User selects an image file (PNG, JPG, etc.)
- File is read using FileReader and converted to data URL
- Image is set as background with auto-zoom to fit viewport

#### For PDF Files (New Functionality)
1. User selects a PDF file from file picker
2. File type is detected as `application/pdf`
3. PDF is loaded using `pdf-lib` to extract page dimensions
4. First page is rendered to canvas using `pdfjs-dist` at 2x scale for quality
5. Canvas is converted to PNG data URL
6. PNG data URL is set as background (same as image flow from here)
7. Auto-zoom is applied to fit viewport

### Technical Details

#### PDF Processing Pipeline
```javascript
PDF File → ArrayBuffer → pdf-lib (page info) → pdfjs-dist (render) → Canvas → PNG Data URL → Background Image
```

#### Libraries Used
- **pdf-lib**: Loads PDF document and extracts page information
- **pdfjs-dist**: Renders PDF page to canvas with high quality
  - Uses CDN for worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
  - Renders at 2x scale for better quality

#### Error Handling
- If PDF has no pages, error is logged and process stops
- If any error occurs during PDF processing, user sees alert: "Failed to load PDF file. Please try an image file instead."
- All errors are logged to console for debugging

### Export Compatibility

The export functionality (`lightingdesign/src/pages/jobs/design/export.jsx`) requires **no modifications** because:

1. Background images are stored as data URLs regardless of original format
2. PDF backgrounds are converted to PNG data URLs during upload
3. Export logic already handles data URL backgrounds correctly
4. SVG `<image>` elements accept data URLs for both original images and converted PDFs

### User Experience

#### Upload Process
1. Click "Upload Floor Plan" button in designer toolbar
2. File picker opens accepting both images and PDFs
3. Select either an image or PDF file
4. File is processed and background is applied automatically
5. Canvas auto-zooms to show background centered in viewport

#### Quality Settings
- PDF pages are rendered at 2x scale (double resolution) for better quality
- This ensures text and details remain sharp when zoomed
- Canvas dimensions match the viewport dimensions from PDF

### Limitations and Considerations

1. **Only First Page**: Currently only the first page of multi-page PDFs is used
2. **Client-Side Processing**: PDF rendering happens in browser (no server required)
3. **Memory Usage**: Large PDFs may consume significant memory during conversion
4. **Network Dependency**: pdfjs worker is loaded from CDN
5. **Browser Compatibility**: Requires modern browser with Canvas support

### Testing Recommendations

1. **Test with various PDF types**:
   - Architectural floor plans
   - Simple single-page PDFs
   - Multi-page PDFs (verify first page is used)
   - Large PDF files (check performance)

2. **Test with various image types**:
   - PNG files
   - JPG files
   - SVG files (if supported by browser)
   - Different resolutions and aspect ratios

3. **Test export functionality**:
   - Export design with PDF background
   - Export design with image background
   - Verify backgrounds appear correctly in exported PDF

4. **Edge cases**:
   - Empty PDF (no pages)
   - Corrupted PDF file
   - Very large files (>10MB)
   - Files with unusual dimensions

### Future Enhancements

Possible improvements for future versions:

1. **Page Selection**: Allow users to select which page from multi-page PDFs
2. **Quality Settings**: Let users choose rendering quality/scale
3. **Progress Indicator**: Show loading state while processing large PDFs
4. **File Size Limits**: Add warnings or limits for very large files
5. **Caching**: Cache converted PDFs to avoid re-processing
6. **Vector Support**: Preserve vector quality for PDF exports (currently rasterized)
7. **Offline Support**: Bundle pdfjs worker for offline use

## Code Examples

### File Input Configuration
```javascript
input.type = "file";
input.accept = "image/*,application/pdf";
```

### PDF Detection
```javascript
if (file.type === "application/pdf") {
  // Process as PDF
} else {
  // Process as image
}
```

### PDF to Canvas Conversion
```javascript
const pdfjsLib = await import("pdfjs-dist");
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
const pdf = await loadingTask.promise;
const page = await pdf.getPage(1);

const viewport = page.getViewport({ scale: 2 });
canvas.width = viewport.width;
canvas.height = viewport.height;

await page.render({
  canvasContext: context,
  viewport: viewport,
}).promise;

const dataUrl = canvas.toDataURL("image/png");
```

## Dependencies

### New Dependencies
- `pdfjs-dist: ^4.0.0` - Mozilla's PDF.js library for rendering PDFs

### Fixed Dependencies
- `pdf-lib: ^1.17.1` - Updated from non-existent 1.18.1 version

### Existing Dependencies (Used)
- `react` - Component framework
- `konva` / `react-konva` - Canvas manipulation
- `jspdf` / `svg2pdf.js` - PDF export functionality

## Maintenance Notes

### Worker URL
The pdfjs worker is loaded from CDN. If offline support is needed, the worker file should be:
1. Downloaded and added to `public/` directory
2. Worker path updated to local path: `/pdf.worker.min.js`

### Version Updates
When updating `pdfjs-dist`, ensure:
1. Worker URL matches the new version
2. API compatibility is maintained
3. Test PDF rendering with the new version

### Performance Monitoring
Monitor these metrics:
- PDF processing time (should be < 2 seconds for typical files)
- Memory usage during conversion
- Canvas rendering performance
- File size of generated data URLs

## Conclusion

This implementation provides a seamless way for users to upload PDF floor plans, which are automatically converted to high-quality PNG backgrounds. The export functionality works without modification because backgrounds are stored as data URLs regardless of their original format.
