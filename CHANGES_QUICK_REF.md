# Quick Reference: Design Data Optimization Changes

## Files Changed

### 1. `/lightingdesign/src/hooks/useLayerManager.js`
**Change**: Added `loadLayers` method to load/replace all layers

```javascript
// NEW METHOD - Added after reorderLayers
const loadLayers = useCallback((newLayers) => {
  if (newLayers && newLayers.length > 0) {
    setLayers(newLayers);
    if (!layerIds.includes(activeLayerId)) {
      setActiveLayerId(newLayers[0].id);
    }
  }
}, [activeLayerId]);

// Added to return statement
return {
  // ... existing methods
  loadLayers,  // NEW
};
```

### 2. `/lightingdesign/src/pages/jobs/design/index.jsx`
**Changes**: 
- Added product catalog API call
- Implemented layer loading (was TODO)
- Added product enrichment on load
- Added data stripping on save
- Updated loading states

#### Added Product Catalog API Call (line ~48)
```javascript
const productsData = ApiGetCall({
  url: "/api/ExecListBeaconProducts",
  queryKey: "BeaconProducts",
});
```

#### Added loadLayers to destructured layerManager (line ~81)
```javascript
const {
  // ... existing
  loadLayers,  // NEW
} = layerManager;
```

#### Implemented Layer Loading with Product Enrichment (line ~134)
```javascript
useEffect(() => {
  if (designData.isSuccess && designData.data?.designData) {
    const loadedDesign = designData.data.designData;
    
    // Check if we need products data
    const hasProductsToEnrich = ...;
    if (hasProductsToEnrich && !productsData.isSuccess) {
      return; // Wait for products data
    }
    
    // Load layers with enriched products
    if (loadedDesign.layers && loadedDesign.layers.length > 0) {
      const enrichedLayers = loadedDesign.layers.map(layer => ({
        ...layer,
        products: layer.products.map(savedProduct => {
          const apiProduct = productsData.data?.find(p => p.sku === savedProduct.sku);
          if (apiProduct) {
            return { ...savedProduct, /* enrich with API data */ };
          }
          return savedProduct;
        })
      }));
      loadLayers(enrichedLayers);  // NEW - was TODO before
    }
    
    // Enrich standalone products too
    if (loadedDesign.products !== undefined) {
      const enrichedProducts = loadedDesign.products.map(/* same logic */);
      updateHistory(enrichedProducts);
    }
  }
}, [designData.isSuccess, designData.data, productsData.isSuccess, ...]);
```

#### Added Data Stripping Functions (line ~252)
```javascript
const stripProductMetadata = (product) => {
  return {
    id: product.id,
    x: product.x,
    y: product.y,
    rotation: product.rotation,
    scaleX: product.scaleX,
    scaleY: product.scaleY,
    baseScaleX: product.baseScaleX,
    baseScaleY: product.baseScaleY,
    color: product.color,
    sku: product.sku,
    name: product.name,
    quantity: product.quantity,
    notes: product.notes,
    customLabel: product.customLabel,
    sublayerId: product.sublayerId,
  };
};

const stripLayersForSave = (layersToSave) => {
  return layersToSave.map(layer => ({
    ...layer,
    products: layer.products.map(stripProductMetadata),
  }));
};
```

#### Updated Save Function (line ~283)
```javascript
const handleSave = () => {
  // ... existing code
  
  // NEW - Strip metadata before saving
  const strippedProducts = products.map(stripProductMetadata);
  const strippedLayers = stripLayersForSave(layers);

  saveDesignMutation.mutate({
    url: "/api/ExecSaveDesign",
    data: {
      jobId: id,
      designData: {
        products: strippedProducts,  // Changed from 'products'
        connectors,
        layers: strippedLayers,      // Changed from 'layers'
        canvasSettings: { /* ... */ }
      }
    }
  });
};
```

#### Updated Loading UI (line ~1284)
```javascript
{(designData.isLoading || productsData.isLoading) && (
  <Box>
    <CircularProgress />
    <Typography>
      {designData.isLoading ? "Loading design..." : "Loading product catalog..."}
    </Typography>
  </Box>
)}

{!designData.isLoading && !productsData.isLoading && (
  // Main design interface
)}
```

## Key Concepts

### Save Flow
Products with full metadata → `stripProductMetadata()` → Minimal data → Storage

### Load Flow  
Minimal data → Enrich with API (by SKU) → Full products → Display

### Data Saved Per Product
Before: ~2-3 KB (with full metadata)
After: ~200-300 bytes (position + SKU)

### What's Stripped from Save
- `metadata` (entire API object)
- `brand`, `product_type`, `price`, `msrp`
- `imageUrl`, `thumbnailUrl`
- `category`, `categories`, `description`
- `colors`, `inStock`, `stockQty`

### What's Kept in Save
- Canvas data: `id`, `x`, `y`, `rotation`, `scale*`, `color`
- User data: `quantity`, `notes`, `customLabel`
- Identification: `sku`, `name`
- Layer assignment: `sublayerId`
