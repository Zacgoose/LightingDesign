import React from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
} from "@mui/material";

/**
 * ObjectPreviewPanel - UI component for showing preview of selected object
 * Displays thumbnail, product name, and SKU when exactly 1 object is selected
 */
export const ObjectPreviewPanel = ({
  product,
  visible,
}) => {
  if (!visible || !product) {
    return null;
  }

  const hasThumbnail = product.thumbnailUrl || product.thumbnailImageUrl;
  const thumbnailUrl = product.thumbnailUrl || product.thumbnailImageUrl;

  return (
    <Paper
      elevation={2}
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        width: 280,
        maxHeight: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      
      <Box sx={{ p: 2 }}>
        {/* Thumbnail Image */}
        {hasThumbnail && (
          <Box
            sx={{
              width: "100%",
              height: 180,
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "background.default",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <img
              src={thumbnailUrl}
              alt={product.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              onError={(e) => {
                // Hide image on error
                e.target.style.display = "none";
              }}
            />
          </Box>
        )}
        
        {/* Product Name */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            mb: 1,
            wordBreak: "break-word",
          }}
        >
          {product.customLabel || product.name}
        </Typography>
        
        {/* SKU */}
        {product.sku && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontFamily: "monospace",
              wordBreak: "break-word",
            }}
          >
            SKU: {product.sku}
          </Typography>
        )}
        
        {/* Additional Info */}
        {product.brand && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Brand: {product.brand}
          </Typography>
        )}
        
        {product.quantity > 1 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Quantity: {product.quantity}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ObjectPreviewPanel;
