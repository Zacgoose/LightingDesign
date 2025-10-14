# Diagnostic Logging Guide

## Latest Update (Commit ccc0de7)

Added comprehensive logging to the layer switch effect to diagnose why "Layer switch complete" is not appearing in console logs.

## New Console Messages

### 1. "Layer switch effect triggered"
This message appears **every time** the effect runs, showing:
- Current `activeLayerId`
- Last loaded layer ID (`lastLoadedLayerId.current`)
- Whether `activeLayer` exists
- Whether the condition is `true` (effect will execute body)

**Example:**
```javascript
Layer switch effect triggered {
  activeLayerId: "layer-2",
  lastLoadedLayerId: "layer-1",
  hasActiveLayer: true,
  condition: true  // If true, effect body will run
}
```

### 2. "Switching to layer X"
Confirms the effect body is executing (condition was true).

### 3. "isLoadingLayerData set to TRUE"
Confirms the blocking flag was set to prevent sync effects from running during layer load.

### 4. "Setting up timeout to re-enable sync in 100ms..."
Confirms the timeout was successfully scheduled. The timeout should fire after 100ms unless canceled.

### 5. "Layer switch complete - sync effects re-enabled"
**This is the key message!** If this appears, the timeout completed successfully and sync effects are re-enabled.

### 6. "Layer switch effect cleanup - clearing timeout"
This appears when the effect cleanup function runs, which **cancels the pending timeout**. This should only happen when:
- The component unmounts
- The effect is about to re-run due to dependency changes
- React is cleaning up before running the effect again

## Diagnostic Scenarios

### Scenario A: Effect Not Running At All
```
[No "Layer switch effect triggered" messages]
```
**Diagnosis:** The effect dependencies are not changing, so React isn't running the effect.
**Likely Cause:** `activeLayerId` or `activeLayer` aren't changing when switching floors.

### Scenario B: Effect Running But Condition False
```
Layer switch effect triggered { condition: false }
```
**Diagnosis:** The effect runs but the condition `activeLayerId !== lastLoadedLayerId.current && activeLayer` is false.
**Likely Causes:**
- `lastLoadedLayerId.current` already equals `activeLayerId`
- `activeLayer` is null/undefined

### Scenario C: Timeout Being Canceled (Effect Re-Running)
```
Switching to layer layer-1
Setting up timeout to re-enable sync in 100ms...
Layer switch effect cleanup - clearing timeout  ← Timeout canceled!
Switching to layer layer-1  ← Effect ran again
Setting up timeout to re-enable sync in 100ms...
Layer switch effect cleanup - clearing timeout  ← Canceled again!
[Infinite loop, timeout never completes]
```
**Diagnosis:** The effect is running repeatedly, canceling itself each time.
**Likely Cause:** `updateHistory` function is changing on every render, causing infinite re-runs.

### Scenario D: Working Correctly
```
Layer switch effect triggered { condition: true }
Switching to layer layer-1
isLoadingLayerData set to TRUE
Setting up timeout to re-enable sync in 100ms...
[100ms passes]
Layer switch complete - sync effects re-enabled ✓
```
**Diagnosis:** Everything working as expected!

## What to Look For

1. **Is the effect triggering?**
   - Look for "Layer switch effect triggered"
   - If missing, dependencies aren't changing

2. **Is the condition true?**
   - Check `condition: true/false` in the log
   - If false, layer IDs or activeLayer have issues

3. **Is the timeout being set up?**
   - Look for "Setting up timeout..."
   - If missing, condition was false

4. **Is cleanup running before completion?**
   - If you see "cleanup" before "complete", timeout is being canceled
   - This means the effect is re-running too frequently

5. **Does "Layer switch complete" appear?**
   - If yes, sync effects are being re-enabled ✓
   - If no, timeout is being canceled or never set up

## Next Steps Based on Logs

### If "Layer switch complete" never appears:
Share the full console output focusing on these patterns to determine:
- Whether the effect is running
- Whether the timeout is being set up
- Whether cleanup is canceling the timeout

### If effect is running in a loop:
The `updateHistory` function might be changing on every render. We may need to:
1. Memoize `updateHistory` with `useCallback`
2. Remove `updateHistory` from dependencies (if it's stable)
3. Use a ref pattern for `updateHistory` similar to `activeLayerIdRef`

### If the condition is always false:
Check the layer management system - `activeLayerId` and `lastLoadedLayerId` might not be updating correctly.

## Current State

The code currently has:
- ✓ `activeLayerIdRef` for avoiding stale closures
- ✓ Synchronous ref update during layer switch
- ✓ Timeout to re-enable sync effects
- ✓ Removed setState functions from dependencies
- ✓ Extensive diagnostic logging

The diagnostic logs will tell us exactly where the flow is breaking down.
