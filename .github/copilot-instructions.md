# LightingDesign AI Assistant Instructions

## Project Overview
LightingDesign is a Next.js web application with an Azure Functions backend for managing lighting design jobs and workflows. The project uses a modern React stack with Material-UI components.

## Architecture

### Frontend (`/lightingdesign`)
- Next.js application with static export configuration
- Material-UI for component library
- Key folders:
  - `/src/components` - Reusable UI components
  - `/src/pages` - Next.js page routes and API handlers
  - `/src/layouts` - Layout components including dashboard and navigation
  - `/src/api` - API client utilities (`ApiCall.jsx`)
  - `/src/hooks` - Custom React hooks
  - `/src/utils` - Helper functions
  - `/src/contexts` - React context providers
  - `/src/store` - Redux store configuration

### Backend (`/lightingdesign-api`)
- Azure Functions-based API
- Function types:
  - HTTP Triggers (`CIPPHttpTrigger`)
  - Timer Functions (`CIPPTimer`)
  - Activity Functions (`CIPPActivityFunction`)
  - Orchestrator Functions (`CIPPOrchestrator`)
- Local development uses Azurite emulator for storage

## Key Development Patterns

### API Communication
```javascript
// Use ApiGetCall/ApiPostCall hooks for API requests
const data = ApiGetCall({
  url: "/api/GetJob",
  data: { jobId: id },
  queryKey: `Job-${id}`,
  enabled: !!id,
});
```

### Form Handling
```javascript
// Use react-hook-form for form state management
const formControl = useForm({
  mode: "onChange",
  defaultValues: {
    jobNumber: "",
    status: { value: "pending", label: "Pending" }
  }
});
```

### Layout Components
- Always wrap pages with `DashboardLayout`
- Use `CippPageCard` for consistent page containers
- For tabbed interfaces, use `TabbedLayout` or `HeaderedTabbedLayout`

## Development Workflow

## Development Testing Notes
Do not build the package during development as the build script deletes package.json

### Local Development Setup
1. Start Azure Storage emulator:
```powershell
./Start-DevEmulators.ps1
```

2. Run Next.js development server:
```bash
cd lightingdesign
npm run dev
```

3. Start Azure Functions:
```bash
cd lightingdesign-api
func start
```

### Build Process
- Frontend builds as static export: `next build && next export`
- Output directory: `./out`
- Azure Static Web Apps configuration in `staticwebapp.config.json`

## Integration Points

### Azure Services
- Azure Static Web Apps for hosting
- Azure Functions for backend API
- Azure Storage for data persistence
- Azure AD for authentication

## Best Practices

1. State Management:
   - Use React Query for server state
   - Use Redux for global UI state
   - Use React Context for theme/settings

2. Error Handling:
   - Wrap API calls in try/catch
   - Use `getCippError` utility for error formatting
   - Implement error boundaries at page level

3. Code Organization:
   - Place reusable components in `/components`
   - Keep page-specific components in page directories
   - Use barrel exports (`index.js`) for clean imports

## Common Gotchas
1. Azure Storage Emulator must be running for local development
2. File paths in Next.js should use forward slashes
3. Always handle loading/error states in data fetching components