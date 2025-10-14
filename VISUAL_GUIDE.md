# Visual Guide to Coordinate System Refactor

## Before: Pixel-Based System (Broken)

```
┌─────────────────────────────────────┐
│  Browser Window (4200x2970)        │
│  ┌───────────────────────────────┐ │
│  │ Canvas (4200x2970)            │ │
│  │  ┌─────────────────────────┐  │ │
│  │  │     Grid centered at    │  │ │
│  │  │         (0, 0)          │  │ │
│  │  │    Extends from:        │  │ │
│  │  │  (-2100,-1485) to       │  │ │
│  │  │   (2100, 1485)          │  │ │
│  │  │                         │  │ │
│  │  │    ● Object at (0,0)    │  │ │
│  │  │                         │  │ │
│  │  └─────────────────────────┘  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

        User resizes window ↓

┌──────────────────────────┐
│ Window (1920x1080)       │
│ ┌──────────────────────┐ │  ❌ Problem:
│ │ Canvas (1920x1080)   │ │  Canvas dimensions changed!
│ │ ┌──────────────────┐ │ │  Grid now extends from:
│ │ │  Grid centered   │ │ │  (-960,-540) to (960,540)
│ │ │   at (0, 0)      │ │ │  
│ │ │ ● Object (0,0)   │ │ │  Object appears in different
│ │ │   Now appears    │ │ │  position relative to grid!
│ │ │   differently!   │ │ │
│ │ └──────────────────┘ │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

## After: Fixed Virtual Canvas (Working)

```
Virtual Canvas (10000x10000)
┌────────────────────────────────────────────────┐
│                                                │
│    Grid extends from (-5000,-5000)             │
│              to (5000, 5000)                   │
│                                                │
│         ┏━━━━━━━━━━━━━━━━━━━━━━━┓              │
│         ┃  Viewport             ┃              │
│         ┃  (4200x2970)          ┃              │
│         ┃                       ┃              │
│         ┃   ● Object at (0,0)   ┃              │
│         ┃     (centered)        ┃              │
│         ┃                       ┃              │
│         ┗━━━━━━━━━━━━━━━━━━━━━━━┛              │
│                                                │
│    Stage Position: (2100, 1485)                │
│    Centers viewport on (0,0)                   │
│                                                │
└────────────────────────────────────────────────┘

        User resizes window ↓

Virtual Canvas (10000x10000) - UNCHANGED
┌────────────────────────────────────────────────┐
│                                                │
│    Grid still extends from (-5000,-5000)       │
│              to (5000, 5000)                   │
│                                                │
│      ┏━━━━━━━━━━━━━━┓                          │
│      ┃  Viewport    ┃                          │
│      ┃  (1920x1080) ┃   ✅ Solution:           │
│      ┃              ┃   Virtual canvas fixed!  │
│      ┃ ● Object     ┃   Grid unchanged!        │
│      ┃   at (0,0)   ┃   Object position same!  │
│      ┃              ┃                          │
│      ┗━━━━━━━━━━━━━━┛                          │
│                                                │
│    Stage Position: (960, 540)                  │
│    Adjusted to keep (0,0) centered             │
│                                                │
└────────────────────────────────────────────────┘
```

## Stage Position Calculation

### Initial Load (viewport 4200x2970)
```
Stage Position = (viewportWidth/2, viewportHeight/2)
               = (4200/2, 2970/2)
               = (2100, 1485)

This centers the viewport on virtual canvas coordinate (0, 0)
```

### After Resize (viewport 1920x1080)
```
Delta X = (newWidth - oldWidth) / 2
        = (1920 - 4200) / 2
        = -1140

Delta Y = (newHeight - oldHeight) / 2
        = (1080 - 2970) / 2
        = -945

New Position = (oldX + deltaX, oldY + deltaY)
             = (2100 + (-1140), 1485 + (-945))
             = (960, 540)

This maintains the same view - (0,0) stays centered!
```

## Coordinate Transformations

### Screen to Canvas
```
┌─────────────────┐
│ User clicks at  │
│ screen (x, y)   │
└────────┬────────┘
         │
         ↓
    Remove panning offset:
    x' = x - stagePosition.x
    y' = y - stagePosition.y
         │
         ↓
    Remove zoom scale:
    canvasX = x' / stageScale
    canvasY = y' / stageScale
         │
         ↓
┌────────┴────────┐
│ Canvas coords   │
│ (canvasX,       │
│  canvasY)       │
└─────────────────┘
```

### Canvas to Screen
```
┌─────────────────┐
│ Canvas coords   │
│ (canvasX,       │
│  canvasY)       │
└────────┬────────┘
         │
         ↓
    Apply zoom scale:
    x' = canvasX * stageScale
    y' = canvasY * stageScale
         │
         ↓
    Apply panning offset:
    screenX = x' + stagePosition.x
    screenY = y' + stagePosition.y
         │
         ↓
┌────────┴────────┐
│ Screen position │
│ (screenX,       │
│  screenY)       │
└─────────────────┘
```

## Grid Rendering

### Before (Dynamic)
```
Grid Width  = Canvas Width  = Viewport Width  (changes!)
Grid Height = Canvas Height = Viewport Height (changes!)

Grid Lines = gridWidth / gridSize
           = viewportWidth / gridSize  ← Wrong! Changes with resize
```

### After (Fixed)
```
Grid Width  = Canvas Width  = 10000 (fixed)
Grid Height = Canvas Height = 10000 (fixed)

Grid Lines = gridWidth / gridSize
           = 10000 / gridSize  ← Correct! Always consistent
```

## Background Image Scaling

### Before (Broken)
```
Image Scale = min(canvasWidth / imageWidth, canvasHeight / imageHeight)
            = min(viewportWidth / imageWidth, viewportHeight / imageHeight)
            ↑ Changes with viewport resize! Wrong!
```

### After (Fixed)
```
Image Scale = min(canvasWidth / imageWidth, canvasHeight / imageHeight)
            = min(10000 / imageWidth, 10000 / imageHeight)
            ↑ Consistent regardless of viewport! Correct!
```

## Real-World Example

### Placing a 2-meter wide fixture

```
1. User measures 100 pixels = 1 meter
   → scaleFactor = 100 pixels/meter

2. Fixture width = 2 meters
   → Canvas width = 2 * 100 = 200 pixels (virtual canvas units)

3. User places fixture at canvas position (500, 300)

4. Window resizes:
   ❌ Before: Canvas changes, 200 "pixels" means different size
   ✅ After:  Virtual canvas fixed, 200 units always means 2 meters
```

## Key Takeaways

1. **Virtual Canvas**: Fixed 10000x10000 coordinate space
2. **Viewport**: Dynamic window size for rendering
3. **Stage Position**: Adjusted to maintain view during resize
4. **Objects**: Positioned in virtual coordinates, stable across resizes
5. **Transformations**: Screen ↔ Canvas conversions unchanged
6. **Backward Compatible**: Old designs work without migration

## Summary

The refactor separates the concerns of:
- **Coordinate Space** (virtual canvas - fixed)
- **Visible Area** (viewport - dynamic)
- **View Position** (stage position - adjusted)

This ensures a stable, predictable coordinate system that works correctly at any window size.
