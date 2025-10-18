import { Close } from "@mui/icons-material";
import { IconButton, Box, Typography, Card, CardContent, Stack, Link } from "@mui/material";
import { CippOffCanvas } from "../CippComponents/CippOffCanvas";
import CippPageCard from "../CippCards/CippPageCard";

export const ProductDetailsDrawer = ({ product, visible = false, onClose }) => {
  if (!product) return null;

  // Handle both field name variations for backward compatibility
  const thumbnailUrl = product.thumbnailImageUrl || product.thumbnailUrl;
  const websiteUrl = product.url;

  return (
    <CippOffCanvas
      title="Product Properties"
      visible={visible}
      onClose={onClose}
      size="md"
      contentPadding={2}
    >
      <Stack spacing={3}>
        {/* Product Image */}
        {thumbnailUrl && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          >
            <img
              src={thumbnailUrl}
              alt={product.name || "Product"}
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                objectFit: "contain",
              }}
            />
          </Box>
        )}

        {/* Product Details */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {/* Name */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {product.name || "N/A"}
                </Typography>
              </Box>

              {/* MSRP */}
              {product.msrp && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    MSRP
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${product.msrp}
                  </Typography>
                </Box>
              )}

              {/* Product Type */}
              {(product.product_type_unigram || product.product_type) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: "capitalize" }}>
                    {product.product_type_unigram || product.product_type}
                  </Typography>
                </Box>
              )}

              {/* Website Link */}
              {websiteUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Website
                  </Typography>
                  <Link
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body1"
                    sx={{
                      display: "block",
                      wordBreak: "break-all",
                    }}
                  >
                    {websiteUrl}
                  </Link>
                </Box>
              )}

              {/* Brand */}
              {product.brand && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Brand
                  </Typography>
                  <Typography variant="body1">
                    {product.brand}
                  </Typography>
                </Box>
              )}

              {/* SKU */}
              {product.sku && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    SKU
                  </Typography>
                  <Typography variant="body1">
                    {product.sku}
                  </Typography>
                </Box>
              )}

              {/* Description */}
              {product.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {product.description}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </CippOffCanvas>
  );
};
