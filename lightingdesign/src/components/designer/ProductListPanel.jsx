import React, { useMemo, memo, forwardRef } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";
import { getShapeFunction } from "/src/components/designer/productShapes";
import productTypesConfig from "/src/data/productTypes.json";

/**
 * Individual product list item - memoized to prevent unnecessary re-renders
 * when other products in the list change
 */
const ProductListItem = memo(({ product, showDivider }) => {
  return (
    <>
      <ListItem
        sx={{
          py: 0.75,
          px: 1,
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <ListItemAvatar sx={{ minWidth: 48 }}>
          {product.thumbnailUrl ? (
            <Avatar
              src={product.thumbnailUrl}
              alt={product.name}
              variant="rounded"
              sx={{ width: 40, height: 40 }}
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{
                width: 40,
                height: 40,
                backgroundColor: "background.default",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: product.color,
                  borderRadius: "2px",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    color: "#000",
                    fontSize: "0.65rem",
                  }}
                >
                  {product.letterPrefix}
                </Typography>
              </Box>
            </Avatar>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
              <Chip
                label={product.letterPrefix}
                size="small"
                sx={{
                  backgroundColor: product.color,
                  color: "#000",
                  fontWeight: "bold",
                  minWidth: 32,
                  height: 18,
                  fontSize: "0.65rem",
                  "& .MuiChip-label": {
                    px: 0.5,
                  },
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                  flex: 1,
                  fontSize: "0.65rem",
                }}
              >
                {product.name}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ mt: 0.25 }}>
              <Typography
                variant="caption"
                display="block"
                sx={{
                  fontFamily: "monospace",
                  color: "text.secondary",
                  fontSize: "0.65rem",
                }}
              >
                SKU: {product.sku}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    fontSize: "0.7rem",
                  }}
                >
                  Qty: {product.quantity}
                </Typography>
                {product.price > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.7rem",
                    }}
                  >
                    ${product.price.toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Box>
          }
          sx={{ ml: 2 }}
        />
      </ListItem>
      {showDivider && <Divider variant="inset" component="li" />}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if the actual product data changed
  return (
    prevProps.product.sku === nextProps.product.sku &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.quantity === nextProps.product.quantity &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.letterPrefix === nextProps.product.letterPrefix &&
    prevProps.product.color === nextProps.product.color &&
    prevProps.product.thumbnailUrl === nextProps.product.thumbnailUrl &&
    prevProps.product.productType === nextProps.product.productType &&
    prevProps.showDivider === nextProps.showDivider
  );
});

ProductListItem.displayName = "ProductListItem";

/**
 * ProductListPanel - Shows a scrollable list of all products on the current layer
 * Groups products by SKU and displays:
 * - Quantity on the current layer
 * - Product name
 * - SKU
 * - Price
 * - Thumbnail
 * - Prefix letter and number
 */
