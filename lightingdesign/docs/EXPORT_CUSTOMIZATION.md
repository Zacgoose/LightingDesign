# Export Customization Guide

The LightingDesign application now supports customizable PDF export templates, allowing you to control the appearance of exported design documents.

## Features

### 1. Logo Customization
- **Upload a logo**: Add your company logo in User Preferences > Branding Settings
- **Logo positioning**: Choose from 6 positions:
  - Top Left
  - Top Center
  - Top Right
  - Bottom Left
  - Bottom Center
  - Bottom Right
- **Logo size**: Adjust the logo height from 30pt to 120pt

### 2. Job Information Display
- **Customizable fields**: Select which job information to display:
  - Job Number
  - Customer Name
  - Address
  - Floor Name
  - Date
  - Page Number
- **Position options**:
  - Title Block (Full Width) - Default, displays in the header area
  - Top Right
  - Bottom Left
  - Bottom Right

### 3. Title Block Appearance
- **Page numbers**: Toggle display of page numbers
- **Height adjustment**: Set title block height from 30mm to 80mm
- **Background color**: Customize the title block background color with a hex color picker

## How to Configure

1. Navigate to **User Preferences** (user menu > Preferences)
2. Scroll to the **Branding Settings** section
3. Upload your logo (PNG format recommended, max 2MB)
4. Choose your brand color
5. Scroll to **Export Template Settings**
6. Configure logo placement, job info fields, and appearance
7. Click **Save Template**

## Usage

Once configured, all PDF exports from the Design page will automatically use your customized template:

1. Open a job design
2. Click the **Export** button
3. Select paper size, orientation, and layers to export
4. Click **Export Design**
5. The generated PDF will include your customized branding and layout

## Tips

- **Logo placement**: Top positions are integrated into the title block, while bottom positions are overlaid on the page
- **Preview**: Use the preview section in the settings to see how your template will look
- **Consistency**: Settings are saved globally and apply to all future exports
- **Reset**: Click "Reset" to restore default template settings

## Examples

### Professional Header Layout
- Logo: Top Left, 60pt
- Job Info: Title Block
- Fields: Job Number, Customer Name, Floor Name, Date
- Title Block Color: Light gray (#F0F0F0)

### Minimalist Layout
- Logo: Bottom Right, 40pt
- Job Info: Top Right
- Fields: Job Number, Floor Name, Page Number
- Title Block Color: White (#FFFFFF)

### Branded Layout
- Logo: Top Center, 80pt
- Job Info: Title Block
- Fields: All fields selected
- Title Block Color: Brand color (matches company branding)

## Technical Notes

- Logo images are embedded as base64 in the PDF
- Export settings are stored in browser local storage
- Changes take effect immediately on next export
- Compatible with all paper sizes (A0-A4)
- Supports both portrait and landscape orientations
