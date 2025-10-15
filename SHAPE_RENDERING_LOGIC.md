# Product Shape Rendering - Complete Logic Review

## Overview
This document explains the complete logic for product shape placement, text positioning, scaling, and bounding boxes in the new coordinate system.

## Coordinate System Foundation

### Virtual Canvas
- **Fixed size**: 10000×10000 virtual units
- **Never changes** regardless of window size
- All objects positioned in this stable coordinate space

### Key Concept: scaleFactor
- Represents **virtual canvas units per meter**
- Example: scaleFactor = 100 means 100 virtual units = 1 meter
- Each product stores its own scaleFactor at creation time
- Prevents unexpected resizing if layer scale changes

## Product Shape Rendering Logic

### 1. Dimension Calculation

```javascript
// Step 1: Get scaleFactor (virtual units per meter)
const scaleFactor = product.scaleFactor || 100; // fallback to default

// Step 2: Get real-world dimensions (in meters)
const realWorldSize = product.realWorldSize || config.realWorldSize;
const realWorldWidth = product.realWorldWidth || config.realWorldWidth;
const realWorldHeight = product.realWorldHeight || config.realWorldHeight;

// Step 3: Calculate rendered dimensions (in virtual canvas units)
if (realWorldSize) {
  // For circular/square shapes (e.g., pendant, downlight)
  renderedWidth = renderedHeight = realWorldSize * scaleFactor;
  // Example: 1.0 meter × 100 units/meter = 100 virtual units
} else if (realWorldWidth && realWorldHeight) {
  // For rectangular shapes (e.g., lamp, strip)
  renderedWidth = realWorldWidth * scaleFactor;
  renderedHeight = realWorldHeight * scaleFactor;
  // Example: 0.6m × 100 = 60 units, 0.1m × 100 = 10 units
} else {
  // Fallback to config dimensions (for backward compatibility)
  renderedWidth = config.width || 30;
  renderedHeight = config.height || 30;
}
```

### 2. Text Scaling

Text must scale proportionally with the object to remain readable:

```javascript
// Baseline dimension from original config
const baselineDimension = 50; // Config sizes designed for ~50px objects

// Calculate scale factor
const textScale = maxDimension / baselineDimension;
// Example: 100 unit object / 50 baseline = 2× scale

// Scale font sizes proportionally
const skuFontSize = Math.max(11 * textScale, 8);  // Min 8px
const nameFontSize = Math.max(10 * textScale, 7); // Min 7px
const textWidth = 120 * textScale;

// Example with 100 unit object:
// skuFontSize = 11 × 2 = 22px
// nameFontSize = 10 × 2 = 20px
// textWidth = 120 × 2 = 240 units
```

### 3. Text Positioning

Text is positioned relative to the rendered object dimensions:

```javascript
// Position below the shape
const textYOffset = maxDimension / 2 + 10 * textScale;
// Example: 100/2 + 10×2 = 50 + 20 = 70 units below center

// Position above the shape
const skuYOffset = -(maxDimension / 2 + 20 * textScale);
// Example: -(100/2 + 20×2) = -(50 + 40) = -90 units above center

// Center text horizontally
x={-textWidth / 2}
// Example: -240/2 = -120 units (centered)
```

### 4. Shape Rendering

The Shape component uses custom `sceneFunc`:

```javascript
<Shape
  sceneFunc={(context, shape) => shapeFunction(context, shape)}
  width={renderedWidth}   // Passes dimension to shape function
  height={renderedHeight} // Passes dimension to shape function
  // NO offsetX/offsetY - shapes draw centered at (0,0)
  realWorldWidth={product.realWorldWidth}
  realWorldHeight={product.realWorldHeight}
  realWorldSize={product.realWorldSize}
  scaleFactor={product.scaleFactor}
/>
```

**Why no offsetX/offsetY?**
- Shape functions draw centered at (0,0) by design
- Group handles positioning with x/y props
- Adding offsets would shift the drawn content incorrectly
- Bounding box is auto-calculated from drawn paths

### 5. Group Positioning

The Group handles overall placement and transformations:

```javascript
<Group
  x={product.x}           // Position in virtual canvas
  y={product.y}           // Position in virtual canvas
  rotation={product.rotation || 0}
  scaleX={product.scaleX || 1}  // User-applied scale
  scaleY={product.scaleY || 1}  // User-applied scale
  draggable={draggable}
>
  {/* Shape and text children */}
</Group>
```

