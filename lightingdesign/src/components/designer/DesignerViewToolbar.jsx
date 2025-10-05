import { Card, CardContent, Button, Stack, Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ZoomIn, ZoomOut, Grid3x3, CenterFocusStrong, Straighten } from "@mui/icons-material";

export const DesignerViewToolbar = ({ 
  showGrid,
  onToggleGrid,
  showMeasurements,
  onToggleMeasurements,
  onZoomIn,
  onZoomOut,
  onResetView,
  zoomLevel
}) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* View Options */}
          <Button
            variant={showGrid ? "contained" : "outlined"}
            startIcon={<Grid3x3 />}
            size="small"
            onClick={onToggleGrid}
          >
            Grid
          </Button>

          <Button
            variant={showMeasurements ? "contained" : "outlined"}
            startIcon={<Straighten />}
            size="small"
            onClick={onToggleMeasurements}
          >
            Measurements
          </Button>

          {/* Spacer */}
          <Box sx={{ width: 16 }} />

          {/* Zoom Controls */}
          <Button
            variant="outlined"
            size="small"
            onClick={onZoomOut}
          >
            <ZoomOut />
          </Button>

          <Typography variant="body2" sx={{ minWidth: 60, textAlign: "center" }}>
            {Math.round(zoomLevel * 100)}%
          </Typography>

          <Button
            variant="outlined"
            size="small"
            onClick={onZoomIn}
          >
            <ZoomIn />
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={onResetView}
            startIcon={<CenterFocusStrong />}
          >
            Reset View
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};