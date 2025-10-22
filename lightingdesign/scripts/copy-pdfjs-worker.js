const fs = require('fs');
const path = require('path');

// NOTE: This script is NO LONGER NEEDED as of the switch to react-pdf.
// The react-pdf package automatically handles PDF.js worker setup using a CDN URL.
// This file is kept for reference but is not called in package.json scripts anymore.
//
// Previous behavior:
// - Copy pdfjs worker to public directory for manual worker setup
// 
// New behavior with react-pdf:
// - Worker is loaded automatically from CDN (cloudflare)
// - No manual file copying needed
// - Simpler build process

console.log('⚠️  This script is deprecated and no longer needed with react-pdf.');
console.log('✅ PDF.js worker is now loaded automatically from CDN.');

// Legacy code below (not executed):
if (false) {
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
    process.exit(1);
  }
}
