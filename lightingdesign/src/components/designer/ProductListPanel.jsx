import React, { useMemo } from "react";
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
 * ProductListPanel - Shows a scrollable list of all products on the current layer
 * Groups products by SKU and displays:
 * - Quantity on the current layer
 * - Product name
 * - SKU
 * - Price
 * - Thumbnail
 * - Prefix letter and number
 */
export const ProductListPanel = ({ products, visible, activeLayerId }) => {
  // Helper function to calculate letter prefix for a product
  const getProductLetterPrefix = (product, allProducts) => {
    const productType = product.product_type?.toLowerCase() || "default";
    const config = productTypesConfig[productType] || productTypesConfig.default;
    const letterPrefix = config.letterPrefix || "O";

    const sku = product.sku?.trim();
    if (!sku || sku === "") {
      return letterPrefix;
    }

    const sameTypeProducts = allProducts.filter(
      (p) => (p.product_type?.toLowerCase() || "default") === productType,
    );

    const uniqueSkus = [
      ...new Set(sameTypeProducts.map((p) => p.sku?.trim()).filter((s) => s && s !== "")),
    ].sort();

    const skuIndex = uniqueSkus.indexOf(sku);

    if (skuIndex === -1) {
      return letterPrefix;
    }

    return `${letterPrefix}${skuIndex + 1}`;
  };

  // Group products by SKU and calculate totals
  const productSummary = useMemo(() => {
    const productMap = new Map();

    products.forEach((product) => {
      const sku = product.sku || "NO-SKU";
      const key = `${sku}-${product.product_type || "default"}`;

      if (!productMap.has(key)) {
        const letterPrefix = getProductLetterPrefix(product, products);
        productMap.set(key, {
          sku: product.sku || "N/A",
          name: product.name || "Unnamed Product",
          brand: product.brand || "",
          productType: product.product_type || "default",
          price: product.price || 0,
          thumbnailUrl: product.thumbnailUrl || product.thumbnailImageUrl || null,
          letterPrefix,
          quantity: 0,
          color: product.color || productTypesConfig[product.product_type?.toLowerCase() || "default"]?.fill || "#1976d2",
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
      elevation={2}
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 320,
        maxHeight: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Products on Layer
        </Typography>
        <Typography variant="caption" color="text.secondary">
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
          <React.Fragment key={`${product.sku}-${product.productType}-${index}`}>
            <ListItem
              sx={{
                py: 1.5,
                px: 2,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ListItemAvatar>
                {product.thumbnailUrl ? (
                  <Avatar
                    src={product.thumbnailUrl}
                    alt={product.name}
                    variant="rounded"
                    sx={{ width: 56, height: 56 }}
                  />
                ) : (
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 56,
                      height: 56,
                      backgroundColor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: product.color,
                        borderRadius: "4px",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          color: "#000",
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Chip
                      label={product.letterPrefix}
                      size="small"
                      sx={{
                        backgroundColor: product.color,
                        color: "#000",
                        fontWeight: "bold",
                        minWidth: 40,
                        height: 20,
                        fontSize: "0.7rem",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        lineHeight: 1.2,
                        flex: 1,
                      }}
                    >
                      {product.name}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{
                        fontFamily: "monospace",
                        color: "text.secondary",
                      }}
                    >
                      SKU: {product.sku}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: "primary.main",
                        }}
                      >
                        Qty: {product.quantity}
                      </Typography>
                      {product.price > 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
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
            {index < productSummary.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default ProductListPanel;
