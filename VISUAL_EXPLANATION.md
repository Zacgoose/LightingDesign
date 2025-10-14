# Visual Explanation: Background Image Layer Switch Fix

## The Bug (Before Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│ Component State                                                  │
│                                                                   │
│  activeLayerId: "layer-1"  ◄──┐                                 │
│                                │                                 │
│  useEffect(() => {             │                                 │
│    updateLayer(activeLayerId, ...) // Captures "layer-1"        │
│  }, [backgroundImage])          │                                │
│                                │                                 │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                           Stale Closure!
                                  │
┌─────────────────────────────────┼───────────────────────────────┐
│ Timeline of Events              │                                 │
│                                 │                                 │
│  1. User on Floor 1 ────────────┘                                │
│     activeLayerId = "layer-1"                                    │
│     Effect created with "layer-1" captured                       │
│                                                                   │
│  2. User switches to Floor 2                                     │
│     activeLayerId = "layer-2"  ◄── Effect NOT re-created!       │
│                                                                   │
│  3. User uploads image to Floor 2                                │
│     setBackgroundImage(newImage)                                 │
│                                                                   │
│  4. Effect runs ──────────────────► Uses stale "layer-1"! ✗     │
│     updateLayer("layer-1", { backgroundImage: newImage })        │
│                                                                   │
│  5. Image saved to WRONG layer!                                  │
│     Floor 1: has the image (wrong!)                              │
│     Floor 2: no image (bug!)                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## The Fix (After)

```
┌─────────────────────────────────────────────────────────────────┐
│ Component State                                                  │
│                                                                   │
│  activeLayerId: "layer-2"                                        │
│         │                                                         │
│         │ Synced via effect                                      │
│         ▼                                                         │
│  activeLayerIdRef.current: "layer-2" ◄──┐                       │
│                                          │                       │
│  useEffect(() => {                       │                       │
│    updateLayer(activeLayerIdRef.current, ...) // Always current!│
│  }, [backgroundImage])                   │                       │
│                                          │                       │
└──────────────────────────────────────────┼───────────────────────┘
                                           │
                                     Always Fresh!
                                           │
┌──────────────────────────────────────────┼───────────────────────┐
│ Timeline of Events                       │                       │
│                                          │                       │
│  1. User on Floor 1                      │                       │
│     activeLayerId = "layer-1"            │                       │
│     activeLayerIdRef.current = "layer-1" │                       │
│     Effect created                       │                       │
│                                          │                       │
│  2. User switches to Floor 2             │                       │
│     activeLayerId = "layer-2"            │                       │
│     activeLayerIdRef.current = "layer-2" ◄── Ref updates!       │
│     Effect NOT re-created (good)         │                       │
│                                          │                       │
│  3. User uploads image to Floor 2        │                       │
│     setBackgroundImage(newImage)         │                       │
│                                          │                       │
│  4. Effect runs ────────────────────────►│ Uses current value ✓ │
│     updateLayer("layer-2", { backgroundImage: newImage })        │
│                                                                   │
│  5. Image saved to CORRECT layer!                                │
│     Floor 1: no image (correct)                                  │
│     Floor 2: has the image (correct!) ✓                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Difference

### Before (Bug):
- Effect captures `activeLayerId` value when created
- Value never updates in the closure
- Wrong layer receives the image

### After (Fixed):
- Effect uses `activeLayerIdRef.current`
- Ref always has the latest value
- Correct layer receives the image

## Why Not Add activeLayerId to Dependencies?

```
❌ BAD: Adding to dependencies causes race conditions

useEffect(() => {
  updateLayer(activeLayerId, { backgroundImage });
}, [backgroundImage, activeLayerId]); // ← activeLayerId here is bad!
      ↓
When switching layers:
  1. activeLayerId changes to "layer-2"
  2. Effect runs because dependency changed
  3. But backgroundImage might be stale from previous layer
  4. Stale data gets saved to new layer!


✓ GOOD: Using ref avoids race conditions

const activeLayerIdRef = useRef(activeLayerId);

useEffect(() => {
  activeLayerIdRef.current = activeLayerId; // Keep in sync
}, [activeLayerId]);

useEffect(() => {
  updateLayer(activeLayerIdRef.current, { backgroundImage });
}, [backgroundImage]); // ← Only runs when data changes
      ↓
When switching layers:
  1. activeLayerId changes to "layer-2"
  2. Ref updates to "layer-2"
  3. Effect does NOT run (backgroundImage unchanged)
  4. No race condition!

When uploading image:
  1. backgroundImage changes
  2. Effect runs
  3. Uses current activeLayerIdRef.current = "layer-2"
  4. Saves to correct layer!
```

## Summary

The fix uses the **ref pattern** to bridge two conflicting requirements:

1. **Need**: Always use the current `activeLayerId` value
2. **Constraint**: Can't add `activeLayerId` to dependencies (causes race conditions)
3. **Solution**: Use a ref that's kept in sync via a separate effect

This is a common React pattern for accessing current values in effects without triggering unnecessary runs!
