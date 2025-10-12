# Design Data Optimization - Implementation Summary

## Problem Statement
When loading design data from an existing design, the following issues were identified:
1. Background images were not loading
2. Too much data was being saved, including full product metadata
3. The saved data size was unnecessarily large

## Solutions Implemented

### 1. Fixed Background Image Loading

**Issue**: Background images stored in layers were not being loaded when a design was retrieved from the database.

**Root Cause**: In `lightingdesign/src/pages/jobs/design/index.jsx`, there was a TODO comment at line 146 indicating that layer loading was not implemented.

**Fix**: 
- Added `loadLayers` method to `useLayerManager` hook that allows replacing all layers with new data
- Implemented the layer loading logic in the design page's useEffect hook
- Background images are now properly restored when loading a saved design

**Files Modified**:
- `lightingdesign/src/hooks/useLayerManager.js`: Added `loadLayers` method
- `lightingdesign/src/pages/jobs/design/index.jsx`: Implemented layer loading

### 2. Reduced Saved Product Metadata

**Issue**: Every product was being saved with its complete metadata object from the products API, which includes extensive information not needed for the canvas display.

**Solution**: 
- Created `stripProductMetadata` function that extracts only the essential data before saving:
  - Canvas-specific: `id`, `x`, `y`, `rotation`, `scaleX`, `scaleY`, `baseScaleX`, `baseScaleY`, `color`, `sublayerId`
  - User-added: `quantity`, `notes`, `customLabel`
  - Identification: `sku` (for API lookup), `name` (for fallback display)
- Created `stripLayersForSave` function that applies metadata stripping to all products in all layers
- Modified `handleSave` to strip metadata before sending to API

**Data Reduction**: The `metadata`, `brand`, `product_type`, `price`, `msrp`, `imageUrl`, `thumbnailUrl`, `category`, `categories`, `description`, `colors`, `inStock`, `stockQty` fields are no longer saved, reducing the stored data size significantly.

**Files Modified**:
- `lightingdesign/src/pages/jobs/design/index.jsx`: Added stripping functions and updated save logic

### 3. Product Data Enrichment on Load

**Issue**: After stripping metadata from saved products, we need to restore the full product information when loading a design.

**Solution**:
- Added API call to fetch the complete products catalog (`/api/ExecListBeaconProducts`)
- On design load, each saved product is enriched with fresh data from the API by matching the SKU
- The enrichment process:
  1. Takes the saved canvas data (position, rotation, scale, etc.)
  2. Looks up the product in the API data using SKU
  3. Merges the saved canvas data with fresh API data
  4. If a product SKU is not found in the API, the saved data is used as-is
- Enrichment is applied to both standalone products and products within layers
- Added loading state management to wait for product catalog before showing the design

**Benefits**:
- Products always have the latest price, stock status, and metadata from the API
- Reduced storage requirements
- Canvas-specific data (position, notes, custom labels) is preserved

**Files Modified**:
- `lightingdesign/src/pages/jobs/design/index.jsx`: Added product enrichment logic

### 4. Improved Loading UX

**Changes**:
- Loading indicator now shows "Loading product catalog..." when waiting for product data
- Design won't load until product catalog is available (if products exist in the design)
- Empty designs (no products) load immediately without waiting for product catalog

**Files Modified**:
- `lightingdesign/src/pages/jobs/design/index.jsx`: Updated loading states

## Data Flow

### Save Flow:
```
Canvas Products (with full metadata)
  ↓
stripProductMetadata() - Removes all API-sourced data
  ↓
Minimal Product Data (position, SKU, notes, etc.)
  ↓
Azure Table Storage
```

### Load Flow:
```
Azure Table Storage
  ↓
Minimal Product Data
  ↓
Enrich with API Data (lookup by SKU)
  ↓
Full Product Objects (position + API metadata)
  ↓
Canvas Display
```

## Before vs After

### Before:
```javascript
// Product saved with full metadata (~2-3KB per product)
{
  id: "product-123",
  x: 100, y: 200,
  rotation: 45,
  sku: "ABC-123",
  name: "Product Name",
  brand: "Brand Name",
  product_type: "pendant",
  price: 299.99,
  msrp: 399.99,
  imageUrl: "https://...",
  thumbnailUrl: "https://...",
  category: "Lighting",
  categories: ["Cat1", "Cat2", "Cat3"],
  description: "Long description...",
  colors: ["Black", "White"],
  inStock: true,
  stockQty: 15,
  metadata: { /* entire product object */ },
  // ... many more fields
}
```

### After:
```javascript
// Product saved with minimal data (~200-300 bytes per product)
{
  id: "product-123",
  x: 100,
  y: 200,
  rotation: 45,
  scaleX: 1,
  scaleY: 1,
  baseScaleX: 1,
  baseScaleY: 1,
  color: null,
  sku: "ABC-123",  // Used to fetch from API
  name: "Product Name",  // Fallback display
  quantity: 1,
  notes: "",
  customLabel: "",
  sublayerId: "layer-1-default"
}
```

**Storage Reduction**: Approximately 85-90% reduction in product data size per product.

## Testing Checklist

To verify the implementation:

1. **Background Image Loading**:
   - [ ] Create a new design
   - [ ] Upload a floor plan image
   - [ ] Save the design
   - [ ] Reload the page
   - [ ] Verify the floor plan image appears correctly

2. **Product Metadata Reduction**:
   - [ ] Add products to a design
   - [ ] Save the design
   - [ ] Check the saved data in Azure Table Storage
   - [ ] Verify only minimal product data is stored
   - [ ] Confirm full metadata is NOT in the saved data

3. **Product Enrichment on Load**:
   - [ ] Load a design with products
   - [ ] Verify product images appear
   - [ ] Verify product prices and details are displayed
   - [ ] Verify product positions and rotations are correct
   - [ ] Verify user-added data (notes, quantities) is preserved

4. **Loading States**:
   - [ ] Load a design with products - should see "Loading product catalog..."
   - [ ] Load an empty design - should load immediately
   - [ ] Verify no errors in console

## Future Enhancements (Optional)

1. **Background Image Compression**: Consider compressing background images before saving to further reduce data size
2. **Lazy Loading**: Load product details on-demand instead of fetching entire catalog
3. **Caching**: Cache product catalog to reduce API calls on subsequent design loads
4. **Batch API**: Create an API endpoint that fetches multiple products by SKU in one request

## Notes

- Background images are saved as data URLs, which can be large. Consider implementing compression in the future.
- The implementation is backward-compatible: if a product SKU is not found in the API, the saved data is used as-is.
- All changes are minimal and surgical, focusing only on the specific issues identified.
