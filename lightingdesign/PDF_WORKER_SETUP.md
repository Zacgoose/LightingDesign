# PDF Worker Setup

## Issue
The PDF.js library requires a worker file to render PDFs. When loading from external CDNs (like cdnjs or unpkg), CORS policies can block the worker, causing PDF upload to fail with errors like:
- "Setting up fake worker failed"
- "error loading dynamically imported module"
- "CORS request did not succeed"

## Solution
We configure PDF.js to use a locally-served worker file from the `public` folder, which avoids all CORS issues.

## Setup Instructions

### Automatic Setup (Recommended)
Run the setup script after installing dependencies:

```bash
npm install
npm run setup-pdf-worker
```

### Manual Setup
If you prefer to copy the worker file manually:

1. After running `npm install`, locate the worker file:
   ```bash
   find node_modules/pdfjs-dist -name "pdf.worker.min.js"
   ```

2. Copy it to the public folder:
   ```bash
   cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
   ```

3. The worker is now available at `/pdf.worker.min.js` when the app runs

## How It Works

The code in `src/pages/jobs/design/index.jsx` configures PDF.js on component mount:

```javascript
useEffect(() => {
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }
}, []);
```

This tells PDF.js to load the worker from the local public folder instead of an external CDN.

## Troubleshooting

**Worker file not found (404 error)**
- Make sure you ran the setup script: `npm run setup-pdf-worker`
- Check that `public/pdf.worker.min.js` exists
- Restart the development server after copying the file

**Still getting CORS errors**
- Clear your browser cache
- Make sure no browser extensions are blocking the worker
- Check browser console for the exact error message

**Worker file is outdated**
- Re-run the setup script after updating `pdfjs-dist` package
- The worker version must match the pdfjs-dist version

## Alternative: Using postinstall Hook

You can also add this to `package.json` to automatically copy the worker after every `npm install`:

```json
{
  "scripts": {
    "postinstall": "bash copy-pdf-worker.sh || true"
  }
}
```

The `|| true` ensures the installation doesn't fail if the script encounters an issue.
