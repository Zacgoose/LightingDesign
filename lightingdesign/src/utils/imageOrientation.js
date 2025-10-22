/**
 * Utility functions for handling image orientation (EXIF metadata)
 * 
 * When images are taken on mobile devices, they often contain EXIF orientation metadata
 * that tells how the image should be rotated. Modern browsers automatically apply this
 * rotation when displaying images, but when we convert images to canvas/data URLs, the
 * EXIF data is lost and the image appears in the wrong orientation.
 * 
 * This utility provides functions to:
 * 1. Read EXIF orientation from image files
 * 2. Apply the correct rotation/flip transformations to canvas
 * 3. Create correctly-oriented data URLs that don't rely on EXIF
 */

/**
 * Read EXIF orientation from an image file
 * @param {File} file - The image file to read
 * @returns {Promise<number>} - The EXIF orientation value (1-8)
 */
export async function getImageOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const view = new DataView(e.target.result);
      
      // Check if it's a JPEG (starts with 0xFFD8)
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1); // Not a JPEG, assume no orientation
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      // Scan through JPEG markers
      while (offset < length) {
        // Check for valid marker
        if (view.getUint8(offset) !== 0xFF) {
          resolve(1); // Invalid marker
          return;
        }
        
        const marker = view.getUint8(offset + 1);
        
        // Check for APP1 marker (0xFFE1) which contains EXIF
        if (marker === 0xE1) {
          offset += 4; // Skip marker and length
          
          // Check for EXIF header
          if (view.getUint32(offset, false) !== 0x45786966) {
            resolve(1); // Not EXIF
            return;
          }
          
          offset += 6; // Skip EXIF header and padding
          
          // Determine byte order
          const littleEndian = view.getUint16(offset, false) === 0x4949;
          offset += 2;
          
          // Skip fixed value
          offset += 2;
          
          // Get IFD0 offset
          const ifdOffset = view.getUint32(offset, littleEndian);
          offset += ifdOffset - 2;
          
          // Read number of entries
          const tags = view.getUint16(offset, littleEndian);
          offset += 2;
          
          // Scan through IFD entries looking for orientation (0x0112)
          for (let i = 0; i < tags; i++) {
            const tag = view.getUint16(offset + (i * 12), littleEndian);
            if (tag === 0x0112) {
              const orientation = view.getUint16(offset + (i * 12) + 8, littleEndian);
              resolve(orientation);
              return;
            }
          }
          
          resolve(1); // Orientation tag not found
          return;
        }
        
        // Move to next marker
        offset += 2 + view.getUint16(offset + 2, false);
      }
      
      resolve(1); // No EXIF data found
    };
    
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // Read first 64KB
  });
}

/**
 * Apply EXIF orientation transformations to a canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} orientation - EXIF orientation value (1-8)
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
export function applyOrientation(ctx, orientation, width, height) {
  switch (orientation) {
    case 2:
      // Flip horizontal
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      // Rotate 180°
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      // Flip vertical
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      // Flip horizontal + rotate 270° CW
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      // Rotate 90° CW
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      break;
    case 7:
      // Flip horizontal + rotate 90° CW
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      break;
    case 8:
      // Rotate 270° CW
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      break;
    default:
      // Orientation 1 or unknown - no transformation needed
      break;
  }
}

/**
 * Get the dimensions after applying orientation
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} orientation - EXIF orientation value (1-8)
 * @returns {{width: number, height: number}} - Oriented dimensions
 */
export function getOrientedDimensions(width, height, orientation) {
  // Orientations 5, 6, 7, 8 swap width and height
  if (orientation >= 5 && orientation <= 8) {
    return { width: height, height: width };
  }
  return { width, height };
}

/**
 * Create a correctly-oriented data URL from an image file
 * This reads the EXIF orientation and uses createImageBitmap to apply the transformation,
 * then exports as a data URL without EXIF metadata (but with correct orientation baked in)
 * 
 * @param {File} file - The image file
 * @param {number} maxWidth - Optional max width (for downscaling large images)
 * @param {number} maxHeight - Optional max height (for downscaling large images)
 * @returns {Promise<{dataUrl: string, width: number, height: number}>}
 */
export async function createOrientedDataUrl(file, maxWidth = null, maxHeight = null) {
  try {
    console.log('createOrientedDataUrl: Processing file', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    
    // Use createImageBitmap with imageOrientation: 'from-image' to apply EXIF orientation
    const imageBitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image', // Apply EXIF orientation
    });
    
    console.log('createOrientedDataUrl: ImageBitmap created', {
      width: imageBitmap.width,
      height: imageBitmap.height,
    });
    
    // Get final dimensions (after orientation)
    let finalWidth = imageBitmap.width;
    let finalHeight = imageBitmap.height;
    
    // Apply downscaling if needed
    let scale = 1;
    if (maxWidth || maxHeight) {
      const scaleX = maxWidth ? Math.min(1, maxWidth / finalWidth) : 1;
      const scaleY = maxHeight ? Math.min(1, maxHeight / finalHeight) : 1;
      scale = Math.min(scaleX, scaleY);
      finalWidth = Math.round(finalWidth * scale);
      finalHeight = Math.round(finalHeight * scale);
      console.log('createOrientedDataUrl: Downscaling applied', {
        scale,
        finalWidth,
        finalHeight,
      });
    }
    
    // Create canvas with final dimensions
    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw the image bitmap (already oriented)
    ctx.drawImage(imageBitmap, 0, 0, finalWidth, finalHeight);
    
    // Clean up
    imageBitmap.close();
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    console.log('createOrientedDataUrl: Success', {
      finalWidth,
      finalHeight,
      dataUrlLength: dataUrl.length,
    });
    
    return {
      dataUrl,
      width: finalWidth,
      height: finalHeight,
    };
  } catch (error) {
    console.error('createOrientedDataUrl: Error, falling back to standard loading', error);
    
    // Fallback: use regular Image loading without orientation correction
    const img = await new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(file);
    });
    
    let finalWidth = img.naturalWidth;
    let finalHeight = img.naturalHeight;
    
    if (maxWidth || maxHeight) {
      const scaleX = maxWidth ? Math.min(1, maxWidth / finalWidth) : 1;
      const scaleY = maxHeight ? Math.min(1, maxHeight / finalHeight) : 1;
      const scale = Math.min(scaleX, scaleY);
      finalWidth = Math.round(finalWidth * scale);
      finalHeight = Math.round(finalHeight * scale);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
    URL.revokeObjectURL(img.src);
    
    const dataUrl = canvas.toDataURL('image/png');
    
    console.log('createOrientedDataUrl: Fallback success', {
      finalWidth,
      finalHeight,
      dataUrlLength: dataUrl.length,
    });
    
    return {
      dataUrl,
      width: finalWidth,
      height: finalHeight,
    };
  }
}