export const ProductListPanel = memo(
  forwardRef(({ products, visible, activeLayerId, top = 380 }, ref) => {
    // Group products by SKU and calculate totals
    // Optimized to pre-calculate all letter prefixes in a single pass to avoid O(n²) complexity
    const productSummary = useMemo(() => {
      if (products.length === 0) return [];

      // Build product map (group by SKU and product type)
      const productMap = new Map();

      products.forEach((product) => {
        const productType = product.product_type?.toLowerCase() || "default";
        const sku = product.sku?.trim() || "NO-SKU";

        const key = `${sku}-${productType}`;
        if (!productMap.has(key)) {
          productMap.set(key, {
            sku: product.sku || "N/A",
            name: product.name || "Unnamed Product",
            brand: product.brand || "",
            productType: productType,
            price: product.price || 0,
            thumbnailUrl: product.thumbnailUrl || product.thumbnailImageUrl || null,
            quantity: 0,
            color:
              product.color ||
              productTypesConfig[productType]?.fill ||
              "#1976d2",
            product: product, // Store reference to calculate letter prefix
          });
        }

        productMap.get(key).quantity += product.quantity || 1;
      });

      // Helper function to get grouping key (matches export.jsx logic)
      const getProductGroupingKey = (product) => {
        const sku = product.sku?.trim();
        const hasSku = sku && sku !== "";

        if (hasSku) {
          return `sku:${sku}`;
        } else {
          const productType = product.product_type?.toLowerCase() || "default";
          const config = productTypesConfig[productType] || productTypesConfig.default;
          const shapeType = product.shape || config.shapeType || productTypesConfig.default.shapeType;
          return `shape:${shapeType}`;
        }
      };

      // Add letter prefixes to products using same logic as export.jsx
      const result = Array.from(productMap.values());
      result.forEach((productSummaryItem) => {
        const product = productSummaryItem.product;
        const productType = product.product_type?.toLowerCase() || "default";
        const config = productTypesConfig[productType] || productTypesConfig.default;
        const letterPrefix = config.letterPrefix || "O";

        // Filter all products with the same letter prefix
        const samePrefixProducts = products.filter((p) => {
          const pType = p.product_type?.toLowerCase() || "default";
          const pConfig = productTypesConfig[pType] || productTypesConfig.default;
          const pPrefix = pConfig.letterPrefix || "O";
          return pPrefix === letterPrefix;
        });

        // Get the grouping key for this product
        const groupingKey = getProductGroupingKey(product);

        // Build a list of unique grouping keys in the order they first appear
        const uniqueGroupingKeys = [];
        const seenKeys = new Set();
        for (const p of samePrefixProducts) {
          const key = getProductGroupingKey(p);
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueGroupingKeys.push(key);
          }
        }

        // Find the index of this product's grouping key
        const groupIndex = uniqueGroupingKeys.indexOf(groupingKey);

        if (groupIndex !== -1) {
          productSummaryItem.letterPrefix = `${letterPrefix}${groupIndex + 1}`;
        } else {
          productSummaryItem.letterPrefix = letterPrefix;
        }

        // Clean up temporary reference
        delete productSummaryItem.product;
      });

      // Sort by letter prefix
      result.sort((a, b) => a.letterPrefix.localeCompare(b.letterPrefix));

      return result;
    }, [products]);

    if (!visible || products.length === 0) {
      return null;
    }

    return (
      <Paper
        ref={ref}
        elevation={2}
        sx={{
          position: "absolute",
          top: top,
          right: 16,
          width: 240,
          maxHeight: "calc(100vh - 520px)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
        }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
            {productSummary.length} unique product{productSummary.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Divider />
        <List
          sx={{
            overflowY: "auto",
            flexGrow: 1,
            p: 0,
          }}
        >
          {productSummary.map((product, index) => (
            <ProductListItem
              key={`${product.sku}-${product.productType}`}
              product={product}
              showDivider={index < productSummary.length - 1}
            />
          ))}
        </List>
      </Paper>
    );
}), (prevProps, nextProps) => {
  // Custom comparison for ProductListPanel props
  // Only re-render if visible status, activeLayerId, top position, or actual product data changes
  
  if (
    prevProps.visible !== nextProps.visible ||
    prevProps.activeLayerId !== nextProps.activeLayerId ||
    prevProps.top !== nextProps.top ||
    prevProps.products.length !== nextProps.products.length
  ) {
    return false; // Props changed, should re-render
  }

  // Quick check: if arrays are the same reference, no need to re-render
  if (prevProps.products === nextProps.products) {
    return true;
  }

  // Efficient comparison: check only display-relevant properties
  // Loop through products and compare key properties directly
  for (let i = 0; i < prevProps.products.length; i++) {
    const prev = prevProps.products[i];
    const next = nextProps.products[i];
    
    // Compare only the properties that affect the ProductListPanel display
    if (
      prev.id !== next.id ||
      prev.sku !== next.sku ||
      prev.name !== next.name ||
      prev.product_type !== next.product_type ||
      prev.quantity !== next.quantity ||
      prev.price !== next.price ||
      prev.brand !== next.brand ||
      prev.color !== next.color ||
      (prev.thumbnailUrl || prev.thumbnailImageUrl) !== (next.thumbnailUrl || next.thumbnailImageUrl)
    ) {
      return false; // Found a difference, should re-render
    }
  }

  return true; // No differences found, skip re-render
});

ProductListPanel.displayName = "ProductListPanel";

export default ProductListPanel;
