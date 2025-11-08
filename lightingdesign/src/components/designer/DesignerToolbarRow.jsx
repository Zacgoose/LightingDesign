import {
  Card,
  Box,
  IconButton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
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
  TextFields,
  VerticalAlignCenter,
  VerticalAlignTop,
  MultipleStop,
} from "@mui/icons-material";

export const DesignerToolbarRow = memo(({ mainProps, toolsProps, viewProps, alignProps }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCollapseButton, setShowCollapseButton] = useState(false);
  const containerRef = useRef(null);

  // Memoize stable sx objects to prevent button re-renders
  const rotate270Sx = useMemo(() => ({ transform: 'rotate(270deg)' }), []);
  const rotate90Sx = useMemo(() => ({ transform: 'rotate(90deg)' }), []);
  const rotate180Sx = useMemo(() => ({ transform: 'rotate(180deg)' }), []);
  const toggleButtonSx = useMemo(() => ({
    "& .MuiToggleButton-root": {
      padding: "1px",
      minWidth: "30px",
      minHeight: "30px",
    },
  }), []);
  const zoomBoxSx = useMemo(() => ({ display: "flex", gap: 1, alignItems: "center", flexShrink: 0 }), []);
  const zoomLevelSx = useMemo(() => ({ maxWidth: 35, minWidth: 35, textAlign: "center" }), []);
  const collapseButtonSx = useMemo(() => ({ ml: 1, my: 0.5, flexShrink: 0 }), []);

  // Memoize icon components to prevent button re-renders
  const uploadIcon = useMemo(() => <Upload />, []);
  const saveIcon = useMemo(() => <Save />, []);
  const downloadIcon = useMemo(() => <Download />, []);
  const undoIcon = useMemo(() => <Undo />, []);
  const redoIcon = useMemo(() => <Redo />, []);
  const straightenIcon = useMemo(() => <Straighten />, []);
  const closeIcon = useMemo(() => <Close />, []);
  const cableIcon = useMemo(() => <Cable />, []);
  const zoomInIcon = useMemo(() => <ZoomIn />, []);
  const zoomOutIcon = useMemo(() => <ZoomOut />, []);
  const expandMoreIcon = useMemo(() => <ExpandMore />, []);
  const expandLessIcon = useMemo(() => <ExpandLess />, []);
  const nearMeIcon = useMemo(() => <NearMe fontSize="small" />, []);
  const panToolIcon = useMemo(() => <PanTool fontSize="small" />, []);
  const textFieldsIcon = useMemo(() => <TextFields fontSize="small" />, []);
  const verticalAlignTopIcon = useMemo(() => <VerticalAlignTop />, []);
  const verticalAlignCenterIcon = useMemo(() => <VerticalAlignCenter />, []);
  const multipleStopIcon = useMemo(() => <MultipleStop />, []);

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
      const hasWrapped = children.some((child) => child.offsetTop > firstTop);

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

    window.addEventListener("resize", handleResize);

    // Delayed check for initial render
    const timer = setTimeout(checkIfWrapped, 200);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      clearTimeout(resizeTimer);
    };
  }, []);

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

  const { selectedTool, onToolChange, placementMode, onStopPlacement, onDisconnectCable } =
    toolsProps || {};

  const {
    showGrid,
    onToggleGrid,
    onZoomIn,
    onZoomOut,
    onResetView,
    zoomLevel,
    showLayers,
    onToggleLayers,
    showPreview,
    onTogglePreview,
  } = viewProps || {};

  const {
    selectedCount = 0,
    onAlignHorizontalCenter,
    onAlignVerticalCenter,
    onAlignLeft,
    onAlignRight,
    onAlignTop,
    onAlignBottom,
    onEvenSpacingHorizontal,
    onEvenSpacingVertical,
  } = alignProps || {};

  // Memoize callbacks to prevent button re-renders
  const handleToggleExpand = useCallback(() => setIsExpanded(!isExpanded), [isExpanded]);
  const handleToggleButtonChange = useCallback((e, newTool) => {
    if (newTool !== null) {
      onToolChange(newTool);
    }
  }, [onToolChange]);

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
          <Button
            variant="outlined"
            startIcon={uploadIcon}
            size="small"
            onClick={onUploadFloorPlan}
          >
            Upload Floor Plan
          </Button>
          <Button variant="contained" startIcon={saveIcon} size="small" onClick={onSave}>
            Save Project
          </Button>
          <Button variant="outlined" startIcon={downloadIcon} size="small" onClick={onExport}>
            Export
          </Button>
          <Button variant="outlined" size="small" onClick={onUndo} disabled={!canUndo}>
            {undoIcon}
          </Button>
          <Button variant="outlined" size="small" onClick={onRedo} disabled={!canRedo}>
            {redoIcon}
          </Button>
          <Button
            variant="outlined"
            startIcon={straightenIcon}
            size="small"
            onClick={onMeasure}
            minWidth={100}
          >
            Measure
          </Button>
          
          {/* Alignment Controls - only show when multiple objects selected */}
          {selectedCount > 1 && (
            <>
              <IconButton
                size="small"
                onClick={onAlignLeft}
                title="Align Left"
                sx={rotate270Sx}
              >
                {verticalAlignTopIcon}
              </IconButton>
              <IconButton
                size="small"
                onClick={onAlignHorizontalCenter}
                title="Align Horizontal Centers"
                sx={rotate90Sx}
              >
                {verticalAlignCenterIcon}
              </IconButton>
              <IconButton
                size="small"
                onClick={onAlignRight}
                title="Align Right"
                sx={rotate90Sx}
              >
                {verticalAlignTopIcon}
              </IconButton>
              <IconButton
                size="small"
                onClick={onAlignTop}
                title="Align Top"
              >
                {verticalAlignTopIcon}
              </IconButton>
              <IconButton
                size="small"
                onClick={onAlignVerticalCenter}
                title="Align Vertical Centers"
              >
                {verticalAlignCenterIcon}
              </IconButton>
              <IconButton
                size="small"
                onClick={onAlignBottom}
                title="Align Bottom"
                sx={rotate180Sx}
              >
                {verticalAlignTopIcon}
              </IconButton>
            </>
          )}
          
          {/* Even Spacing Controls - only show when 3 or more objects selected */}
          {selectedCount > 2 && (
            <>
              <IconButton
                size="small"
                onClick={onEvenSpacingHorizontal}
                title="Even Spacing Horizontal"
              >
                {multipleStopIcon}
              </IconButton>
              <IconButton
                size="small"
                onClick={onEvenSpacingVertical}
                title="Even Spacing Vertical"
                sx={rotate90Sx}
              >
                {multipleStopIcon}
              </IconButton>
            </>
          )}

          {/* Tools Controls */}
          {placementMode ? (
            <>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                Placing: {placementMode.template.name}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={closeIcon}
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
                onChange={handleToggleButtonChange}
                size="small"
                sx={toggleButtonSx}
              >
                <ToggleButton value="select">
                  {nearMeIcon}
                </ToggleButton>
                <ToggleButton value="pan">
                  {panToolIcon}
                </ToggleButton>
                <ToggleButton value="connect">
                  {cableIcon}
                </ToggleButton>
                <ToggleButton value="text">
                  {textFieldsIcon}
                </ToggleButton>
              </ToggleButtonGroup>
              {selectedTool === "connect" && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={cableIcon}
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
          <Button
            variant={showLayers ? "contained" : "outlined"}
            size="small"
            onClick={onToggleLayers}
          >
            Layers
          </Button>
          <Button
            variant={showPreview ? "contained" : "outlined"}
            size="small"
            onClick={onTogglePreview}
          >
            Preview
          </Button>
          {/* Group zoom controls together so they don't separate when wrapping */}
          <Box sx={zoomBoxSx}>
            <IconButton size="small" onClick={onZoomOut}>
              {zoomOutIcon}
            </IconButton>
            <Typography variant="body2" sx={zoomLevelSx}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton size="small" onClick={onZoomIn}>
              {zoomInIcon}
            </IconButton>
          </Box>
          <Button variant="outlined" size="small" onClick={onResetView}>
            Reset
          </Button>
        </Box>
        {showCollapseButton && (
          <IconButton
            size="small"
            onClick={handleToggleExpand}
            sx={collapseButtonSx}
          >
            {isExpanded ? expandLessIcon : expandMoreIcon}
          </IconButton>
        )}
      </Box>
    </Card>
  );
});

DesignerToolbarRow.displayName = "DesignerToolbarRow";

export default DesignerToolbarRow;
