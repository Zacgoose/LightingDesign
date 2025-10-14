# Infinite Loop Fix - updateHistory Dependency Issue

## The Problem (Commit 84f1c01)

The diagnostic logs revealed the exact issue:

```
Layer switch effect triggered { condition: true }
Switching to layer layer-1760411232010
isLoadingLayerData set to TRUE
Setting up timeout to re-enable sync in 100ms...
Layer switch effect cleanup - clearing timeout  ← Timeout canceled!
Layer switch effect triggered { condition: false }  ← Effect re-ran immediately!
```

**Pattern:** The effect sets up a timeout, then immediately cleans it up and re-runs. The timeout never gets to complete, so `isLoadingLayerData.current` never gets set to `false`, permanently blocking all sync effects.

## Root Cause

The `updateHistory` function from the `useHistory` hook is **recreated on every render**:

```javascript
// In useHistory.js
export const useHistory = (initialState = []) => {
  const [state, setState] = useState(initialState);
  
  const updateHistory = (newState) => {  // ← Recreated every render!
    // ... implementation
  };
  
  return {
    state,
    updateHistory,  // New function reference each time
    // ...
  };
};
```

The function is not wrapped in `useCallback`, so it's a new reference on every render.

### Why This Caused Infinite Loop

1. Layer switch effect runs, includes `updateHistory` in dependencies
2. Effect calls `updateHistory(activeLayer.products)`
3. This updates products state, triggering a re-render
4. Re-render creates a new `updateHistory` function (new reference)
5. Effect sees `updateHistory` dependency changed
6. Effect cleanup runs, **canceling the timeout**
7. Effect runs again with new `updateHistory` reference
8. Go to step 3 (infinite loop)

The timeout gets canceled and rescheduled infinitely, never completing.

## The Fix

Remove `updateHistory` from the effect's dependency array:

```javascript
useEffect(() => {
  if (activeLayerId !== lastLoadedLayerId.current && activeLayer) {
    // ... layer switch logic
    updateHistory(activeLayer.products || []);  // Still call it
    
    const timer = setTimeout(() => {
      isLoadingLayerData.current = false;
      console.log('Layer switch complete');
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [
  activeLayerId,
  activeLayer,
  // updateHistory removed - it changes every render but we don't need to react to it
]);
```

### Why This Is Safe

1. **Effect only needs to run when switching layers** - when `activeLayerId` or `activeLayer` change
2. **updateHistory is always available** - it's returned from the hook on every render
3. **We don't need to react to updateHistory changing** - we only use it to load data, not as a trigger
4. **The function works correctly** - even though it's a new reference, it has the correct closure

## Why Not Fix useHistory Hook Instead?

We could fix the hook to memoize `updateHistory`:

```javascript
const updateHistory = useCallback((newState) => {
  // ... implementation
}, []);  // Empty deps since it only uses refs
```

However:
1. The hook is used in multiple places across the codebase
2. Changing the hook could have unintended side effects
3. The layer switch effect doesn't actually need to re-run when `updateHistory` changes
4. Removing it from dependencies is the simpler, safer fix

## Expected Behavior After Fix

```
Layer switch effect triggered { condition: true }
Switching to layer layer-2
isLoadingLayerData set to TRUE
Setting up timeout to re-enable sync in 100ms...
[100ms passes - NO cleanup!]
Layer switch complete - sync effects re-enabled ✓

[Upload image to layer-2]
Syncing background to layer: layer-2 ✓
updateLayer called ✓
Layer background updated ✓

[Switch to layer-1]
Layer switch effect triggered { condition: true }
Switching to layer-1
Setting up timeout...
[100ms passes]
Layer switch complete ✓

[Switch back to layer-2]
Layer switch effect triggered { condition: true }
Switching to layer-2 { hasBackgroundImage: true } ✓
Layer switch complete ✓
[Background image displays correctly] ✓
```

## Timeline of All Fixes

1. **Stale closures** - Sync effects captured old `activeLayerId`
2. **Race condition** - Ref update could lag behind layer switch
3. **Missing timeout** - Timeout code was accidentally removed
4. **Effect cancellation (setState)** - setState functions in dependencies
5. **Infinite loop (updateHistory)** - updateHistory recreated every render

All five issues had to be fixed for the feature to work correctly.

## Lessons Learned

1. **Always check if functions in dependencies are memoized** - especially custom hook returns
2. **useCallback is essential** for functions returned from hooks that are used as dependencies
3. **Diagnostic logging is crucial** - without it, we couldn't see the infinite loop pattern
4. **Effect cleanup timing matters** - cleanup runs before re-running, which can cancel async operations
5. **Not all hook returns need to be in dependencies** - only those that should trigger re-runs

## Verification

After this fix, you should:
1. See "Layer switch complete" in console after every layer switch
2. NOT see "cleanup" messages between "Setting up timeout" and "complete"
3. Be able to upload images to multiple layers
4. Have all images persist when switching between layers
5. Successfully save and reload designs with multiple floor images
