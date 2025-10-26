/**
 * Transform Utilities
 * 
 * Simple transformation logic following Konva example pattern
 * 
 * CRITICAL: Use getTransform() instead of getAbsoluteTransform() to get LOCAL transform only.
 * This excludes the Stage's scale/position transform which is essential for custom coordinate systems
 * where the Stage itself has scaleX/scaleY and x/y positioning.
 */

/**
 * Normalize rotation to stay within snap intervals
 * Ensures rotation values remain consistent with snap steps (e.g., 0, 15, 30, 45...)
 * 
 * @param {number} rotation - Raw rotation value
 * @param {number} rotationSnaps - Number of rotation snap points (0 = no snapping)
 * @returns {number} Normalized rotation value
 */
function normalizeRotation(rotation, rotationSnaps = 0) {
  if (rotationSnaps <= 0) return rotation;
  
  const snapAngle = 360 / rotationSnaps;
  // Normalize to 0-360 range
  let normalized = rotation % 360;
  if (normalized < 0) normalized += 360;
  
  // Round to nearest snap point
  return Math.round(normalized / snapAngle) * snapAngle;
}

/**
 * Apply group transform to items
 * Following Konva example but using LOCAL transform (not absolute)
 * to avoid including Stage's scale/position transform
 * 
 * @param {Object} group - Konva Group node
 * @param {Array} originalItems - Items from snapshot (original positions)
 * @param {Array} currentItems - Current item state
 * @param {Array} selectedIds - IDs of selected items
 * @param {number} rotationSnaps - Number of rotation snap points
 * @returns {Array} Transformed items
 */
export function applyGroupTransformToItems(group, originalItems, currentItems, selectedIds, rotationSnaps = 0) {
  if (!group || !originalItems.length) return currentItems;

  // Check if group has been transformed
  const tolerance = 0.01;
  const hasTransform = !(
    Math.abs(group.x()) < tolerance &&
    Math.abs(group.y()) < tolerance &&
    Math.abs(group.scaleX() - 1) < tolerance &&
    Math.abs(group.scaleY() - 1) < tolerance &&
    Math.abs(group.rotation()) < tolerance
  );

  if (!hasTransform) {
    return currentItems; // No transform to apply
  }

  // Use getTransform() instead of getAbsoluteTransform() to get LOCAL transform only
  // This excludes the Stage's scale/position transform (critical for custom coordinate systems)
  const transform = group.getTransform();
  const groupScaleX = group.scaleX();
  const groupScaleY = group.scaleY();
  const groupRotation = group.rotation();

  return currentItems.map((item) => {
    if (!selectedIds.includes(item.id)) return item;

    const original = originalItems.find(orig => orig.id === item.id);
    if (!original) return item;

    // Transform position using Konva's transform.point()
    const newPos = transform.point({ x: original.x, y: original.y });

    // Calculate new rotation with snap normalization
    const newRotation = normalizeRotation((original.rotation || 0) + groupRotation, rotationSnaps);

    return {
      ...item,
      x: newPos.x,
      y: newPos.y,
      rotation: newRotation,
      scaleX: (original.scaleX || 1) * groupScaleX,
      scaleY: (original.scaleY || 1) * groupScaleY,
    };
  });
}

/**
 * Apply transform to text boxes with special handling for font size
 * Uses LOCAL transform to avoid including Stage's scale/position
 * 
 * @param {Object} group - Konva Group node
 * @param {Array} originalTextBoxes - Text boxes from snapshot
 * @param {Array} currentTextBoxes - Current text box state
 * @param {Array} selectedTextIds - IDs of selected text boxes
 * @param {number} rotationSnaps - Number of rotation snap points
 * @returns {Array} Transformed text boxes
 */
export function applyGroupTransformToTextBoxes(group, originalTextBoxes, currentTextBoxes, selectedTextIds, rotationSnaps = 0) {
  if (!group || !originalTextBoxes.length) return currentTextBoxes;

  const tolerance = 0.01;
  const hasTransform = !(
    Math.abs(group.x()) < tolerance &&
    Math.abs(group.y()) < tolerance &&
    Math.abs(group.scaleX() - 1) < tolerance &&
    Math.abs(group.scaleY() - 1) < tolerance &&
    Math.abs(group.rotation()) < tolerance
  );

  if (!hasTransform) {
    return currentTextBoxes;
  }

  // Use getTransform() instead of getAbsoluteTransform() to get LOCAL transform only
  // This excludes the Stage's scale/position transform (critical for custom coordinate systems)
  const transform = group.getTransform();
  const groupScaleX = group.scaleX();
  const groupScaleY = group.scaleY();
  const groupRotation = group.rotation();

  return currentTextBoxes.map((textBox) => {
    if (!selectedTextIds.includes(textBox.id)) return textBox;

    const original = originalTextBoxes.find(orig => orig.id === textBox.id);
    if (!original) return textBox;

    const newPos = transform.point({ x: original.x, y: original.y });

    // Handle font size scaling
    const scaleDiff = Math.abs(groupScaleX - groupScaleY);
    const isProportional = scaleDiff < 0.1;

    let newFontSize = original.fontSize || 24;
    let newWidth = original.width || 200;

    if (isProportional) {
      // Corner resize: scale font size proportionally
      const avgScale = (groupScaleX + groupScaleY) / 2;
      newFontSize = Math.max(8, Math.round(newFontSize * avgScale));
      newWidth = Math.max(20, newWidth * avgScale);
    } else {
      // Side resize: adjust width only
      newWidth = Math.max(20, newWidth * groupScaleX);
    }

    // Calculate new rotation with snap normalization
    const newRotation = normalizeRotation((original.rotation || 0) + groupRotation, rotationSnaps);

    return {
      ...textBox,
      x: newPos.x,
      y: newPos.y,
      rotation: newRotation,
      fontSize: newFontSize,
      width: newWidth,
      scaleX: 1,
      scaleY: 1,
    };
  });
}
