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
const ProductListItem = memo(
  ({ product, showDivider }) => {
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
  },
  (prevProps, nextProps) => {
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
  },
);

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

      // First pass: build unique SKU lists per product type for efficient letter prefix calculation
      const skusByType = new Map();
      const productMap = new Map();

      // Single pass to build both maps
      products.forEach((product) => {
        const productType = product.product_type?.toLowerCase() || "default";
        const sku = product.sku?.trim() || "NO-SKU";

        // Build SKU index maps
        if (!skusByType.has(productType)) {
          skusByType.set(productType, new Set());
        }
        if (sku && sku !== "NO-SKU") {
          skusByType.get(productType).add(sku);
        }

        // Build product map simultaneously
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
            color: product.color || productTypesConfig[productType]?.fill || "#1976d2",
            rawSku: sku, // Store for later prefix calculation
          });
        }

        productMap.get(key).quantity += product.quantity || 1;
      });

      // Convert sets to sorted arrays and create SKU index lookup maps
      const skuIndexMaps = new Map();
      skusByType.forEach((skuSet, productType) => {
        const sortedSkus = Array.from(skuSet).sort();
        const indexMap = new Map();
        sortedSkus.forEach((sku, index) => {
          indexMap.set(sku, index);
        });
        skuIndexMaps.set(productType, indexMap);
      });

      // Add letter prefixes to products
      const result = Array.from(productMap.values());
      result.forEach((product) => {
        const config = productTypesConfig[product.productType] || productTypesConfig.default;
        const letterPrefix = config.letterPrefix || "O";

        const indexMap = skuIndexMaps.get(product.productType);
        if (indexMap && indexMap.has(product.rawSku)) {
          product.letterPrefix = `${letterPrefix}${indexMap.get(product.rawSku) + 1}`;
        } else {
          product.letterPrefix = letterPrefix;
        }
        delete product.rawSku; // Clean up temporary property
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
  }),
  (prevProps, nextProps) => {
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
        (prev.thumbnailUrl || prev.thumbnailImageUrl) !==
          (next.thumbnailUrl || next.thumbnailImageUrl)
      ) {
        return false; // Found a difference, should re-render
      }
    }

    return true; // No differences found, skip re-render
  },
);

ProductListPanel.displayName = "ProductListPanel";

export default ProductListPanel;