**Transform order**:
1. Shape drawn at (0,0) in local coordinates
2. Group applies scaleX/scaleY
3. Group applies rotation
4. Group applies translation (x, y)

## Example Calculations

### Scenario: Pendant Light
- Real-world size: 1.0 meter
- Layer scaleFactor: 100 units/meter
- Config baseline: 50px

**Rendered dimensions**:
```
renderedWidth = 1.0 × 100 = 100 virtual units
renderedHeight = 1.0 × 100 = 100 virtual units
maxDimension = 100 units
```

**Text scaling**:
```
textScale = 100 / 50 = 2.0
skuFontSize = 11 × 2.0 = 22px
nameFontSize = 10 × 2.0 = 20px
textWidth = 120 × 2.0 = 240 units
```

**Text positioning**:
```
textYOffset = 100/2 + 10×2 = 70 units (below center)
skuYOffset = -(100/2 + 20×2) = -90 units (above center)
textX = -240/2 = -120 units (centered)
```

### Scenario: LED Strip
- Real-world dimensions: 0.6m × 0.1m
- Layer scaleFactor: 100 units/meter

**Rendered dimensions**:
```
renderedWidth = 0.6 × 100 = 60 virtual units
renderedHeight = 0.1 × 100 = 10 virtual units
maxDimension = 60 units
```

**Text scaling**:
```
textScale = 60 / 50 = 1.2
skuFontSize = 11 × 1.2 = 13.2px
nameFontSize = 10 × 1.2 = 12px
textWidth = 120 × 1.2 = 144 units
```

## Bounding Box Behavior

### How Konva Calculates Bounding Box

For shapes with custom `sceneFunc`:
1. Konva traces the actual drawn paths
2. Calculates bounding rectangle from path extents
3. Width/height props are available to shape function but don't define bounds
4. offsetX/offsetY would shift the coordinate system (not desired here)

### Why Our Approach Works

1. **Shape functions draw centered at (0,0)**
   - All shapes use coordinates relative to (0,0)
   - Example: `arc(0, 0, radius, ...)`

2. **Bounding box auto-calculated correctly**
   - Konva detects the actual drawn extents
   - For 100-unit pendant: bounding box ≈ -50 to +50 in x and y

3. **Text positioned relative to bounds**
   - Text placed outside the shape's calculated bounds
   - Scales proportionally with shape size

4. **Group handles positioning**
   - No offset needed on Shape itself
   - Group's x/y moves everything together

## Common Issues and Solutions

### Issue: Text too small
**Cause**: Fixed font size doesn't scale with object
**Solution**: `fontSize = baseFontSize × textScale`

### Issue: Bounding box misaligned
**Cause**: Adding offsetX/offsetY shifts coordinate system
**Solution**: Remove offsets, shapes draw centered naturally

### Issue: Text not centered
**Cause**: Fixed x position doesn't account for scaled width
**Solution**: `x = -textWidth / 2` where textWidth scales

### Issue: Objects wrong size
**Cause**: Not storing scaleFactor at creation
**Solution**: Store scaleFactor in product at creation time

## Backward Compatibility

### Products without scaleFactor
```javascript
const scaleFactor = product.scaleFactor || 100;
```
Falls back to default 100 units/meter

### Products without real-world dimensions
```javascript
const realWorldSize = product.realWorldSize || config.realWorldSize;
```
Uses productTypes.json config values

### Shape function fallback
```javascript
const realWorldSize = shape.getAttr("realWorldSize") || 
  (shape.width() ? shape.width() / scaleFactor : 1);
```
Calculates from width if realWorldSize not available

## Summary

The system now:
1. ✅ Uses fixed virtual canvas (10000×10000)
2. ✅ Stores scaleFactor and real-world dimensions per product
3. ✅ Calculates rendered dimensions: `realWorld × scaleFactor`
4. ✅ Scales text proportionally with object size
5. ✅ Positions text relative to rendered dimensions
6. ✅ Lets shapes draw centered at (0,0) naturally
7. ✅ Lets Konva calculate bounding box from drawn paths
8. ✅ Uses Group for positioning and transformations
9. ✅ Maintains backward compatibility with fallbacks

All components work together to provide stable, predictable rendering regardless of window size.
