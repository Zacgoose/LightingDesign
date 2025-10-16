import { 
  Card, 
  Box, 
  IconButton, 
  Button, 
  ToggleButtonGroup, 
  ToggleButton, 
  Typography 
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { 
  ExpandMore, 
  ExpandLess,
  Save, 
  Upload, 
  Download, 
  Undo, 
  Redo, 
  Straighten,
  NearMe, 
  PanTool, 
  Close, 
  Cable,
  ZoomIn,
  ZoomOut,
  TextFields
} from "@mui/icons-material";
import {
  enablePerformanceLogging,
  disablePerformanceLogging,
  isPerformanceLoggingEnabled,
} from "/src/utils/performanceLogger";

export const DesignerToolbarRow = ({ mainProps, toolsProps, viewProps }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCollapseButton, setShowCollapseButton] = useState(false);
  const [perfLogging, setPerfLogging] = useState(isPerformanceLoggingEnabled());
  const containerRef = useRef(null);

  useEffect(() => {
    const checkIfWrapped = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const children = Array.from(container.children);
      
      if (children.length < 2) {
        setShowCollapseButton(false);
        return;
      }

      // Check if any child wraps to a new line
      const firstTop = children[0].offsetTop;
      const hasWrapped = children.some(child => child.offsetTop > firstTop);
      
      setShowCollapseButton(hasWrapped);
    };

    // Initial check
    checkIfWrapped();

    // Check on resize
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkIfWrapped, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Delayed check for initial render
    const timer = setTimeout(checkIfWrapped, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      clearTimeout(resizeTimer);
    };
  }, []);

  const handleTogglePerfLogging = () => {
    if (perfLogging) {
      disablePerformanceLogging();
      setPerfLogging(false);
    } else {
      enablePerformanceLogging();
      setPerfLogging(true);
    }
  };

  // Extract props for easier access
  const {
    onUploadFloorPlan,
    onSave,
    onExport,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onMeasure,
  } = mainProps || {};

  const {
    selectedTool,
    onToolChange,
    placementMode,
    onStopPlacement,
    onDisconnectCable,
  } = toolsProps || {};

  const {
    showGrid,
    onToggleGrid,
    onZoomIn,
    onZoomOut,
    onResetView,
    zoomLevel,
    showLayers,
    onToggleLayers,
  } = viewProps || {};

  return (
    <Card sx={{ px: 1, py: 0, mb: 0 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <Box
          ref={containerRef}
          sx={{
            display: "flex",
            flexWrap: isExpanded ? "wrap" : "nowrap",
            overflow: isExpanded ? "visible" : "hidden",
            gap: 1,
            alignItems: "center",
            py: 0.5,
            flex: 1,
          }}
        >
          {/* Main Controls */}
          <Button variant="outlined" startIcon={<Upload />} size="small" onClick={onUploadFloorPlan}>
            Upload Floor Plan
          </Button>
          <Button variant="contained" startIcon={<Save />} size="small" onClick={onSave}>
            Save Project
          </Button>
          <Button variant="outlined" startIcon={<Download />} size="small" onClick={onExport}>
            Export
          </Button>
          <Button variant="outlined" size="small" onClick={onUndo} disabled={!canUndo}>
            <Undo />
          </Button>
          <Button variant="outlined" size="small" onClick={onRedo} disabled={!canRedo}>
            <Redo />
          </Button>
          <Button variant="outlined" startIcon={<Straighten />} size="small" onClick={onMeasure} minWidth={100}>
            Measure
          </Button>

          {/* Tools Controls */}
          {placementMode ? (
            <>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                Placing: {placementMode.template.name}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Close />}
                onClick={onStopPlacement}
                size="small"
              >
                Stop Placing (ESC)
              </Button>
            </>
          ) : (
            <>
              <ToggleButtonGroup
                value={selectedTool}
                exclusive
                onChange={(e, newTool) => {
                  if (newTool !== null) {
                    onToolChange(newTool);
                  }
                }}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    padding: "1px",
                    minWidth: "30px",
                    minHeight: "30px",
                  },
                }}
              >
                <ToggleButton value="select">
                  <NearMe fontSize="small" />
                </ToggleButton>
                <ToggleButton value="pan">
                  <PanTool fontSize="small" />
                </ToggleButton>
                <ToggleButton value="connect">
                  <Cable fontSize="small" />
                </ToggleButton>
                <ToggleButton value="text">
                  <TextFields fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
              {selectedTool === "connect" && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Cable />}
                  onClick={onDisconnectCable}
                  size="small"
                >
                  Disconnect Cable
                </Button>
              )}
            </>
          )}

          {/* View Controls */}
          <Button variant={showGrid ? "contained" : "outlined"} size="small" onClick={onToggleGrid}>
            Grid
          </Button>
          <Button variant={showLayers ? "contained" : "outlined"} size="small" onClick={onToggleLayers}>
            Layers
          </Button>
          {/* Group zoom controls together so they don't separate when wrapping */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexShrink: 0 }}>
            <IconButton size="small" onClick={onZoomOut}>
              <ZoomOut />
            </IconButton>
            <Typography variant="body2" sx={{ maxWidth: 35, minWidth: 35, textAlign: "center" }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton size="small" onClick={onZoomIn}>
              <ZoomIn />
            </IconButton>
          </Box>
          <Button variant="outlined" size="small" onClick={onResetView}>
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
        </Box>
        {showCollapseButton && (
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ ml: 1, my: 0.5, flexShrink: 0 }}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>
    </Card>
  );
};

export default DesignerToolbarRow;
