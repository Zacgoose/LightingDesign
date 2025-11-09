const fs = require('fs');
const path = require('path');

// Copy pdfjs worker to public directory
const workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const workerDest = path.join(__dirname, '../public/pdfjs/pdf.worker.min.mjs');

try {
  // Create directory if it doesn't exist
  const destDir = path.dirname(workerDest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy worker file
  fs.copyFileSync(workerSrc, workerDest);
  console.log('PDF.js worker copied successfully');
} catch (error) {
  console.error('Error copying PDF.js worker:', error);
  // Don't exit with error - just warn and continue
  // process.exit(1);
}
