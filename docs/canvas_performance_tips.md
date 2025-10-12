# Canvas Performance Optimization Guide

This document outlines the performance optimizations implemented in the LightingDesign canvas system and provides guidelines for maintaining optimal performance.

## Overview

The canvas system uses Konva.js with React Konva for rendering. Performance is critical when working with large floorplans and many objects. This guide covers the optimizations implemented and best practices.

## Implemented Optimizations

### 1. Grid Layer Optimization

**Problem:** The grid was being regenerated on every render, creating hundreds of line objects unnecessarily.

**Solution:** 
- Created a dedicated `GridLayer.jsx` component
- Used `React.memo()` to prevent unnecessary re-renders
- Used `useMemo()` to cache grid line calculations
- Grid only regenerates when dimensions, scale, or visibility changes

**Code Example:**
```javascript
export const GridLayer = React.memo(({
  visible,
  width,
  height,
  gridSize,
  scaleFactor,
  backgroundImageNaturalSize,
  imageScale,
  gridColor,
  strokeWidth,
}) => {
  const gridLines = useMemo(() => {
    // Grid calculation logic
  }, [visible, width, height, gridSize, scaleFactor, backgroundImageNaturalSize, imageScale]);
  
  // Render grid lines
});
```

**Benefits:**
- Reduces CPU usage during pan/zoom operations
- Eliminates unnecessary DOM updates
- Improves responsiveness when interacting with canvas

### 2. Layer System Architecture

**Problem:** All objects were rendered in a single layer, making it difficult to manage complex floorplans and reducing performance with large object counts.

**Solution:**
- Implemented multi-layer system with main layers (floors) and sublayers (object types)
- Each layer maintains its own state (products, connectors, background)
- Sublayers allow hiding/showing groups of objects by type
- Only active layer's objects are rendered

**Architecture:**
```
Floor Layer 1 (Active)
├── Background Image
├── Grid Layer (optimized)
├── Sublayer: Lights (visible)
├── Sublayer: Power Points (visible)
├── Sublayer: Switches (hidden)
└── Sublayer: Other (visible)

Floor Layer 2 (Inactive - not rendered)
└── ...
```

**Benefits:**
- Reduces number of rendered objects when sublayers are hidden
- Organizes objects by type for easier management
- Supports multiple floorplans without performance degradation
- Clean separation of concerns

### 3. Konva Performance Settings

Several Konva-specific optimizations are used:

```javascript
<Line
  listening={false}        // Disables event listeners for static objects
  perfectDrawEnabled={false}  // Faster but slightly less accurate rendering
/>
```

**When to use these settings:**
- `listening={false}`: For grid lines, background images, and non-interactive elements
- `perfectDrawEnabled={false}`: For grid lines and other elements where pixel-perfect rendering isn't critical

## Layer Management System

### Using Layers

The `useLayerManager` hook provides complete layer management:

```javascript
const {
  layers,                    // Array of all layers
  activeLayerId,             // Currently active layer ID
  activeLayer,               // Currently active layer object
  setActiveLayerId,          // Switch to a different layer
  addLayer,                  // Create a new layer
  deleteLayer,               // Remove a layer
  updateLayer,               // Update layer properties
  updateActiveLayer,         // Update active layer
  toggleSublayerVisibility,  // Show/hide sublayers
  filterProductsBySublayers, // Filter products by visible sublayers
} = useLayerManager();
```

### Layer Structure

Each layer contains:
```javascript
{
  id: 'layer-1',
  name: 'Floor 1',
  visible: true,
  locked: false,
  backgroundImage: null,
  backgroundImageNaturalSize: null,
  products: [],
  connectors: [],
  sublayers: [
    { id: 'layer-1-lights', name: 'Lights', visible: true, type: 'light' },
    { id: 'layer-1-power', name: 'Power Points', visible: true, type: 'power' },
    { id: 'layer-1-switches', name: 'Switches', visible: true, type: 'switch' },
    { id: 'layer-1-other', name: 'Other', visible: true, type: 'other' },
  ],
}
```

## Performance Best Practices

### 1. Minimize Re-renders

- Use `React.memo()` for components that don't need frequent updates
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for event handlers passed to child components

### 2. Optimize Konva Layers

- Group related objects in the same Layer
- Use `Layer.listening(false)` for layers that don't need events
- Limit the number of Konva Layers (each layer is a canvas element)

### 3. Grid Rendering

The grid has built-in safeguards:
- Maximum 200 lines in each direction
- Automatically skips rendering if grid density is too high
- Warning logged to console if grid is skipped

```javascript
if (verticalLineCount > maxLines || horizontalLineCount > maxLines) {
  console.warn('Grid density too high, skipping grid render');
  return lines;
}
```

### 4. Object Filtering

Use sublayer filtering to reduce rendered objects:

```javascript
const visibleProducts = filterProductsBySublayers(products, activeLayerId);

<ProductsLayer products={visibleProducts} ... />
```

### 5. Background Images

- Images are loaded once and cached
- Only active layer's background is rendered
- Images automatically scale to fit canvas

## Monitoring Performance

### Browser DevTools

Use Chrome/Firefox DevTools Performance tab to:
1. Record canvas interactions (pan, zoom, drag)
2. Look for long tasks (>50ms)
3. Check frame rate (should stay above 30fps)

### React DevTools Profiler

1. Enable Profiler in React DevTools
2. Record interactions
3. Look for components re-rendering unnecessarily
4. Check render duration

### Konva Performance

Monitor Konva-specific metrics:
- Number of nodes in each layer
- Number of layers
- Event listener count

```javascript
// In console
stage.getLayers().forEach((layer, i) => {
  console.log(`Layer ${i}: ${layer.getChildren().length} nodes`);
});
```

## Common Performance Issues

### Issue: Slow panning/zooming

**Causes:**
- Too many objects rendering
- Grid density too high
- Unnecessary re-renders

**Solutions:**
- Hide unused sublayers
- Reduce grid size
- Check for React re-render loops

### Issue: Lag when adding objects

**Causes:**
- Unnecessary full canvas re-render
- History state updates triggering re-renders

**Solutions:**
- Ensure components use proper memoization
- Batch state updates when possible

### Issue: Memory leaks

**Causes:**
- Images not properly cleaned up
- Event listeners not removed

**Solutions:**
- Ensure useEffect cleanup functions are used
- Remove event listeners in component unmount

## Future Optimizations

Potential improvements for future consideration:

1. **Virtual Scrolling/Culling:** Only render objects visible in viewport
2. **Web Workers:** Move complex calculations off main thread
3. **Canvas Caching:** Cache static parts of the canvas as images
4. **LOD (Level of Detail):** Render simplified versions when zoomed out
5. **Debounced Updates:** Batch rapid state changes

## Component Reference

### GridLayer
Located: `src/components/designer/GridLayer.jsx`
- Optimized grid rendering with memoization
- Automatic density checking
- Theme-aware colors

### LayerSwitcher
Located: `src/components/designer/LayerSwitcher.jsx`
- UI for switching between floor layers
- Layer management (add, delete, visibility, lock)

### SubLayerControls
Located: `src/components/designer/SubLayerControls.jsx`
- UI for toggling sublayer visibility
- Checkboxes for each object type

### useLayerManager
Located: `src/hooks/useLayerManager.js`
- Complete layer state management
- Layer CRUD operations
- Sublayer visibility control
- Product filtering by sublayer

## Conclusion

These optimizations provide a solid foundation for canvas performance. The modular architecture allows for easy extension and maintenance. Monitor performance regularly and adjust as needed based on real-world usage patterns.

For questions or issues, please refer to the main project documentation or open an issue on GitHub.
