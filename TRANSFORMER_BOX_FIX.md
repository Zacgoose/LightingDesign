# Transformer Box Fix for Custom Objects

## Problem
Custom objects inserted via "Insert Custom Object" had transformer bounding boxes that did not correctly surround the shapes. The issue was specific to shapes with asymmetric extensions (pendant, spotlight, chandelier) and did not affect regular products inserted via "Add Products".

## Root Cause
Shapes with vertical extensions (like pendant's hanging wire or spotlight's mounting bracket) were drawn offset from the center, causing the drawn content to not align with Konva's bounding box calculations. This resulted in the transformer box cutting off parts of the shapes.

### Technical Details
For shapes with extensions:
- **Pendant**: Has a wire extending 0.5*radius (0.25*width) above the circular body
- **Spotlight**: Has a mounting bracket extending 0.4*radius (0.2*width) above the light body

The shapes were drawn centered at y=0, but the content itself was asymmetric:
- Pendant wire top: -radius*1.5, circle bottom: +radius
- Content center: -radius*0.25 (not at y=0)

When Konva calculated the bounding box, it would be offset from where the transformer expected it, causing misalignment.

## Solution
Added a vertical offset (`yOffset`) to center the drawn content at y=0 within the shape's height bounds.

### Pendant Shape
- Wire extends 0.5*radius above the circle
- Total drawn height: 2.5*radius (wire: 0.5*radius + circle: 2*radius)
- Without offset, center is at -radius*0.25
- **Fix**: Offset all drawing by +radius*0.25 to center at y=0

```javascript
const yOffset = radius * 0.25;
// Wire: from -radius*1.5 + yOffset to -radius + yOffset
// Circle: center at yOffset, radius
```

### Spotlight Shape
- Mounting bracket extends 0.4*radius above the light body
- Total drawn height: 2.4*radius (bracket extension: 0.4*radius + light: 2*radius)
- Without offset, center is at -radius*0.2
- **Fix**: Offset all drawing by +radius*0.2 to center at y=0
- **Additional fix**: Corrected bracket to extend 0.4*radius (was 0.2*radius) to match realWorldHeight ratio of 1.2

```javascript
const yOffset = radius * 0.2;
// Bracket: from -radius*1.4 + yOffset with height radius*0.4
// Light: from -radius + yOffset to radius + yOffset
```

### Chandelier Shape
Uses the pendant shape function, so it's automatically fixed by the pendant changes.

## Verification
Created test script (`/tmp/test-shape-centering.js`) to verify:
1. Total drawn height matches configured realWorldHeight
2. Content is centered at y=0

Both pendant and spotlight tests pass ✓

## Files Changed
1. `/lightingdesign/src/components/designer/productShapes.js`
   - Updated `pendant` shape function to center content with yOffset
   - Updated `spotlight` shape function to center content with yOffset
   - Corrected spotlight bracket extension from 0.2*radius to 0.4*radius

## Testing
To verify the fix:
1. Open designer canvas
2. Right-click and select "Insert Custom Object"
3. Insert pendant, chandelier, and spotlight shapes
4. Select each shape
5. Verify transformer box (blue outline) fully encompasses the shape including:
   - Pendant: hanging wire above the circle
   - Chandelier: hanging wire above the circle
   - Spotlight: mounting bracket above the light body

The transformer box should not cut off any part of the shapes.

## Comparison: Custom Objects vs Regular Products
Both custom objects and regular products now correctly:
1. Get `realWorldWidth` and `realWorldHeight` from productTypes.json config
2. Calculate rendered dimensions: `renderedWidth = realWorldWidth * scaleFactor`
3. Pass these dimensions to the Shape component
4. Draw centered within those dimensions

The fix ensures shape drawing respects the height parameter and centers content properly.
