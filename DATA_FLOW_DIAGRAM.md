# Visual Data Flow Diagram

## Complete Product Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRODUCT PLACEMENT (NEW)                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
          ┌─────────────────────────────────────────┐
          │  createProductFromTemplate()            │
          │  - Gets full API product data           │
          │  - Adds canvas position (x, y)          │
          │  - Includes ALL metadata fields         │
          │                                         │
          │  Size: ~2-3 KB per product              │
          └─────────────────────────────────────────┘
                                    │
                                    ▼
          ┌─────────────────────────────────────────┐
          │         RUNTIME STATE                    │
          │  Products array with full metadata      │
          │  - Used for canvas rendering             │
          │  - Used for UI display                   │
          │  - Includes images, prices, stock        │
          └─────────────────────────────────────────┘
                                    │
                         USER CLICKS SAVE
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SAVE PROCESS                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
          ┌─────────────────────────────────────────┐
          │  stripProductMetadata()                 │
          │  REMOVES:                                │
          │  ❌ metadata (full API object)          │
          │  ❌ brand, product_type                 │
          │  ❌ price, msrp                         │
          │  ❌ imageUrl, thumbnailUrl              │
          │  ❌ category, categories                │
          │  ❌ description, colors                 │
          │  ❌ inStock, stockQty                   │
          │                                         │
          │  KEEPS:                                  │
          │  ✅ id, x, y, rotation                  │
          │  ✅ scaleX, scaleY, color               │
          │  ✅ sku (for API lookup)                │
          │  ✅ name (fallback)                     │
          │  ✅ quantity, notes, customLabel        │
          │  ✅ sublayerId                          │
          │                                         │
          │  Size: ~200-300 bytes per product       │
          │  Reduction: 85-90%                      │
          └─────────────────────────────────────────┘
                                    │
                                    ▼
          ┌─────────────────────────────────────────┐
          │   Azure Table Storage (JSON)            │
          │   Much smaller payload                   │
          └─────────────────────────────────────────┘
                                    │
                         USER RELOADS PAGE
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          LOAD PROCESS                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
    ┌───────────────────────────┐   ┌──────────────────────────┐
    │  GET Design Data          │   │  GET Products Catalog    │
    │  /api/ExecGetDesign       │   │  /api/ExecListBeaconProducts│
    │                           │   │                          │
    │  Returns minimal product  │   │  Returns ALL products    │
    │  data from storage        │   │  with full metadata      │
    └───────────────────────────┘   └──────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
          ┌─────────────────────────────────────────┐
          │  Product Enrichment Logic               │
          │                                         │
          │  For each saved product:                │
          │    1. Take saved canvas data            │
          │    2. Find product in catalog by SKU    │
          │    3. Merge: saved data + API data      │
          │                                         │
          │  Result: Full product with:             │
          │    - Saved: position, rotation, notes   │
          │    - Fresh: images, prices, stock       │
          │                                         │
          │  Size: ~2-3 KB per product (runtime)    │
          └─────────────────────────────────────────┘
                                    │
                                    ▼
          ┌─────────────────────────────────────────┐
          │         RUNTIME STATE                    │
          │  Products array with full metadata      │
          │  Ready for canvas rendering             │
          └─────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND IMAGE FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

    USER UPLOADS IMAGE
            │
            ▼
    ┌───────────────────┐
    │  FileReader       │
    │  readAsDataURL()  │
    └───────────────────┘
            │
            ▼
    ┌───────────────────────────────┐
    │  updateActiveLayer()          │
    │  backgroundImage: dataURL     │
    │  backgroundImageNaturalSize   │
    └───────────────────────────────┘
            │
            ▼
    ┌───────────────────────────────┐
    │  SAVED in layer object        │
    │  (with products in layer)     │
    └───────────────────────────────┘
            │
    USER SAVES & RELOADS
            │
            ▼
    ┌───────────────────────────────┐
    │  loadLayers(enrichedLayers)   │  ◄── NEW! Was TODO before
    │  - Restores layer structure   │
    │  - Includes backgroundImage   │
    └───────────────────────────────┘
            │
            ▼
    ┌───────────────────────────────┐
    │  useEffect watches            │
    │  activeLayer changes          │
    │  setBackgroundImage()         │
    └───────────────────────────────┘
            │
            ▼
    ┌───────────────────────────────┐
    │  DesignerCanvas displays      │
    │  background image             │
    └───────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      KEY BENEFITS                                    │
└─────────────────────────────────────────────────────────────────────┘

✅ Storage Efficiency
   - 85-90% reduction in data size
   - Faster saves and loads
   - Lower storage costs

✅ Data Freshness
   - Prices always current
   - Stock status always accurate
   - Product details up-to-date

✅ Background Images
   - Now load correctly
   - Preserved across sessions

✅ User Data Preserved
   - Notes, quantities stay intact
   - Custom labels maintained
   - Canvas positions exact
```
