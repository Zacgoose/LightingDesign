# Fix Summary: Background Image Loss When Switching Floor Layers

## Problem
When uploading a background image to a floor layer and then switching to another layer, the newly uploaded background image was lost.

**Update:** A second issue was found where uploading to a second layer would save the image to the first layer instead.

## Root Cause
The sync effects that save layer data (products, connectors, background images, scale factor) were using stale closure values of `activeLayerId`. 

When you switched from Floor 1 to Floor 2 and uploaded an image, the sync effect would use the old `activeLayerId = "layer-1"` from its closure and save the image to the wrong layer.

**Second Issue:** When switching layers, the `activeLayerIdRef` was updated by a separate effect that could run after the layer switch effect completed. This created a race condition where uploads immediately after switching would use the old layer ID.

## Solution
Added a ref `activeLayerIdRef` that always contains the current `activeLayerId` value. The sync effects now use `activeLayerIdRef.current` instead of the closure value, ensuring they always save to the correct layer.

**Additional Fix:** Update `activeLayerIdRef.current` directly in the layer switch effect (before loading data) to eliminate race conditions.

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

// Layer switch effect also updates ref immediately
useEffect(() => {
  if (activeLayerId !== lastLoadedLayerId.current) {
    activeLayerIdRef.current = activeLayerId; // Update synchronously!
    // ... load layer data
  }
}, [activeLayerId]);

useEffect(() => {
  updateLayer(activeLayerIdRef.current, { backgroundImage }); // Always uses current value
}, [backgroundImage]);
```

## Changes Made
- **File**: `/lightingdesign/src/pages/jobs/design/index.jsx`
- Added `activeLayerIdRef` to track the current active layer
- Added effect to keep the ref in sync with `activeLayerId`
- **Added immediate ref update in layer switch effect** (prevents race condition)
- Updated 4 sync effects (products, connectors, background image, scale factor) to use the ref

## Testing
Manual testing should verify:
1. Upload image to Floor 1, switch layers, switch back → image persists ✓
2. Upload different images to Floor 1 and Floor 2 → both images persist ✓
3. Upload to Floor 2, switch to Floor 3, back to Floor 2 → image persists ✓
4. Upload and immediately switch layers → image still saved correctly ✓
5. Save and reload → all images restore properly ✓

## Files Changed
- `lightingdesign/src/pages/jobs/design/index.jsx` - Core fix (two commits)
- `BACKGROUND_IMAGE_LAYER_SWITCH_FIX.md` - Detailed technical explanation
- `tests/background-image-layer-switch.test.js` - Test scenarios and manual testing instructions
