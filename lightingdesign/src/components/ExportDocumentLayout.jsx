import React from "react";
import { Box, Grid, Typography } from "@mui/material";

/**
 * ExportDocumentLayout
 *
 * Props:
 * - logos: array of logo image URLs (2, stacked vertically)
 * - infoRows: array of 2 arrays, each with info blocks (designer, job, client, builder, company, etc)
 * - companyDetails: object with store and head office addresses
 * - productGrid: array of product objects (with thumbnail, icon, name, sku, quantity, etc)
 * - maxCols: number (default 5)
 * - maxRows: number (default 4)
 */
const ExportDocumentLayout = ({
  logos = [],
  infoRows = [[], []],
  companyDetails = {},
  productGrid = [],
  maxCols = 5,
  maxRows = 4,
}) => {
  // Calculate grid layout
  const gridItems = productGrid.slice(0, maxCols * maxRows);
  const rows = [];
  for (let i = 0; i < maxRows; i++) {
    rows.push(gridItems.slice(i * maxCols, (i + 1) * maxCols));
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Product Grid */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", pb: 2 }}>
        <Grid container spacing={2} justifyContent="center" alignItems="center">
          {rows.map((row, rowIdx) => (
            <Grid container item key={rowIdx} spacing={2} justifyContent="center">
              {row.map((product, colIdx) => (
                <Grid item key={colIdx} xs={12 / maxCols}>
                  <Box
                    sx={{
                      border: 1,
                      borderRadius: 2,
                      p: 1,
                      minWidth: 120,
                      minHeight: 180,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {product.thumbnail && (
                      <Box
                        component="img"
                        src={product.thumbnail}
                        alt={product.name}
                        sx={{ width: 60, height: 60, objectFit: "contain", mb: 1 }}
                      />
                    )}
                    {product.icon && (
                      <Box
                        component="img"
                        src={product.icon}
                        alt="icon"
                        sx={{ width: 32, height: 32, objectFit: "contain", mb: 1 }}
                      />
                    )}
                    <Typography variant="subtitle2" fontWeight="bold" align="center" noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center" noWrap>
                      {product.sku}
                    </Typography>
                    <Typography variant="body2" color="primary" align="center">
                      Qty: {product.quantity}
                    </Typography>
                    {product.text && (
                      <Typography variant="caption" align="center">
                        {product.text}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* Bottom Info Bar */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          bgcolor: "#f5f5f5",
          py: 2,
          px: 3,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        {/* Logos (left) */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mr: 4 }}>
          {logos.map((logo, idx) => (
            <Box
              key={idx}
              component="img"
              src={logo}
              alt={`logo-${idx}`}
              sx={{ width: 60, height: 60, mb: idx === 0 ? 1 : 0 }}
            />
          ))}
        </Box>
        {/* Info Rows (right) */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {infoRows.map((row, rowIdx) => (
            <Box
              key={rowIdx}
              sx={{ display: "flex", flexDirection: "row", mb: rowIdx === 0 ? 1 : 0 }}
            >
              {row.map((info, infoIdx) => (
                <Box key={infoIdx} sx={{ mr: 4 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {info.label}
                  </Typography>
                  <Typography variant="body2">{info.value}</Typography>
                </Box>
              ))}
            </Box>
          ))}
          {/* Company Details */}
          {companyDetails && (
            <Box sx={{ mt: 1, display: "flex", flexDirection: "row" }}>
              {companyDetails.store && (
                <Box sx={{ mr: 4 }}>
                  <Typography variant="caption" fontWeight="bold">
                    Store:
                  </Typography>
                  <Typography variant="caption">{companyDetails.store}</Typography>
                </Box>
              )}
              {companyDetails.headOffice && (
                <Box>
                  <Typography variant="caption" fontWeight="bold">
                    Head Office:
                  </Typography>
                  <Typography variant="caption">{companyDetails.headOffice}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ExportDocumentLayout;
