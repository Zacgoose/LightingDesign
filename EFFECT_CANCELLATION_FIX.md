# Effect Cancellation Bug Fix (Commit d5a567a)

## The Problem

The user's console logs showed:
```
Background sync blocked - loading layer data
Switching to layer layer-1
Background sync blocked - loading layer data
Switching to layer layer-1760408305761
Background sync blocked - loading layer data
```

**Notice:** The message "Layer switch complete - sync effects re-enabled" was **NEVER** appearing!

This meant the timeout was being canceled before it could execute.

## Root Cause: setState Functions in Dependencies

The layer switch effect had this dependency array:

```javascript
useEffect(() => {
  // ... layer switch logic ...
  const timer = setTimeout(() => {
    isLoadingLayerData.current = false;
    console.log('Layer switch complete - sync effects re-enabled');
  }, 100);
  
  return () => clearTimeout(timer);
}, [
  activeLayerId,
  activeLayer,
  updateHistory,
  setConnectors,              // ❌ Problem!
  setBackgroundImage,         // ❌ Problem!
  setBackgroundImageNaturalSize,  // ❌ Problem!
  setScaleFactor,             // ❌ Problem!
]);
```

### Why This Breaks Everything

1. **setState functions are supposed to be stable** - React guarantees they don't change between renders
2. **But in some React versions/configurations**, these functions can be seen as "changed" on every render
3. When the effect runs:
   - Sets up the timeout
   - But then the effect sees a dependency "change"
   - Re-runs the effect
   - The cleanup function `clearTimeout(timer)` cancels the previous timeout
   - Sets up a new timeout
   - Cycle repeats infinitely
4. **Result**: The timeout never gets a chance to complete!

### The Infinite Loop

```
1. Effect runs → timeout scheduled for 100ms
2. Component re-renders (for any reason)
3. Effect sees setState "changed" (false alarm)
4. Effect cleanup cancels the 100ms timeout
5. Effect runs again → new timeout scheduled
6. Component re-renders again
7. Go to step 3 (infinite loop)
```

The timeout gets canceled and rescheduled over and over, never completing.

## The Fix

Remove setState functions from dependencies since they're stable:

```javascript
useEffect(() => {
  // ... layer switch logic ...
  const timer = setTimeout(() => {
    isLoadingLayerData.current = false;
    console.log('Layer switch complete - sync effects re-enabled');
  }, 100);
  
  return () => clearTimeout(timer);
}, [
  activeLayerId,
  activeLayer,
  updateHistory,
  // Note: setConnectors, setBackgroundImage, setBackgroundImageNaturalSize, setScaleFactor
  // are stable setState functions and don't need to be in dependencies
]);
```

## Why This Works

1. **Fewer dependencies** = effect runs less often
2. **Only runs when `activeLayerId` or `activeLayer` actually change**
3. **Timeout gets to complete** without being canceled
4. **`isLoadingLayerData.current = false`** actually happens
5. **Sync effects are re-enabled** and can save background images

## Expected Console Output After Fix

```
Switching to layer layer-1
  → hasBackgroundImage: true, backgroundImageLength: 170855
Background sync blocked - loading layer data  (during switch)
Layer switch complete - sync effects re-enabled  ✓ (after 100ms)

Upload image to layer-1:
Syncing background to layer: layer-1
  → hasImage: true, imageLength: 170855
updateLayer called: { layerId: 'layer-1', updates: ['backgroundImage', ...] }
Layer background updated: { layerId: 'layer-1', hasImage: true, imageLength: 170855 }

Switching to layer layer-2
  → hasBackgroundImage: false, backgroundImageLength: 0
Background sync blocked - loading layer data  (during switch)
Layer switch complete - sync effects re-enabled  ✓ (after 100ms)

Upload image to layer-2:
Syncing background to layer: layer-2
  → hasImage: true, imageLength: 359363
updateLayer called: { layerId: 'layer-2', updates: ['backgroundImage', ...] }
Layer background updated: { layerId: 'layer-2', hasImage: true, imageLength: 359363 }
```

## React Best Practices

This issue highlights an important React pattern:

**✓ DO include in dependencies:**
- Props that can change
- State values that can change
- Variables from component scope that can change
- Functions that are not memoized and can change

**✗ DON'T include in dependencies:**
- setState functions (they're stable)
- Refs (`myRef.current` is stable, though the value inside changes)
- Memoized functions (unless their dependencies changed)
- Constants

## Timeline of Fixes

1. **Commit 5b974f5**: Added `activeLayerIdRef` to fix stale closures
2. **Commit d9ffac7**: Updated ref synchronously to fix race condition
3. **Commit 80f6b41**: Restored timeout that was accidentally removed
4. **Commit d5a567a**: Removed setState from dependencies to let timeout complete ✓

Each fix addressed a different part of the problem. All four were necessary to fully resolve the issue.

## Verification

After this fix, the console should show:
1. ✓ "Switching to layer X" when switching
2. ✓ "Layer switch complete - sync effects re-enabled" **100ms later**
3. ✓ "Syncing background to layer: X" when uploading
4. ✓ "Layer background updated" confirming save

If any of these messages is missing, there's still an issue.
