# Visual Explanation: Background Image Corruption Fix

## BEFORE THE FIX ❌

### The Problem: Race Condition in Layer Switching

```
Timeline: User uploads image to Floor 1
─────────────────────────────────────────────────────────

T0: User uploads image.jpg to Floor 1
    - activeLayerId = "layer-1" (Floor 1)
    - backgroundImage = null

T1: handleUploadFloorPlan() calls:
    - setBackgroundImage("data:image/jpeg;base64,AAAA...")
    - setBackgroundImageNaturalSize({ width: 1200, height: 800 })

T2: React re-renders due to state change
    - backgroundImage = "data:image/jpeg;base64,AAAA..."
    
T3: Layer Switch Effect triggers (because backgroundImage is in deps)
    - Condition: activeLayerId !== lastLoadedLayerId.current
    - FALSE (both are "layer-1"), should not run... BUT
    - Effect still runs because dependencies changed!
    
T4: "Sync before switching" logic executes:
    - lastLoadedLayerId.current = "layer-2" (leftover from previous switch)
    - Calls: updateLayer("layer-2", { 
        backgroundImage: "data:image/jpeg;base64,AAAA..." 
      })
    - ❌ Floor 2 now has Floor 1's image!

T5: User switches to Floor 2
    - Sees Floor 1's image instead of Floor 2's image
    - Corruption occurred!
```

### Why Dependencies Caused the Problem

```javascript
// BEFORE (BAD):
useEffect(() => {
  if (activeLayerId !== lastLoadedLayerId.current && activeLayer) {
    // Save current layer data before switching
    if (lastLoadedLayerId.current) {
      updateLayer(lastLoadedLayerId.current, {
        backgroundImage,  // ❌ Uses stale closure values
        backgroundImageNaturalSize,
        scaleFactor,
      });
    }
    // Load new layer data...
  }
}, [
  activeLayerId,
  activeLayer,
  backgroundImage,        // ❌ Causes effect to run on image upload
  backgroundImageNaturalSize,
  scaleFactor,
  updateLayer,
]);
```

## AFTER THE FIX ✅

### The Solution: Separate Concerns

```
Timeline: User uploads image to Floor 1
─────────────────────────────────────────────────────────

T0: User uploads image.jpg to Floor 1
    - activeLayerId = "layer-1" (Floor 1)
    - backgroundImage = null

T1: handleUploadFloorPlan() calls:
    - setBackgroundImage("data:image/jpeg;base64,AAAA...")
    - setBackgroundImageNaturalSize({ width: 1200, height: 800 })

T2: React re-renders due to state change
    - backgroundImage = "data:image/jpeg;base64,AAAA..."
    
T3: Background Sync Effect triggers:
    - isLoadingLayerData.current = false (not loading)
    - backgroundImage !== lastSyncedBackgroundImage.current (true)
    - Calls: updateLayer(activeLayerId, {  // ✅ activeLayerId is correct
        backgroundImage: "data:image/jpeg;base64,AAAA...",
        backgroundImageNaturalSize: { width: 1200, height: 800 }
      })
    - ✅ Floor 1 updated correctly!

T4: Layer Switch Effect DOES NOT trigger
    - Dependencies: [activeLayerId, activeLayer, ...]
    - activeLayerId hasn't changed, so effect doesn't run
    - ✅ No corruption!

T5: User switches to Floor 2
    - Layer Switch Effect triggers (activeLayerId changed)
    - Loads Floor 2's data into state
    - Sees Floor 2's image correctly
```

### Clean Separation

```javascript
// Sync Effect: State → Layer (writes)
useEffect(() => {
  if (isLoadingLayerData.current) return;
  if (backgroundImage !== lastSyncedBackgroundImage.current) {
    updateLayer(activeLayerId, { backgroundImage, backgroundImageNaturalSize });
    lastSyncedBackgroundImage.current = backgroundImage;
  }
}, [backgroundImage, backgroundImageNaturalSize, activeLayerId, updateLayer]);

// Switch Effect: Layer → State (reads)
useEffect(() => {
  if (activeLayerId !== lastLoadedLayerId.current && activeLayer) {
    isLoadingLayerData.current = true;
    
    // Load new layer's data
    setBackgroundImage(activeLayer.backgroundImage || null);
    setBackgroundImageNaturalSize(activeLayer.backgroundImageNaturalSize || null);
    
    // Update sync refs
    lastSyncedBackgroundImage.current = activeLayer.backgroundImage || null;
    
    setTimeout(() => { isLoadingLayerData.current = false; }, 100);
  }
}, [
  activeLayerId,  // ✅ Only depends on layer ID changes
  activeLayer,
  // ❌ NO backgroundImage, backgroundImageNaturalSize, etc.
]);
```

## Data Flow Diagram

### BEFORE (Circular Dependencies)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Upload Image → setBackgroundImage                      │
│       ↓                                                 │
│  backgroundImage state changes                          │
│       ↓                                                 │
│  Layer Switch Effect runs (❌ due to deps)              │
│       ↓                                                 │
│  Saves to WRONG layer (stale lastLoadedLayerId)         │
│       ↓                                                 │
│  Corruption! ──────────────────────────────────────┐    │
│                                                     ↓    │
└────────────────────────────────────────────────────┴────┘
```

### AFTER (Unidirectional Flow)
```
┌─────────────────────┐
│  Upload Image       │
│       ↓             │
│  setBackgroundImage │
└──────────┬──────────┘
           ↓
┌──────────────────────┐        ┌─────────────────────┐
│  Background Sync     │        │  Layer Switch       │
│  Effect              │        │  Effect             │
│  (writes to layer)   │        │  (reads from layer) │
└──────────┬───────────┘        └──────────┬──────────┘
           ↓                               ↓
┌──────────────────────┐        ┌─────────────────────┐
│  updateLayer()       │        │  loads layer data   │
│  saves to active     │        │  into state         │
│  layer ONLY          │        │  on switch ONLY     │
└──────────────────────┘        └─────────────────────┘
```

## Key Insights

1. **Separate Concerns**: One effect for syncing state to layers (writes), another for loading layer data (reads)
2. **Guard Flags**: `isLoadingLayerData.current` prevents sync effects from running during layer load
3. **Minimal Dependencies**: Layer switch effect only depends on `activeLayerId` changes
4. **Sync Refs**: Track last synced values to avoid unnecessary updates
5. **No Stale Closures**: Each effect only accesses the values it needs when it needs them
