# CippApiResults Component

## Overview
The `CippApiResults` component displays API operation results, errors, and loading states in a user-friendly manner.

## New Features (Latest Update)

### 1. Floating/Overlay Mode
The component can now overlay on top of existing content without affecting page layout.

**Prop:** `floating` (boolean, default: `false`)

When enabled:
- Component uses fixed positioning at the top-right corner
- Does not push other page elements around
- Has high z-index (snackbar level) to appear above other content
- Maximum width of 500px

**Example:**
```jsx
<CippApiResults 
  apiObject={apiMutation} 
  floating={true}
/>
```

### 2. Auto-Close Functionality
Results can automatically close after a specified duration.

**Prop:** `autoCloseSeconds` (number, default: `null`)

When set to a number:
- All visible results will close after the specified seconds
- Automatically hides loading, error, and success alerts
- Timer resets if new results appear

**Example:**
```jsx
<CippApiResults 
  apiObject={apiMutation} 
  autoCloseSeconds={5}
/>
```

### 3. Hide Results Buttons
The View Results and Download Results buttons can be hidden.

**Prop:** `hideResultsButtons` (boolean, default: `false`)

When enabled:
- View Results button (eye icon) is hidden
- Download Results button (download icon) is hidden
- Results dialog can still be triggered programmatically if needed

**Example:**
```jsx
<CippApiResults 
  apiObject={apiMutation} 
  hideResultsButtons={true}
/>
```

## Complete API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiObject` | object | required | The API response object from react-query |
| `errorsOnly` | boolean | `false` | Only show error results |
| `alertSx` | object | `{}` | Custom MUI sx styles for alerts |
| `floating` | boolean | `false` | Enable floating/overlay mode |
| `autoCloseSeconds` | number | `null` | Auto-close after N seconds (null = no auto-close) |
| `hideResultsButtons` | boolean | `false` | Hide View/Download Results buttons |

## Usage Examples

### Basic Usage
```jsx
import { CippApiResults } from "/src/components/CippComponents/CippApiResults";

// In your component
const apiMutation = ApiPostCall({
  relatedQueryKeys: ["MyData"],
});

return <CippApiResults apiObject={apiMutation} />;
```

### Floating Notification with Auto-Close
Perfect for save operations or non-critical notifications:
```jsx
<CippApiResults 
  apiObject={saveDesignMutation} 
  floating={true}
  autoCloseSeconds={3}
  hideResultsButtons={true}
/>
```

### Errors Only Mode
Show only errors, useful for validation feedback:
```jsx
<CippApiResults 
  apiObject={validationMutation} 
  errorsOnly={true}
/>
```

### Custom Styling
```jsx
<CippApiResults 
  apiObject={apiMutation}
  alertSx={{ 
    borderRadius: 2,
    boxShadow: 3 
  }}
/>
```

### Combined Features
```jsx
<CippApiResults 
  apiObject={apiMutation}
  floating={true}
  autoCloseSeconds={10}
  hideResultsButtons={true}
  alertSx={{ maxWidth: 400 }}
/>
```

## Component Behavior

### Loading State
- Shows a circular progress indicator with "Loading..." message
- Can be manually dismissed
- Automatically hidden when request completes

### Error State
- Displays error messages in a filled red alert
- Includes error details from the API response
- Can be manually dismissed
- Provides "Get Help" button for error diagnostics

### Success State
- Shows individual alerts for each result
- Color-coded by severity (success/error)
- Copy-to-clipboard functionality for each result
- Expandable details section for complex results
- Individual close buttons for each alert

### Results Actions
- **View Results**: Opens a dialog table with all results
- **Download Results**: Downloads results as CSV file
- Both can be hidden using `hideResultsButtons` prop

## Notes

- The component uses react-query's API object structure
- All features are backward compatible - existing usage will work without changes
- Floating mode is recommended for operations that should not interrupt user workflow
- Auto-close is recommended for success notifications that don't require user action
