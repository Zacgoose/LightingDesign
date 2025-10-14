# Background Image Fix Documentation

## Issues Fixed

### 1. Background Image Not Showing on Initial Load
**Symptom**: When loading a design with multiple floors, the background image would not display until switching between floors.

**Root Cause**: The `lastLoadedLayerId` ref was initialized to `activeLayerId`, preventing the initial layer load effect from triggering.

**Fix**: Changed initialization from `useRef(activeLayerId)` to `useRef(null)` in `/lightingdesign/src/pages/jobs/design/index.jsx` line 129.

### 2. Background Image Corruption When Saving
**Symptom**: When saving a design with multiple floors and background images, part of one floor's image would be replaced with portions from another floor's image.

**Root Cause**: The layer switching effect (lines 372-407) had background image state values in its dependency array, causing it to run when these values changed. This created race conditions where:
1. User uploads a background image to Floor 1
2. The `setBackgroundImage` call triggers a re-render
3. The layer switching effect runs because `backgroundImage` is in its dependencies
4. The effect's "sync before switching" logic saves the new image to the wrong layer

**Fix**: 
- Removed `backgroundImage`, `backgroundImageNaturalSize`, `scaleFactor`, and `updateLayer` from the layer switching effect dependencies
- Removed the "sync current layer before switching" logic
- The dedicated sync effects (lines 203-223) already handle syncing these values to the active layer correctly

## How Layer Data Sync Works Now

### State Flow
```
User Action (e.g., upload image)
    ↓
setBackgroundImage(newImage)
    ↓
Background Image Sync Effect (lines 203-214)
    ↓
updateLayer(activeLayerId, { backgroundImage, backgroundImageNaturalSize })
    ↓
Layer data updated in layers array
```

### Layer Switch Flow
```
User clicks different floor
    ↓
setActiveLayerId(newLayerId)
    ↓
Layer Switch Effect (lines 372-407)
    ↓
Load new layer's data into component state:
  - updateHistory(activeLayer.products)
  - setConnectors(activeLayer.connectors)
  - setBackgroundImage(activeLayer.backgroundImage)
  - setBackgroundImageNaturalSize(activeLayer.backgroundImageNaturalSize)
  - setScaleFactor(activeLayer.scaleFactor)
    ↓
Update sync refs to prevent immediate re-sync
```

### Key Principles
1. **Separate Concerns**: Layer switching only reads data; syncing only writes data
2. **Unidirectional Flow**: State changes flow through dedicated sync effects, not through the switch effect
3. **Guard Flags**: `isLoadingLayerData.current` prevents sync effects from running during layer load
4. **Sync Refs**: Track last synced values to avoid unnecessary updates

## Testing Checklist
- [ ] Load a design with multiple floors and background images - images should show immediately
- [ ] Upload a background image to Floor 1, switch to Floor 2, upload a different image - both should be preserved
- [ ] Save the design and reload - all floor background images should be intact
- [ ] Scale factor changes should persist per floor
- [ ] Console logs should show successful image loading with correct data lengths
