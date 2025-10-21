# Visual Explanation of the Transformer Box Fix

## Before the Fix

### Pendant Shape (width=100, height=125)
```
                           y = -75  ← Wire top (outside expected bounds)
                              |
                              |     Wire (0.5*radius = 25px)
                              |
   Expected box top → -62.5 ─┤━━━━━━━━━━━━━━━━━━━ Wire bottom
                              |
                              |
                              |
                              |     Circle (2*radius = 100px)
                       y = 0 ●━━━━━━━━━━━━━━━━━━━ Circle center
                              |
                              |
                              |
                              |
                              |
                            ━━┻━━   Circle bottom
   Expected box bottom → +62.5

Problem: Wire top at -75 exceeds expected box top at -62.5
         Transformer box cuts off 12.5px of the wire!
```

### After the Fix (with yOffset = 12.5)

```
   Expected box top → -62.5 ─┬─━━━━━━━━━━━━━━━━━━ Wire top (now aligned!)
                              |
                              |     Wire (0.5*radius = 25px)
                              |
                            ━━┼━━━━━━━━━━━━━━━━━━━ Wire bottom
                              |
                              |
                              |
                       y = 0 ─┼─                   Canvas origin (unchanged)
                              |     Circle (2*radius = 100px)
                              ●                     Circle center (at +12.5)
                              |
                              |
                              |
                              |
   Expected box bottom → +62.5━┻━━━━━━━━━━━━━━━━━━ Circle bottom (now aligned!)

Success: Total height = 125px, perfectly centered at y=0
         Transformer box encompasses the entire shape!
```

## Spotlight Shape Fix

### Before (width=80, height=96)
```
                           y = -48  ← Bracket top (outside expected bounds)
                              ┌─┐
   Expected box top → -48 ────┤ ┝── Bracket (0.4*radius should be, was 0.2*radius)
                              └─┘
                              ┌─┐
                              │ │
                              │ │   Light body (2*radius = 80px)
                       y = 0 ─●─
                              │ │
                              │ │
                              └─┘
   Expected box bottom → +48 ─────

Problem: 1. Bracket too small (8px instead of 16px)
         2. Content not centered (center at -4 instead of 0)
```

### After the Fix (with yOffset = 8, corrected bracket)
```
   Expected box top → -48 ────┬──   Bracket top (now aligned!)
                              ┌┴┐
                              │ │   Bracket (0.4*radius = 16px, corrected!)
                              └┬┘
                              ┌┴┐
                              │ │
                       y = 0 ─┼─    Canvas origin
                              │ │   Light body (2*radius = 80px)
                              ●─    Light center (at +8)
                              │ │
                              └┬┘
   Expected box bottom → +48 ─┴──   Light bottom (now aligned!)

Success: Total height = 96px, perfectly centered at y=0
         Transformer box encompasses the entire shape!
```

## Key Insight

The fix ensures that:
1. The drawn content is **centered** within the shape's height bounds
2. The **total drawn height** matches the configured `realWorldHeight * scaleFactor`
3. The shape is **symmetric around y=0**, making Konva's bounding box calculations accurate

This allows the Konva Transformer to correctly calculate the bounding box and display
a selection rectangle that fully encompasses the shape without cutting off any parts.
