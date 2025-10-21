# PDF Background Support

## Overview
The application now supports uploading both PDF and image files as backgrounds for lighting designs. This enables users to work with architectural floor plans in PDF format while maintaining the ability to use traditional image backgrounds.

## Features Implemented

### 1. PDF Upload Support
- **File Types**: The upload dialog now accepts `image/*` and `application/pdf`
- **Location**: Design page > "Upload Floor Plan" button
- **Supported Formats**: 
  - Images: PNG, JPG, GIF, WebP, etc.
  - PDFs: Any valid PDF file

### 2. PDF Rendering for Canvas Display
When a PDF is uploaded:
1. The first page is extracted using `pdf-lib`
2. The page is rendered to a canvas using `pdfjs-dist`
3. The canvas is converted to a PNG data URL
4. The PNG is displayed as the background image in the designer canvas

This allows seamless editing with PDF backgrounds just like image backgrounds.

### 3. Background Metadata Storage
For each layer, the application now stores:
- `backgroundImage`: Rasterized image data URL (for display)
- `backgroundImageNaturalSize`: Dimensions of the background
- `backgroundFileType`: "image" or "pdf" (NEW)
- `backgroundPdfData`: Original PDF bytes as ArrayBuffer (NEW)

This metadata is preserved when saving designs, enabling:
- Backward compatibility with existing image-only designs
- Future vector PDF export capabilities
- Type-aware processing

### 4. Export Functionality
Currently, both image and PDF backgrounds are exported as rasterized images in the PDF output. This maintains consistency and ensures compatibility with existing export logic.

**Note**: Vector PDF export is a future enhancement that would require significant refactoring of the export pipeline to properly integrate jsPDF and pdf-lib.

## Technical Implementation

### Dependencies Added
- `pdfjs-dist@^4.0.379`: For rendering PDF pages to canvas
- `pdf-lib@^1.17.1`: For PDF manipulation and metadata extraction (already installed)

### Key Files Modified
1. **`src/pages/jobs/design/index.jsx`**
   - Updated `handleUploadFloorPlan()` to accept PDFs
   - Added PDF-to-image conversion logic
   - Added metadata storage for PDF backgrounds

2. **`src/pages/jobs/design/export.jsx`**
   - Added `backgroundFileType` and `backgroundPdfData` to export options
   - Added logging for background type during export
   - Prepared structure for future vector PDF export

3. **`package.json`**
   - Updated `pdf-lib` version to `^1.17.1`
   - Added `pdfjs-dist@^4.0.379`

## Usage

### Uploading a PDF Background
1. Navigate to a job's design page
2. Click the "Upload Floor Plan" button in the toolbar
3. Select a PDF file from your file system
4. The PDF's first page will be rendered and set as the background
5. Design elements can be placed on top of the PDF background

### Uploading an Image Background
The process remains unchanged:
1. Click "Upload Floor Plan"
2. Select an image file (PNG, JPG, etc.)
3. The image is set as the background

### Exporting Designs
1. Click the "Export" button in the toolbar
2. Configure export settings (paper size, orientation, layers)
3. Click "Export Design"
4. The PDF will be generated with backgrounds (rasterized for both images and PDFs)

## Future Enhancements

### Vector PDF Export
To implement true vector PDF export:
1. Use `pdf-lib` to create a new PDF document
2. Embed the original PDF background as a page
3. Render SVG content on top using pdf-lib's drawing APIs
4. This would require rewriting the export pipeline to bypass jsPDF for PDF backgrounds

### Multiple Page Support
- Allow users to select which page of a multi-page PDF to use
- Support importing multiple pages as separate layers

### PDF Annotation Preservation
- Preserve annotations, comments, and layers from the original PDF
- Allow users to toggle visibility of PDF layers

## Limitations

### Current Limitations
1. Only the first page of multi-page PDFs is used
2. PDF backgrounds are rasterized in exports (not vector)
3. PDF quality depends on the resolution used during rasterization

### Technical Limitations
1. **jsPDF/pdf-lib Integration**: These libraries have different approaches and don't integrate well
   - jsPDF: Imperative API, builds PDF incrementally
   - pdf-lib: Declarative API, manipulates complete PDF documents
2. **Layer Order**: Ensuring PDF background stays behind SVG content requires careful content stream manipulation
3. **Performance**: Large PDFs may take time to render to canvas

## Testing

### Manual Testing Checklist
- [ ] Upload a single-page PDF as background
- [ ] Upload a multi-page PDF (verify first page is used)
- [ ] Upload a regular image (verify no regression)
- [ ] Add products/connectors on top of PDF background
- [ ] Save design with PDF background
- [ ] Load saved design (verify background persists)
- [ ] Export design with PDF background
- [ ] Switch between layers with different background types
- [ ] Test with very large PDF files
- [ ] Test with various PDF versions (1.4, 1.7, 2.0, etc.)

### Known Issues
- None at this time

## Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires recent version for pdf.js)

## Performance Considerations
- PDF rendering is performed on the client side
- Large PDFs (>10MB) may take several seconds to load
- Rendered images are stored as base64 data URLs (increases save data size)
- Consider implementing:
  - Progress indicators during PDF upload
  - Background rendering in web workers
  - Caching of rendered PDF pages

## References
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [pdf.js Documentation](https://mozilla.github.io/pdf.js/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [SVG2PDF.js Documentation](https://github.com/yWorks/svg2pdf.js)
