import { Button, Stack, Typography } from "@mui/material";

const DesignerViewToolbarControls = ({
  showGrid,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onResetView,
  zoomLevel,
  showLayers,
  onToggleLayers,
}) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Button
      variant={showGrid ? "contained" : "outlined"}
      size="small"
      onClick={onToggleGrid}
    >
      Grid
    </Button>
    <Button
      variant={showLayers ? "contained" : "outlined"}
      size="small"
      onClick={onToggleLayers}
    >
      Layers
    </Button>
    <Button
      variant="outlined"
      size="small"
      onClick={onZoomOut}
    >
      -
    </Button>
    <Typography variant="body2" sx={{ maxWidth: 35, minWidth: 35, textAlign: "center" }}>
      {Math.round(zoomLevel * 100)}%
    </Typography>
    <Button
      variant="outlined"
      size="small"
      onClick={onZoomIn}
    >
      +
    </Button>
    <Button
      variant="outlined"
      size="small"
      onClick={onResetView}
    >
      Reset
    </Button>
  </Stack>
);

export default DesignerViewToolbarControls;
