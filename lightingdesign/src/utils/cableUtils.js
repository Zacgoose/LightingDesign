/**
 * Cable/Connector utility functions
 * Shared utilities for cable rendering between designer and export
 */

/**
 * Calculate dynamic curve depth for cable Bézier curves
 * Based on distance between products to create natural-looking curves
 * 
 * @param {Object} fromProduct - Starting product with x, y coordinates
 * @param {Object} toProduct - Ending product with x, y coordinates
 * @returns {number} Curve depth value (capped at 80px)
 */
export const calculateCableDepth = (fromProduct, toProduct) => {
  // Calculate distance between products
  const distance = Math.sqrt(
    (toProduct.x - fromProduct.x) ** 2 + (toProduct.y - fromProduct.y) ** 2
  );
  
  // Scale curve depth based on distance for smoother curves when products are far apart
  // Use a logarithmic scale to prevent excessive curve depth at large distances
  // Formula: 30 (minimum) + logarithmic scaling factor, capped at 80px
  return Math.min(80, 30 + Math.log(distance + 1) * 15);
};

/**
 * Calculate default control points for a cable's Bézier curve
 * 
 * @param {Object} fromProduct - Starting product with x, y coordinates
 * @param {Object} toProduct - Ending product with x, y coordinates
 * @returns {Object} Object containing control1, control2, and control3 point coordinates
 */
export const calculateCableControlPoints = (fromProduct, toProduct) => {
  const curveDepth = calculateCableDepth(fromProduct, toProduct);
  
  return {
    control1: {
      x: fromProduct.x + (toProduct.x - fromProduct.x) * 0.25,
      y: Math.min(fromProduct.y, toProduct.y) - curveDepth * 0.75,
    },
    control2: {
      x: fromProduct.x + (toProduct.x - fromProduct.x) * 0.5,
      y: Math.min(fromProduct.y, toProduct.y) - curveDepth,
    },
    control3: {
      x: fromProduct.x + (toProduct.x - fromProduct.x) * 0.75,
      y: Math.min(fromProduct.y, toProduct.y) - curveDepth * 0.75,
    },
  };
};
