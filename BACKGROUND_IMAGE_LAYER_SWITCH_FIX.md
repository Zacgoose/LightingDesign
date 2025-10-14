# Background Image Layer Switch Fix

## Issue
When uploading a background image to a floor and then switching to another floor layer, the newly uploaded background image is lost. This happens because the sync effects use a stale closure value of `activeLayerId`.

## Root Cause
The sync effects (lines 201-242 in `/lightingdesign/src/pages/jobs/design/index.jsx`) save changes to the active layer when data changes:

```javascript
// BEFORE - stale closure bug
useEffect(() => {
  if (isLoadingLayerData.current) return;
  updateLayer(activeLayerId, { backgroundImage, backgroundImageNaturalSize });
}, [backgroundImage, backgroundImageNaturalSize, updateLayer]);
```

### The Problem with Stale Closures

When React creates an effect, it captures the current values of all variables referenced in the effect. If those variables are not in the dependency array, the effect uses the captured (stale) values even when the variables change.

**Scenario that triggers the bug:**

1. User is on Floor 1 (`activeLayerId = "layer-1"`)
2. Effect is created with `activeLayerId = "layer-1"` captured in closure
3. User switches to Floor 2 (`activeLayerId = "layer-2"`)
4. Effect is NOT re-created because `activeLayerId` is not in dependencies
5. User uploads image to Floor 2
6. Effect runs due to `backgroundImage` changing
7. **Effect uses the stale `activeLayerId = "layer-1"` from closure**
8. Image is saved to Floor 1 instead of Floor 2!
9. When switching back to Floor 2, the image is gone

### Why Not Add `activeLayerId` to Dependencies?

According to `BACKGROUND_IMAGE_SWITCH_FIX.md`, adding `activeLayerId` to dependencies causes a different bug:
- The effect would run every time you switch layers
- This can create race conditions where layer data gets saved to the wrong layer during the switch
- The `isLoadingLayerData` guard isn't sufficient because of timing issues

## The Solution

Use a ref to always have access to the current `activeLayerId` without adding it to dependencies:

```javascript
// New ref to track current activeLayerId
const activeLayerIdRef = useRef(activeLayerId);

// Keep ref in sync
useEffect(() => {
  activeLayerIdRef.current = activeLayerId;
}, [activeLayerId]);

// Use ref in sync effects
useEffect(() => {
  if (isLoadingLayerData.current) return;
  updateLayer(activeLayerIdRef.current, { backgroundImage, backgroundImageNaturalSize });
}, [backgroundImage, backgroundImageNaturalSize, updateLayer]);
```

### Why This Works

1. **No stale closures**: `activeLayerIdRef.current` always reads the latest value
2. **No race conditions**: The effect only runs when data changes, not when switching layers
3. **Correct layer targeting**: Always saves to the current active layer

### Data Flow After Fix

```
User uploads image to Floor 2
    ↓
setBackgroundImage(base64Data)
    ↓
Sync effect triggers (backgroundImage changed)
    ↓
isLoadingLayerData.current = false (not switching)
    ↓
updateLayer(activeLayerIdRef.current, { backgroundImage })
    ↓
activeLayerIdRef.current = "layer-2" ✓
    ↓
Floor 2 layer updated with image ✓

User switches to Floor 1
    ↓
activeLayerId = "layer-1"
activeLayerIdRef.current = "layer-1"
    ↓
Load Floor 1 data (no image)
    ↓
Sync effect doesn't run (backgroundImage value didn't change relative to Floor 1)
    ↓
✓ Floor 1 shown correctly

User switches back to Floor 2
    ↓
activeLayerId = "layer-2"
activeLayerIdRef.current = "layer-2"
    ↓
Load Floor 2 data (has image)
    ↓
✓ Floor 2 image shown correctly
```

## Files Changed

- `/lightingdesign/src/pages/jobs/design/index.jsx`
  - Line 137: Added `activeLayerIdRef` ref
  - Lines 142-144: Added effect to keep ref in sync with `activeLayerId`
  - Lines 204, 207: Updated products sync to use `activeLayerIdRef.current`
  - Lines 212, 215: Updated connectors sync to use `activeLayerIdRef.current`
  - Lines 220, 227: Updated background image sync to use `activeLayerIdRef.current`
  - Lines 235, 238: Updated scale factor sync to use `activeLayerIdRef.current`

## Testing

To verify the fix works:

1. **Basic test**: Upload image to Floor 1, switch to Floor 2, upload different image, switch back to Floor 1 → Both images should be preserved
2. **Save/load test**: Upload images to multiple floors, save design, reload page → All images should be restored
3. **Quick switch test**: Upload image and immediately switch layers → Image should be saved to correct floor
4. **Multiple switches**: Upload to Floor 2, switch to Floor 1, switch to Floor 3, switch back to Floor 2 → Image on Floor 2 should still be there

## Related Issues

This fix maintains the protections from previous fixes:
- `BACKGROUND_IMAGE_FIX.md` - Initial load issue (fixed by `lastLoadedLayerId.current = null`)
- `BACKGROUND_IMAGE_SWITCH_FIX.md` - Race condition on layer switch (fixed by removing `activeLayerId` from dependencies)

The key insight is that we need the *current* `activeLayerId` without it being in the dependency array. The ref pattern solves this perfectly.
