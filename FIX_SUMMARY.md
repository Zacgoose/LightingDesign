# Fix Summary: Background Image Loss When Switching Floor Layers

## Problem
When uploading a background image to a floor layer and then switching to another layer, the newly uploaded background image was lost.

## Root Cause
The sync effects that save layer data (products, connectors, background images, scale factor) were using stale closure values of `activeLayerId`. 

When you switched from Floor 1 to Floor 2 and uploaded an image, the sync effect would use the old `activeLayerId = "layer-1"` from its closure and save the image to the wrong layer.

## Solution
Added a ref `activeLayerIdRef` that always contains the current `activeLayerId` value. The sync effects now use `activeLayerIdRef.current` instead of the closure value, ensuring they always save to the correct layer.

```javascript
// Before (buggy):
useEffect(() => {
  updateLayer(activeLayerId, { backgroundImage }); // Uses stale closure value
}, [backgroundImage]);

// After (fixed):
const activeLayerIdRef = useRef(activeLayerId);

useEffect(() => {
  activeLayerIdRef.current = activeLayerId; // Keep ref in sync
}, [activeLayerId]);

useEffect(() => {
  updateLayer(activeLayerIdRef.current, { backgroundImage }); // Always uses current value
}, [backgroundImage]);
```

## Changes Made
- **File**: `/lightingdesign/src/pages/jobs/design/index.jsx`
- Added `activeLayerIdRef` to track the current active layer
- Added effect to keep the ref in sync with `activeLayerId`
- Updated 4 sync effects (products, connectors, background image, scale factor) to use the ref

## Testing
Manual testing should verify:
1. Upload image to Floor 2, switch layers, switch back → image persists
2. Upload different images to multiple floors → each floor keeps its own image
3. Upload and immediately switch layers → image still saved correctly
4. Save and reload → all images restore properly

## Files Changed
- `lightingdesign/src/pages/jobs/design/index.jsx` - Core fix
- `BACKGROUND_IMAGE_LAYER_SWITCH_FIX.md` - Detailed technical explanation
- `tests/background-image-layer-switch.test.js` - Test scenarios and manual testing instructions
