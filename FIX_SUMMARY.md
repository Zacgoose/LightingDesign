# Fix Summary: Background Image Loss When Switching Floor Layers

## Problem
When uploading a background image to a floor layer and then switching to another layer, the newly uploaded background image was lost.

## Complete Fix Timeline

### Issue 1: Stale Closures (Commit 5b974f5)
**Problem:** Sync effects captured old `activeLayerId` values in their closures.
**Fix:** Added `activeLayerIdRef` ref that sync effects use via `.current` to always get the latest layer ID.

### Issue 2: Race Condition (Commit d9ffac7)
**Problem:** The ref update effect could run after layer switch completed, leaving a window where uploads use wrong layer ID.
**Fix:** Updated `activeLayerIdRef.current` directly in the layer switch effect before loading data.

### Issue 3: Missing Timeout (Commit 80f6b41)
**Problem:** The timeout that re-enables sync effects was accidentally removed in commit c23f63d, causing all sync effects to be permanently blocked.
**Fix:** Restored the timeout that sets `isLoadingLayerData.current = false` after 100ms.

### Issue 4: Effect Cancellation (Commit d5a567a)
**Problem:** setState functions in the effect's dependency array caused the effect to re-run constantly, canceling the timeout before it could complete.
**Fix:** Removed setState functions from dependencies since they're stable and don't need to trigger re-runs.

## Final Solution

The complete fix requires all four changes:

```javascript
// 1. Create ref to track current layer (Issue 1)
const activeLayerIdRef = useRef(activeLayerId);

// 2. Keep ref in sync
useEffect(() => {
  activeLayerIdRef.current = activeLayerId;
}, [activeLayerId]);

// 3. Layer switch effect
useEffect(() => {
  if (activeLayerId !== lastLoadedLayerId.current) {
    // 2. Update ref immediately (Issue 2)
    activeLayerIdRef.current = activeLayerId;
    
    isLoadingLayerData.current = true;
    
    // Load layer data...
    setBackgroundImage(activeLayer.backgroundImage);
    
    // 3. Re-enable sync after 100ms (Issue 3)
    const timer = setTimeout(() => {
      isLoadingLayerData.current = false;
      console.log('Layer switch complete - sync effects re-enabled');
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [
  activeLayerId,
  activeLayer,
  updateHistory,
  // 4. Don't include setState functions (Issue 4)
  // setBackgroundImage, etc. are stable
]);

// Sync effects use the ref (Issue 1)
useEffect(() => {
  if (isLoadingLayerData.current) return;
  updateLayer(activeLayerIdRef.current, { backgroundImage });
}, [backgroundImage, updateLayer]);
```

## Expected Console Output

After all fixes:
```
Switching to layer layer-1
  → hasBackgroundImage: true, backgroundImageLength: 170855
Background sync blocked - loading layer data  (during switch)
Layer switch complete - sync effects re-enabled  ✓ (after 100ms)

[User uploads image to layer-1]
Syncing background to layer: layer-1
  → hasImage: true, imageLength: 170855
updateLayer called: { layerId: 'layer-1', updates: ['backgroundImage', ...] }
Layer background updated: { layerId: 'layer-1', hasImage: true }

Switching to layer layer-2
  → hasBackgroundImage: false, backgroundImageLength: 0
Layer switch complete - sync effects re-enabled  ✓

[User uploads image to layer-2]
Syncing background to layer: layer-2
  → hasImage: true, imageLength: 359363
updateLayer called: { layerId: 'layer-2', updates: ['backgroundImage', ...] }
Layer background updated: { layerId: 'layer-2', hasImage: true }
```

## Testing

Manual testing should verify:
1. Upload image to Floor 1, switch layers, switch back → Floor 1 image persists ✓
2. Upload different images to Floor 1 and Floor 2 → both images persist ✓
3. Upload to Floor 2, switch to Floor 3, back to Floor 2 → Floor 2 image persists ✓
4. Upload and immediately switch layers → image saved to correct layer ✓
5. Save design and reload → all floor images restore correctly ✓
6. Console shows all expected messages in correct order ✓

## Key Insights

1. **Refs for accessing current values** - When you need the current value but can't include it in dependencies
2. **Synchronous updates** - Update refs immediately when critical timing matters
3. **Guard patterns** - Use flags to prevent effects from running during data loading
4. **Stable dependencies** - Don't include setState functions in dependency arrays
5. **Effect cleanup** - Cleanup functions run before re-running effects, can cancel pending operations

## Documentation

- `BACKGROUND_IMAGE_LAYER_SWITCH_FIX.md` - Detailed technical explanation of issues 1-2
- `TROUBLESHOOTING_GUIDE.md` - How to debug using console logs
- `EFFECT_CANCELLATION_FIX.md` - Explanation of issue 4 and effect cancellation bug
- `VISUAL_EXPLANATION.md` - Visual diagrams of the bug and fix
- `tests/background-image-layer-switch.test.js` - Manual test scenarios
