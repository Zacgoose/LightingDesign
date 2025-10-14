# Background Image Troubleshooting Guide

## The Critical Fix (Commit 80f6b41)

### What Was Wrong
In commit `c23f63d`, the timeout that re-enables sync effects was accidentally removed. This caused a critical bug:

```javascript
// After layer switch:
isLoadingLayerData.current = true;  // Set to block sync effects during load
// ... load layer data ...
// ❌ MISSING: isLoadingLayerData.current = false;  // Never reset!

// Result: All sync effects permanently blocked!
useEffect(() => {
  if (isLoadingLayerData.current) return;  // Always returns after first switch!
  updateLayer(activeLayerIdRef.current, { backgroundImage });
}, [backgroundImage]);
```

### Why This Broke Everything
1. First layer upload works because `isLoadingLayerData.current` starts as `false`
2. When you switch layers, `isLoadingLayerData.current = true` (to prevent race conditions)
3. **The timeout that sets it back to `false` was removed**
4. All subsequent uploads are blocked because the guard never allows sync effects to run

### The Fix
Restored the timeout that re-enables sync after 100ms:

```javascript
// Re-enable sync after layer data is loaded
const timer = setTimeout(() => {
  isLoadingLayerData.current = false;
  console.log('Layer switch complete - sync effects re-enabled');
}, 100);

return () => clearTimeout(timer);
```

## Console Logging for Debugging

The fix includes extensive console logging to help diagnose issues:

### Normal Flow (Working Correctly)
```
1. Upload image to Floor 1:
   → "Syncing background to layer: layer-1"
   → "updateLayer called: { layerId: 'layer-1', updates: ['backgroundImage', ...] }"
   → "Layer background updated: { layerId: 'layer-1', hasImage: true, imageLength: 12345 }"

2. Switch to Floor 2:
   → "Switching to layer layer-2"
   → "Background sync blocked - loading layer data"  (expected during switch)
   → "Layer switch complete - sync effects re-enabled"  (after 100ms)

3. Upload image to Floor 2:
   → "Syncing background to layer: layer-2"
   → "updateLayer called: { layerId: 'layer-2', updates: ['backgroundImage', ...] }"
   → "Layer background updated: { layerId: 'layer-2', hasImage: true, imageLength: 67890 }"

4. Switch back to Floor 1:
   → "Switching to layer layer-1"
   → Floor 1 image should be visible
```

### Broken Flow (If Issue Persists)
```
1. Upload image to Floor 1:
   → "Syncing background to layer: layer-1"  ✓ Works

2. Switch to Floor 2:
   → "Switching to layer layer-2"
   → ❌ "Layer switch complete - sync effects re-enabled" (missing = timeout issue)
   → OR "Layer switch complete" but to wrong layer (ref issue)

3. Upload image to Floor 2:
   → "Background sync blocked - loading layer data"  ❌ STUCK!
   → OR "Syncing background to layer: layer-1"  ❌ Wrong layer!
```

## How to Debug

### Step 1: Open Browser Console
- Chrome: F12 → Console tab
- Firefox: F12 → Console tab
- Edge: F12 → Console tab

### Step 2: Clear Console and Test
1. Clear console output (trash icon)
2. Upload image to Floor 1
3. Watch for "Syncing background to layer: layer-1"
4. Switch to Floor 2
5. Watch for "Layer switch complete - sync effects re-enabled"
6. Upload image to Floor 2
7. Watch for "Syncing background to layer: layer-2"

### Step 3: Verify Layer State
After each upload, you can check the layer state by running this in console:
```javascript
// This will show all layers and their background images
console.log('Layers:', window.__layers);  // If exposed for debugging
```

### Step 4: Check for Errors
Look for any error messages in red that might indicate:
- JavaScript errors
- Network errors
- React errors
- State update errors

## Common Issues and Solutions

### Issue: "Background sync blocked" appears after every upload
**Cause:** The timeout isn't resetting `isLoadingLayerData.current`  
**Solution:** Verify commit 80f6b41 is applied and the timeout code is present

### Issue: Images save to wrong layer
**Cause:** `activeLayerIdRef.current` not updated correctly  
**Solution:** Check console for "Syncing background to layer: X" - X should match current layer

### Issue: Images disappear when switching layers
**Cause:** Layer data not being saved to the layers array  
**Solution:** Check console for "updateLayer called" and "Layer background updated" messages

### Issue: Images don't load when switching back to a layer
**Cause:** Layer data lost from layers array, or not being loaded correctly  
**Solution:** Check if "Switching to layer X" shows `hasBackgroundImage: true`

## Technical Details

### The Guard Pattern
```javascript
// Prevents sync effects from running during layer switch
if (isLoadingLayerData.current) return;
```

This guard is essential because:
1. When switching layers, we call `setBackgroundImage(newLayer.backgroundImage)`
2. This triggers the sync effect
3. But we don't want to save the newly loaded data back to the layer (it's already there!)
4. So we block the sync effect while loading

The timeout ensures this block is temporary (100ms) and doesn't persist forever.

### The Ref Pattern
```javascript
// Ensures we always use the current layer ID
activeLayerIdRef.current = activeLayerId;

// Sync effects use the ref
updateLayer(activeLayerIdRef.current, { backgroundImage });
```

This ensures we don't have stale closure issues where the sync effect uses an old layer ID.

## Next Steps If Issue Persists

If the issue still occurs after commit 80f6b41:

1. **Share console logs** - Copy the entire console output during the failing scenario
2. **Check commit** - Verify the code matches commit 80f6b41 exactly
3. **Check browser cache** - Hard refresh (Ctrl+Shift+R) to clear cached JavaScript
4. **Check layer structure** - We may need to inspect the actual layers array state

The console logs will tell us exactly where the flow breaks down.
