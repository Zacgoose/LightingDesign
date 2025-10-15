# Canvas Coordinate System Refactoring

## Problem
The previous implementation tied the canvas coordinate space to the viewport dimensions. When the browser window was resized, the canvas dimensions would change, causing:
- Grid scale to change incorrectly
- Object positions to appear to shift
- Background image scaling issues
- Inconsistent pixel-to-meter conversions

## Solution
Implemented a fixed virtual coordinate space that remains stable regardless of viewport size changes.

### Key Changes

#### 1. Fixed Virtual Canvas (useCanvasState.js)
- **Virtual Canvas**: Fixed 10000x10000 coordinate space
- **Viewport**: Dynamic dimensions that match the actual browser window size
- **Separation**: Canvas dimensions (coordinate space) != Viewport dimensions (visible area)

```javascript
const VIRTUAL_WIDTH = 10000;
const VIRTUAL_HEIGHT = 10000;
const [viewportWidth, setViewportWidth] = useState(initialWidth);
const [viewportHeight, setViewportHeight] = useState(initialHeight);
```

#### 2. Stage Rendering (DesignerCanvas.jsx)
- Stage width/height now use viewport dimensions (actual visible area)
- Canvas width/height represent the virtual coordinate space
- Objects are positioned in virtual coordinates but rendered in viewport

```javascript
const stageWidth = viewportWidth || width;
const stageHeight = viewportHeight || height;
```

#### 3. Viewport Resize Handling
When the viewport resizes, the stage position is adjusted to maintain the same view:
```javascript
const deltaX = (newWidth - oldWidth) / 2;
const deltaY = (newHeight - oldHeight) / 2;
setStagePosition(pos => ({ x: pos.x + deltaX, y: pos.y + deltaY }));
```

### Coordinate Transformations

#### Screen to Canvas
```javascript
const canvasX = (screenX - stagePosition.x) / stageScale;
const canvasY = (screenY - stagePosition.y) / stageScale;
```

#### Canvas to Screen
```javascript
const screenX = canvasX * stageScale + stagePosition.x;
const screenY = canvasY * stageScale + stagePosition.y;
```

### Backward Compatibility
The system remains backward compatible because:
1. Both old and new systems center the coordinate space at (0, 0)
2. Object coordinates are relative to (0, 0), not absolute canvas dimensions
3. Grid and background images are generated dynamically based on current dimensions

### Benefits
1. **Stable Coordinates**: Object positions never change with window resize
2. **Consistent Scaling**: `scaleFactor` (pixels per meter) remains consistent
3. **Grid Stability**: Grid spacing remains accurate during resize
4. **Image Scaling**: Background images maintain correct scale
5. **Backward Compatible**: Existing saved designs work without migration

### Testing Checklist
- [x] Objects maintain position during window resize
- [x] Grid scale remains consistent
- [x] Zoom and pan work correctly
- [x] Measurement tool provides accurate measurements
- [x] Background images scale correctly
- [x] Product placement works in all viewport sizes
- [x] Drag, rotate, and scale operations work correctly
