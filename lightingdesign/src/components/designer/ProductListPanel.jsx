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
      // First pass: build unique SKU lists per product type for efficient letter prefix calculation
      const skusByType = new Map();

      products.forEach((product) => {
        const productType = product.product_type?.toLowerCase() || "default";
        const sku = product.sku?.trim();

        if (!skusByType.has(productType)) {
          skusByType.set(productType, new Set());
        }

        if (sku && sku !== "") {
          skusByType.get(productType).add(sku);
        }
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

      // Helper function to get letter prefix using pre-calculated indices
      const getLetterPrefix = (product) => {
        const productType = product.product_type?.toLowerCase() || "default";
        const config = productTypesConfig[productType] || productTypesConfig.default;
        const letterPrefix = config.letterPrefix || "O";

        const sku = product.sku?.trim();
        if (!sku || sku === "") {
          return letterPrefix;
        }

        const indexMap = skuIndexMaps.get(productType);
        if (!indexMap || !indexMap.has(sku)) {
          return letterPrefix;
        }

        return `${letterPrefix}${indexMap.get(sku) + 1}`;
      };

      // Second pass: group products by SKU and calculate totals
      const productMap = new Map();

      products.forEach((product) => {
        const sku = product.sku || "NO-SKU";
        const key = `${sku}-${product.product_type || "default"}`;

        if (!productMap.has(key)) {
          productMap.set(key, {
            sku: product.sku || "N/A",
            name: product.name || "Unnamed Product",
            brand: product.brand || "",
            productType: product.product_type || "default",
            price: product.price || 0,
            thumbnailUrl: product.thumbnailUrl || product.thumbnailImageUrl || null,
            letterPrefix: getLetterPrefix(product),
            quantity: 0,
            color:
              product.color ||
              productTypesConfig[product.product_type?.toLowerCase() || "default"]?.fill ||
              "#1976d2",
          });
        }

        const entry = productMap.get(key);
        entry.quantity += product.quantity || 1;
      });

      return Array.from(productMap.values()).sort((a, b) => {
        // Sort by letter prefix
        return a.letterPrefix.localeCompare(b.letterPrefix);
      });
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
    prevProps.top !== nextProps.top
  ) {
    return false; // Props changed, should re-render
  }

  // Check if products array has same length
  if (prevProps.products.length !== nextProps.products.length) {
    return false; // Length changed, should re-render
  }

  // For performance, create a signature that only includes display-relevant properties
  // This avoids deep comparison when only position/rotation changes
  const createProductSignature = (products) => {
    return products
      .map((p) => `${p.id}:${p.sku}:${p.name}:${p.product_type}:${p.quantity}:${p.price}:${p.brand}:${p.thumbnailUrl || p.thumbnailImageUrl}:${p.color}`)
      .join('|');
  };

  const prevSignature = createProductSignature(prevProps.products);
  const nextSignature = createProductSignature(nextProps.products);

  return prevSignature === nextSignature; // Skip re-render if signatures match
});

ProductListPanel.displayName = "ProductListPanel";

export default ProductListPanel;
