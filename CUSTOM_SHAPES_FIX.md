# Custom Shape Insertion Fix

## Problem Summary
Custom shapes were not inserting correctly on the designer canvas page:
1. Most shapes showed incorrect size/appearance (or showed fallback rect shape)
2. Transformer selection box was cutting off parts of shapes (especially top portions)

## Root Causes

### 1. Double-Scaling Bug
The shape rendering had a double-scaling issue:

**Before:**
```javascript
// ProductShape.jsx calculated dimensions
const renderedWidth = realWorldSize * scaleFactor; // e.g., 1.0m * 100 = 100px

// Then passed to Shape component
<Shape width={renderedWidth} ... />

// Shape function RECALCULATED (double scaling!)
const scaleFactor = shape.getAttr("scaleFactor") || 50;
const realWorldSize = shape.getAttr("realWorldSize") || ...;
const width = realWorldSize * scaleFactor; // AGAIN!
```

This caused shapes to be rendered at incorrect sizes (often much too large).

**After:**
```javascript
// ProductShape.jsx calculates dimensions (same as before)
const renderedWidth = realWorldSize * scaleFactor;

// Shape function uses pre-calculated dimensions
const width = shape.width(); // Just use what was already calculated
```

### 2. Transformer Bounding Box Issue
Some shapes have decorative elements that extend beyond their main body:
- **Pendant**: Wire extends 50% of radius above the circle (total height = 1.25x width)
- **Spotlight**: Mounting bracket extends above the light body
- **Chandelier**: Same wire as pendant

The Shape component was reporting dimensions based only on the main body, not including these extensions.

**Fix:** Updated `productTypes.json` to specify separate `realWorldWidth` and `realWorldHeight` for shapes with extensions:
- Pendant: `realWorldWidth: 1.0, realWorldHeight: 1.25`
- Chandelier: `realWorldWidth: 1.4, realWorldHeight: 1.75`
- Spotlight: `realWorldWidth: 0.8, realWorldHeight: 0.96`

## Files Changed

### 1. `/lightingdesign/src/components/designer/productShapes.js`
- Removed double-scaling calculations from all shape functions
- Changed to use `shape.width()` and `shape.height()` directly
- Simplified and removed redundant code
- Fixed: pendant, downlight, spotlight, wall, fan, lamp, strip, ceiling, circle, rect, arrow, boxoutline

### 2. `/lightingdesign/src/data/productTypes.json`
- Updated pendant: Added `realWorldWidth: 1.0, realWorldHeight: 1.25`
- Updated chandelier: Added `realWorldWidth: 1.4, realWorldHeight: 1.75`
- Updated spotlight: Added `realWorldWidth: 0.8, realWorldHeight: 0.96`

## Testing Steps

### Test 1: Basic Shape Insertion
1. Open a design in the designer canvas
2. Right-click on empty canvas
3. Select "Insert Custom Object" → try each shape:
   - Arrow
   - Box Outline
   - Pendant
   - Downlight
   - Spotlight
   - Wall Light
   - Ceiling Light
   - Floor Lamp
   - Table Lamp
   - Lamp
   - Strip Light
   - Fan
   - Track Light
   - Chandelier

**Expected:** Each shape should appear with correct visual appearance at reasonable size

### Test 2: Shape Sizing
1. Insert multiple instances of the same shape
2. Verify they all have consistent size
3. Insert shapes on layers with different scaleFactor settings
4. Verify shapes scale appropriately with the layer scale

**Expected:** Shapes maintain correct proportions and scale with layer settings

### Test 3: Transformer Selection
1. Insert a pendant shape
2. Click to select it
3. Verify the transformer box (blue selection outline) encompasses:
   - The entire circular body
   - The hanging wire above
   
**Expected:** Transformer box should not cut off any part of the shape

### Test 4: Transform Operations
1. Insert a shape
2. Select it with the transformer
3. Try these operations:
   - Drag to move
   - Drag corner to scale
   - Drag rotation handle to rotate
   - Drag edge to resize width/height independently

**Expected:** All transform operations should work smoothly, transformer should track the shape correctly

### Test 5: Complex Shapes
Test shapes with special features:
- **Pendant/Chandelier**: Wire extends above
- **Spotlight**: Mounting bracket extends above
- **Downlight**: Light rays extend outward
- **Arrow**: Asymmetric shape
- **Box Outline**: Stroke-only, no fill

**Expected:** All features render correctly, transformer encompasses full shape

## Shape Mapping Reference

Some menu items use shared shape functions:
- "Floor Lamp" → uses `lamp` shape
- "Table Lamp" → uses `lamp` shape
- "Track Light" → uses `strip` shape
- "Chandelier" → uses `pendant` shape (with larger dimensions)

This is correct and intentional - these items configure the base shape with different sizes/colors.

## Technical Details

### Shape Rendering Flow
1. User inserts custom shape via context menu
2. `handleInsertCustomObject(shapeName)` in `index.jsx`:
   - Looks up config from `productTypesConfig[shapeName]`
   - Creates product with `product_type: shapeName`
   - Sets `scaleFactor` from current layer
   
3. `ProductsLayer.jsx` renders the product:
   - Looks up `config = productTypesConfig[product_type.toLowerCase()]`
   - Passes config to `ProductShape`
   
4. `ProductShape.jsx` calculates dimensions:
   - `renderedWidth = realWorldWidth * scaleFactor`
   - `renderedHeight = realWorldHeight * scaleFactor`
   - Passes to Konva Shape as width/height props
   
5. Shape function draws:
   - Gets `width = shape.width()` (pre-calculated)
   - Draws using canvas context
   - Calls `fillStrokeShape(shape)` to apply fill/stroke

6. Transformer calculates bounding box:
   - Konva automatically determines bounds from drawn paths
   - Includes all drawing operations (fills, strokes, lines)
   
### Scale Factor
- Default: 100 pixels per meter
- Stored per-layer (can be different for each floor plan)
- Example: 1.0m pendant with scaleFactor=100 renders as 100px diameter

### Real World Dimensions
- Specified in meters in `productTypes.json`
- `realWorldSize`: Used for circular/square shapes (same width & height)
- `realWorldWidth` & `realWorldHeight`: Used for rectangular shapes or shapes with extensions
- These represent the actual physical size of the fixture in the real world

## Known Limitations

1. **Decorative elements**: Some shapes have thin decorative elements (rays, wires) that may extend beyond the Shape's reported width/height. Konva should handle this automatically when calculating transformer bounds.

2. **Stroke width**: Strokes extend outward from paths by strokeWidth/2. This is normal canvas behavior and Konva accounts for it.

3. **Text labels**: Product names/SKUs are positioned relative to shape dimensions. Very tall shapes (like lamps) may have labels positioned far from the shape.

## Future Enhancements

Potential improvements for custom shapes:
1. Add more shape types (triangle, star, hexagon, etc.)
2. Allow users to create custom shapes with a shape editor
3. Support SVG import for custom shapes
4. Add shape library/favorites
5. Support shape fill patterns (gradients, textures)
