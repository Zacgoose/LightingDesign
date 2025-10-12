import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { enablePerformanceLogging, disablePerformanceLogging, isPerformanceLoggingEnabled } from "/src/utils/performanceLogger";

const DesignerViewToolbarControls = ({
  showGrid,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onResetView,
  zoomLevel,
  showLayers,
  onToggleLayers,
}) => {
  const [perfLogging, setPerfLogging] = useState(isPerformanceLoggingEnabled());
  
  const handleTogglePerfLogging = () => {
    if (perfLogging) {
      disablePerformanceLogging();
      setPerfLogging(false);
    } else {
      enablePerformanceLogging();
      setPerfLogging(true);
    }
  };

  return (
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
      <Button
        variant={perfLogging ? "contained" : "outlined"}
        size="small"
        onClick={handleTogglePerfLogging}
        color={perfLogging ? "warning" : "inherit"}
        title="Toggle Performance Logging (check console)"
      >
        Perf Log
      </Button>
    </Stack>
  );
};

export default DesignerViewToolbarControls;
