#!/bin/bash

# Script to copy PDF.js worker file to public folder
# This is needed to avoid CORS issues when loading the worker

echo "Copying PDF.js worker file to public folder..."

# Check if node_modules exists
if [ ! -d "node_modules/pdfjs-dist" ]; then
    echo "Error: node_modules/pdfjs-dist not found. Please run 'npm install' first."
    exit 1
fi

# Find the worker file
WORKER_FILE=$(find node_modules/pdfjs-dist -name "pdf.worker.min.js" -o -name "pdf.worker.mjs" | head -1)

if [ -z "$WORKER_FILE" ]; then
    echo "Error: Could not find pdf.worker.min.js in node_modules/pdfjs-dist"
    exit 1
fi

# Copy to public folder
cp "$WORKER_FILE" public/pdf.worker.min.js

echo "✓ PDF.js worker file copied to public/pdf.worker.min.js"
echo "  Worker is now available at /pdf.worker.min.js"
