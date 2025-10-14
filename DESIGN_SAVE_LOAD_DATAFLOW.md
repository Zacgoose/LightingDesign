# Design Save/Load Data Flow

## BEFORE FIX ❌

### Save Flow (Incorrect)
```
Designer Page
    ↓
Active Layer State
    ├─ products: [p1, p2, p3]  ──────────┐
    ├─ connectors: [c1, c2]  ────────────┤
    └─ layers: [                         ├─→ Saved to API
         {                               │
           products: [p1, p2, p3],  ─────┤
           connectors: [c1, c2]  ────────┘
         }
       ]
```
**Problem**: Products/connectors saved twice! Root level AND in layers

### Load Flow (Incorrect)
```
API Response
    ↓
{
  products: [p1, p2, p3],  ←─── 🔴 Old data at root
  layers: [
    {
      products: [],  ←─── 🟡 Empty! Data should be here
      connectors: []
    }
  ]
}
    ↓
Loader Logic (OLD)
    ├─ Load layers → No products found
    ├─ Load root products → Overwrites layer state!
    └─ Result: Confusion, corruption
```
**Problem**: Products at root with empty layers caused loading issues

---

## AFTER FIX ✅

### Save Flow (Correct)
```
Designer Page
    ↓
Active Layer State (synced via useEffect)
    ├─ products: [p1, p2, p3]  ──→ updateLayer()
    ├─ connectors: [c1, c2]  ────→ updateLayer()
    └─ layers: [
         {
           id: "layer-1",
           products: [p1, p2, p3],  ←── Data synced here
           connectors: [c1, c2]
         }
       ]
    ↓
handleSave()
    ↓
{
  layers: [  ←── ✅ ONLY layers saved
    {
      products: [p1, p2, p3],
      connectors: [c1, c2]
    }
  ]
}
```
**Fixed**: Only layers saved, no root duplication

### Load Flow (Correct)
```
API Response
    ↓
Case 1: New Format ✅
{
  layers: [
    {
      products: [p1, p2, p3],  ←── ✅ Data in layers
      connectors: [c1, c2]
    }
  ]
}
    ↓
Load directly from layers

---

Case 2: Old Format (Migration) 🔄
{
  products: [
    { id: "p1", sublayerId: "layer-1-default" },
    { id: "p2", sublayerId: "layer-1-sublayer-1" },
    { id: "p3", sublayerId: "layer-1-default" }
  ],
  layers: [
    {
      id: "layer-1",
      products: [],  ←── 🔄 Empty, needs migration
      sublayers: [
        { id: "layer-1-default" },
        { id: "layer-1-sublayer-1" }
      ]
    }
  ]
}
    ↓
Migration Logic
    ├─ Detect: layers exist but empty
    ├─ Distribute products by sublayerId:
    │   └─ "layer-1-default" → [p1, p3]
    │   └─ "layer-1-sublayer-1" → [p2]
    └─ Result: {
         layers: [
           {
             id: "layer-1",
             products: [p1, p2, p3],  ←── ✅ Migrated
             connectors: [c1, c2]
           }
         ]
       }

---

Case 3: Legacy Format ⚠️
{
  products: [p1, p2, p3],  ←── No layers at all
  connectors: [c1, c2]
}
    ↓
Fallback: Load from root
```

---

## Data Sync Flow

### Products/Connectors → Layer Sync
```
useEffect(() => {
  if (isLoadingLayerData.current) return;
  updateLayer(activeLayerId, { products });
}, [products, activeLayerId, updateLayer]);

useEffect(() => {
  if (isLoadingLayerData.current) return;
  updateLayer(activeLayerId, { connectors });
}, [connectors, activeLayerId, updateLayer]);
```

### Layer Switch Flow
```
User switches layer
    ↓
setActiveLayerId("layer-2")
    ↓
Active layer changes
    ↓
useHistory hook updates from new layer
    ↓
products = layer-2.products
connectors = layer-2.connectors
```

---

## Azure Storage Chunking

### Large Property Handling
```
Property Size         Action
────────────────────────────────────────
< 30KB               Store as-is
> 30KB               Split into chunks:
                     - Property_Part0
                     - Property_Part1
                     - Property_Part...
                     + SplitOverProps metadata

Entity Size          Action
────────────────────────────────────────
< 500KB              Single row
> 500KB              Multiple rows:
                     - rowKey-part0
                     - rowKey-part1
                     - rowKey-part...
                     + OriginalEntityId
                     + PartIndex
```

### Example: Background Image
```
Original:
  backgroundImage: "data:image/jpeg;base64,..." (328KB)
      ↓
Saved to Azure:
  backgroundImage_Part0: "data:image..." (30KB)
  backgroundImage_Part1: "jpeg;base64,/9..." (30KB)
  backgroundImage_Part2: "j/4AAQSkZJRgA..." (30KB)
  ...
  backgroundImage_Part10: "...ABAQEAYABgA" (28KB)
  SplitOverProps: '[{"OriginalHeader":"backgroundImage","SplitHeaders":["backgroundImage_Part0",...]}]'
      ↓
Loaded from Azure:
  backgroundImage: "data:image/jpeg;base64,..." (328KB) ✅ Reassembled
```

---

## Migration Examples

### Example 1: Sample JSON
```
BEFORE MIGRATION:
products (root): 5 items
  - 3x "Maine 1 Light Batten Fix" → sublayerId: "layer-1760372286404-default"
  - 2x "Lucci Power Ion" → sublayerId: "layer-1760372286404-sublayer-1760372361582"
layers[0] (Floor 1): 0 products
layers[1] (Floor 2): 0 products

AFTER MIGRATION:
products (root): 0 items
layers[0] (Floor 1): 0 products
layers[1] (Floor 2): 5 products
  - sublayer "Lighting": 3 products
  - sublayer "Fans": 2 products
```

### Example 2: Multi-Layer Design
```
BEFORE MIGRATION:
products (root):
  - p1: sublayerId = "layer-1-default"
  - p2: sublayerId = "layer-1-sublayer-fans"
  - p3: sublayerId = "layer-2-default"
  - p4: sublayerId = "layer-2-default"

layers:
  - layer-1: products = [], sublayers = ["default", "sublayer-fans"]
  - layer-2: products = [], sublayers = ["default"]

AFTER MIGRATION:
layers:
  - layer-1:
      products = [p1, p2]
      sublayers:
        - "default": [p1]
        - "sublayer-fans": [p2]
  - layer-2:
      products = [p3, p4]
      sublayers:
        - "default": [p3, p4]
```

---

## Key Takeaways

1. ✅ **Single Source of Truth**: Products/connectors only in layers
2. ✅ **Automatic Migration**: Old format auto-converts on load
3. ✅ **Backward Compatible**: Supports 3 formats (new, migration, legacy)
4. ✅ **No Data Loss**: Azure Storage chunks/reassembles large properties
5. ✅ **Future Proof**: New saves always use correct format
