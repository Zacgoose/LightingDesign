# Canvas Layer System Architecture

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Design Page (index.jsx)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              useLayerManager Hook                      │  │
│  │  - Manages layer state                                 │  │
│  │  - Handles layer CRUD operations                       │  │
│  │  - Filters products by sublayers                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│        ┌───────────────────┼───────────────────┐            │
│        ▼                   ▼                   ▼            │
│  ┌──────────┐      ┌──────────────┐    ┌─────────────┐    │
│  │  Layer   │      │   Active      │    │  Sublayer   │    │
│  │ Switcher │      │   Layer       │    │  Controls   │    │
│  │   UI     │      │   Data        │    │     UI      │    │
│  └──────────┘      └──────────────┘    └─────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              DesignerCanvas Component                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Konva Stage                        │  │  │
│  │  │  ┌────────────────────────────────────────┐    │  │  │
│  │  │  │   GridLayer (Optimized, Memoized)     │    │  │  │
│  │  │  └────────────────────────────────────────┘    │  │  │
│  │  │  ┌────────────────────────────────────────┐    │  │  │
│  │  │  │   Background Image Layer               │    │  │  │
│  │  │  └────────────────────────────────────────┘    │  │  │
│  │  │  ┌────────────────────────────────────────┐    │  │  │
│  │  │  │   ConnectorsLayer                      │    │  │  │
│  │  │  └────────────────────────────────────────┘    │  │  │
│  │  │  ┌────────────────────────────────────────┐    │  │  │
│  │  │  │   ProductsLayer (Filtered by sublayer) │    │  │  │
│  │  │  └────────────────────────────────────────┘    │  │  │
│  │  │  ┌────────────────────────────────────────┐    │  │  │
│  │  │  │   MeasurementLayer                     │    │  │  │
│  │  │  └────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Layer Structure
```
layers: [
  {
    id: "layer-1",
    name: "Floor 1",
    visible: true,
    locked: false,
    backgroundImage: "...",
    backgroundImageNaturalSize: { width, height },
    products: [
      { id, x, y, product_type, ... }
    ],
    connectors: [
      { id, from, to, ... }
    ],
    sublayers: [
      { id: "layer-1-lights", name: "Lights", visible: true, type: "light" },
      { id: "layer-1-power", name: "Power Points", visible: true, type: "power" },
      { id: "layer-1-switches", name: "Switches", visible: true, type: "switch" },
      { id: "layer-1-other", name: "Other", visible: true, type: "other" }
    ]
  }
]
```

### State Flow

1. **Layer Selection**
   ```
   User clicks layer in UI
   → setActiveLayerId(layerId)
   → activeLayer updates
   → Canvas re-renders with new layer data
   ```

2. **Product Addition**
   ```
   User adds product
   → updateHistory(newProducts)
   → useEffect syncs to activeLayer
   → updateActiveLayer({ products })
   → Layer state updated
   ```

3. **Sublayer Toggle**
   ```
   User toggles sublayer
   → toggleSublayerVisibility(layerId, sublayerId)
   → sublayer.visible flipped
   → filterProductsBySublayers() recalculates
   → ProductsLayer re-renders with filtered products
   ```

## Component Responsibilities

### Core Components

**DesignerCanvas**
- Manages Konva Stage
- Handles zoom/pan
- Renders all layers
- Delegates to child layers

**GridLayer**
- Optimized grid rendering
- Memoized calculations
- Density checking
- Theme-aware styling

**LayerSwitcher**
- Display all layers
- Layer selection
- Add/delete layers
- Toggle visibility/lock

**SubLayerControls**
- Display sublayers for active layer
- Toggle sublayer visibility
- Organize by object type

### Hooks

**useLayerManager**
- Central layer state management
- Layer CRUD operations
- Sublayer management
- Product filtering
- Returns: layers, activeLayerId, activeLayer, and management functions

**useHistory**
- Undo/redo functionality
- History per layer
- State snapshots

## Performance Optimizations

### Grid Layer
```javascript
// Before: Grid regenerated on every render
{showGrid && <Layer>{generateGrid()}</Layer>}

// After: Grid memoized, only updates on dependencies
<GridLayer 
  visible={showGrid}
  width={width}
  height={height}
  // ... other props
/>

// GridLayer internally uses:
const gridLines = useMemo(() => {
  // expensive calculation
}, [visible, width, height, ...]);
```

### Product Filtering
```javascript
// Only render visible sublayer products
const visibleProducts = filterProductsBySublayers(products, activeLayerId);

<ProductsLayer products={visibleProducts} ... />
```

### Layer Isolation
- Only active layer's objects are rendered
- Inactive layers don't affect performance
- Independent state per layer

## File Structure

```
lightingdesign/src/
├── components/designer/
│   ├── DesignerCanvas.jsx           # Main canvas component
│   ├── GridLayer.jsx                # Optimized grid (NEW)
│   ├── LayerSwitcher.jsx            # Layer management UI (NEW)
│   ├── SubLayerControls.jsx         # Sublayer toggles (NEW)
│   ├── ProductsLayer.jsx            # Products rendering
│   ├── ConnectorsLayer.jsx          # Connectors rendering
│   └── MeasurementLayer.jsx         # Measurements rendering
├── hooks/
│   ├── useLayerManager.js           # Layer state management (NEW)
│   └── useHistory.js                # Undo/redo functionality
└── pages/jobs/design/
    └── index.jsx                     # Main design page (UPDATED)
```

## Integration Points

### Adding New Object Types

To add a new sublayer type:

1. Update `createEmptyLayer` in `useLayerManager.js`:
```javascript
sublayers: [
  // ... existing sublayers
  { id: `${id}-custom`, name: 'Custom Type', visible: true, type: 'custom' },
]
```

2. Update `filterProductsBySublayers` to map product types:
```javascript
if (productType?.includes('custom')) return visibleTypes.includes('custom');
```

### Extending Layer Data

To add custom properties to layers:

1. Update `createEmptyLayer` to include new property
2. Update `updateLayer` calls to include new property
3. Access via `activeLayer.yourProperty`

## Best Practices

1. **Always use useLayerManager hook** for layer operations
2. **Never directly mutate layer state** - use provided functions
3. **Use filterProductsBySublayers** for rendering products
4. **Keep layer-specific data in layer objects** - don't use separate state
5. **Sync products/connectors with layer** via useEffect
6. **Lock completed layers** to prevent accidental changes

## Testing

### Manual Testing Checklist

- [ ] Create new layer
- [ ] Switch between layers
- [ ] Add products to each layer independently
- [ ] Toggle sublayer visibility
- [ ] Delete layer (with confirmation)
- [ ] Lock/unlock layer
- [ ] Upload different background images per layer
- [ ] Verify undo/redo works per layer
- [ ] Check performance with multiple layers

### Performance Testing

- [ ] Monitor FPS during pan/zoom
- [ ] Check render time with many objects
- [ ] Verify grid doesn't regenerate unnecessarily
- [ ] Test with 5+ layers
- [ ] Test with 100+ objects per layer
- [ ] Verify memory usage doesn't grow excessively

## Future Enhancements

See `docs/canvas_performance_tips.md` for detailed future optimization ideas:
- Virtual scrolling/culling
- Web Workers for calculations
- Canvas caching
- LOD (Level of Detail)
- Layer reordering via drag-drop
- Layer groups/folders
- Copy/paste between layers
