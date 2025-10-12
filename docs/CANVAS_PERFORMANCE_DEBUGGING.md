# Canvas Performance Debugging Guide

## Overview

Performance logging tools have been added to help diagnose and fix canvas rendering performance issues in the LightingDesign application.

## How to Use

### 1. Enable Performance Logging

1. Open the designer page (`/jobs/design?id=<job-id>`)
2. Click the **"Perf Log"** button in the toolbar (turns orange when active)
3. Open browser console (press F12 or right-click → Inspect → Console tab)

### 2. Interact with the Canvas

Perform actions that feel laggy:
- Drag products around
- Zoom in/out
- Select/deselect products
- Add new products
- Switch between tools

### 3. Analyze the Console Output

The performance logger will show:

#### Render Logs (Blue)
```
[Render] DesignerCanvas @ 13:30:45.123
```
- Shows when a component renders
- Includes timestamp and component name
- High frequency = potential performance issue

#### Render Counts (Purple)
```
[Render #47] ProductShape-abc123 (2.34ms)
```
- Shows how many times a component has rendered
- Includes render time in milliseconds
- High counts during simple interactions = unnecessary re-renders

#### Prop Changes (Orange)
```
[Props Changed] ProductShape
  draggable: { prev: false, current: true }
```
- Shows which props changed to trigger re-render
- Helps identify why components are re-rendering

#### Expensive Operations (Red)
```
[Expensive Operation] Selection Calculation
```
- Highlights operations that might slow down the app

#### Memory Usage (Gray)
```
[Memory] After Product Add
  usedJSHeapSize: 45.23 MB
```
- Tracks memory consumption
- Helps identify memory leaks

## Common Performance Issues

### Issue 1: Excessive Re-renders

**Symptom:** ProductShape components rendering 50+ times during normal interaction

**Console Output:**
```
[Render #52] ProductShape-abc123 (2.1ms)
[Render #53] ProductShape-abc123 (2.3ms)
[Render #54] ProductShape-abc123 (1.9ms)
```

**Cause:** Parent component event handlers not wrapped in `useCallback`, causing all children to re-render

**Solution:** Wrap event handlers in `useCallback` hook

### Issue 2: Slow Initial Load

**Symptom:** Long delay when opening a design with many products

**Console Output:**
```
[Render #1] ProductsLayer @ 13:30:45.123 (1234ms)
```

**Cause:** Large number of products loading at once without optimization

**Solution:** Consider lazy loading or virtualization for 100+ products

### Issue 3: Laggy Interactions

**Symptom:** Delay between clicking and action happening

**Console Output:**
```
[Expensive Operation] Product Filter (45ms)
[Expensive Operation] Product Filter (43ms)
[Expensive Operation] Product Filter (47ms)
```

**Cause:** Expensive calculations running on every render

**Solution:** Wrap calculations in `useMemo` hook

## Performance Optimization Checklist

When the logging shows issues, apply these fixes:

### 1. Memoization
- [x] ProductShape - Already memoized
- [ ] Event handlers in main page - Wrap in `useCallback`
- [ ] Filtered/mapped arrays - Wrap in `useMemo`
- [ ] Complex calculations - Wrap in `useMemo`

### 2. Component Optimization
```javascript
// Before
const handleClick = (e) => { /* ... */ };

// After
const handleClick = useCallback((e) => { /* ... */ }, [/* dependencies */]);
```

### 3. Prevent Unnecessary Re-renders
```javascript
// Before
const filteredProducts = products.filter(p => p.visible);

// After
const filteredProducts = useMemo(
  () => products.filter(p => p.visible),
  [products]
);
```

## Disabling Logging

Click the "Perf Log" button again to disable logging. The button will return to default color.

## Advanced Usage

### Manual Logging in Code

```javascript
import { logRender, measurePerformance, logExpensiveOperation } from '/src/utils/performanceLogger';

// Log a render
logRender('MyComponent', { propName: propValue });

// Measure operation timing
const result = measurePerformance('Calculate something', () => {
  // expensive operation
  return calculation();
});

// Mark expensive operations
logExpensiveOperation('Product Filter', { count: products.length });
```

### Memory Tracking

```javascript
import { logMemoryUsage } from '/src/utils/performanceLogger';

// Take memory snapshot
logMemoryUsage('After loading 100 products');
```

## Expected Performance Baselines

Good performance targets:
- Component render time: < 5ms
- Total renders per interaction: < 10
- Memory growth: < 2MB per 100 products
- Interaction delay: < 100ms

If your metrics exceed these, investigate using the logging output.

## Need Help?

If the logging reveals performance issues but you're not sure how to fix them:

1. Share the console output showing the problem
2. Describe what interaction causes the lag
3. Note how many products are in the design
4. Include browser and device info (Chrome/Firefox, Desktop/Tablet)

The logging will provide the data needed to identify and fix the specific bottleneck.
