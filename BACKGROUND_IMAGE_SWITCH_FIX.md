# Additional Fix: Background Image Loss on Layer Switch

## Issue
When switching from Floor 2 to Floor 1, the background image would be lost.

## Root Cause
The sync effects (lines 192-223) had `activeLayerId` in their dependency arrays:

```javascript
// BEFORE - causes image loss
useEffect(() => {
  if (isLoadingLayerData.current) return;
  updateLayer(activeLayerId, { backgroundImage, backgroundImageNaturalSize });
}, [backgroundImage, backgroundImageNaturalSize, activeLayerId, updateLayer]);
//                                                 ^^^^^^^^^^^^^ - Problem!
```

### What Was Happening

1. User switches from Floor 2 to Floor 1
2. Layer switch effect sets `isLoadingLayerData.current = true`
3. Layer switch effect loads Floor 1's data into state: `setBackgroundImage(activeLayer.backgroundImage)`
4. **React schedules re-render with new `activeLayerId` and new `backgroundImage`**
5. Layer switch effect sets timeout to clear `isLoadingLayerData.current` after 100ms
6. **Sync effect runs because `activeLayerId` changed** (it's in deps)
7. Sync effect sees `isLoadingLayerData.current = true`, so it returns early... **OR**
8. **Race condition**: If sync effect runs after the 100ms timeout, it writes the current state to the layer
9. If the current state is stale or being updated, it can overwrite the layer with incorrect data

## The Fix

Remove `activeLayerId` from all sync effect dependencies:

```javascript
// AFTER - correct behavior
useEffect(() => {
  if (isLoadingLayerData.current) return;
  updateLayer(activeLayerId, { backgroundImage, backgroundImageNaturalSize });
}, [backgroundImage, backgroundImageNaturalSize, updateLayer]);
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ - Only data changes
```

### Why This Works

1. **Sync effects only run when data changes**, not when switching layers
2. The `activeLayerId` value is captured in the closure when the effect is created
3. When switching layers:
   - Layer switch effect updates state
   - `isLoadingLayerData.current = true` prevents sync effects from running
   - After timeout, `isLoadingLayerData.current = false`
   - Sync effects don't run because their dependencies (backgroundImage, etc.) haven't changed
4. When user actually changes data (uploads new image):
   - Sync effect runs because `backgroundImage` changed
   - Uses current `activeLayerId` from closure to save to correct layer

## Data Flow After Fix

```
Switch Layer (Floor 2 → Floor 1)
    ↓
Layer Switch Effect triggers (activeLayerId changed)
    ↓
isLoadingLayerData.current = true
    ↓
Load Floor 1 data: setBackgroundImage(floor1.backgroundImage)
    ↓
Sync Effect checks dependencies: [backgroundImage, updateLayer]
    - backgroundImage didn't "change" (it's now floor1's image)
    - Effect doesn't run
    ↓
After 100ms: isLoadingLayerData.current = false
    ↓
✅ Floor 1 image displayed correctly

Upload New Image to Floor 1
    ↓
setBackgroundImage(newImage)
    ↓
Sync Effect triggers (backgroundImage changed)
    ↓
isLoadingLayerData.current = false (not loading)
    ↓
updateLayer(activeLayerId, { backgroundImage: newImage })
    ↓
✅ Floor 1 layer updated with new image
```

## Files Changed
- `/lightingdesign/src/pages/jobs/design/index.jsx` lines 192-223
  - Removed `activeLayerId` from dependencies of 4 sync effects
  - Added comments explaining why activeLayerId is intentionally omitted

## Commit
- Hash: `83193d3`
- Message: "Fix background image loss when switching between layers"
