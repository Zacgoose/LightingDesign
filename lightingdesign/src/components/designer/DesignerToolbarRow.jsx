import {
  Card,
  Box,
  IconButton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect, useRef, memo, useCallback } from "react";
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
  Refresh,
} from "@mui/icons-material";
import { DesignLockButton } from "/src/components/designer/DesignLockButton";

export const DesignerToolbarRow = memo(
  ({ mainProps, toolsProps, viewProps, alignProps }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showCollapseButton, setShowCollapseButton] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
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
      isLocked = false,
      isOwner = false,
      lockInfo = null,
      onLock,
      onUnlock,
      onRefreshLockStatus,
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
    const handleToggleButtonChange = useCallback(
      (e, newTool) => {
        if (newTool !== null) {
          onToolChange(newTool);
        }
      },
      [onToolChange],
    );
    
    const handleRefreshClick = useCallback(async () => {
      if (onRefreshLockStatus && !isRefreshing) {
        setIsRefreshing(true);
        await onRefreshLockStatus();
        setIsRefreshing(false);
      }
    }, [onRefreshLockStatus, isRefreshing]);

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
              startIcon={<Upload />}
              size="small"
              onClick={onUploadFloorPlan}
              disabled={!isOwner}
            >
              Upload Floor Plan
            </Button>
            <DesignLockButton
              isLocked={isLocked}
              isOwner={isOwner}
              lockInfo={lockInfo}
              onLock={onLock}
              onUnlock={onUnlock}
              onRefresh={onRefreshLockStatus}
              disabled={false}
            />
            {/* Only show refresh button when design is locked or there's an error */}
            {isLocked && (
              <IconButton
                size="small"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                color="primary"
                title="Check lock status"
              >
                {isRefreshing ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            )}
            <Button variant="contained" startIcon={<Save />} size="small" onClick={onSave} disabled={!isOwner}>
              Save Project
            </Button>
            <Button variant="outlined" startIcon={<Download />} size="small" onClick={onExport}>
              Export
            </Button>
            <Button variant="outlined" size="small" onClick={onUndo} disabled={!canUndo || !isOwner}>
              <Undo />
            </Button>
            <Button variant="outlined" size="small" onClick={onRedo} disabled={!canRedo || !isOwner}>
              <Redo />
            </Button>
            <Button
              variant="outlined"
              startIcon={<Straighten />}
              size="small"
              onClick={onMeasure}
              minWidth={100}
              disabled={!isOwner}
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
                  sx={{ transform: "rotate(270deg)" }}
                >
                  <VerticalAlignTop />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onAlignHorizontalCenter}
                  title="Align Horizontal Centers"
                  sx={{ transform: "rotate(90deg)" }}
                >
                  <VerticalAlignCenter />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onAlignRight}
                  title="Align Right"
                  sx={{ transform: "rotate(90deg)" }}
                >
                  <VerticalAlignTop />
                </IconButton>
                <IconButton size="small" onClick={onAlignTop} title="Align Top">
                  <VerticalAlignTop />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onAlignVerticalCenter}
                  title="Align Vertical Centers"
                >
                  <VerticalAlignCenter />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onAlignBottom}
                  title="Align Bottom"
                  sx={{ transform: "rotate(180deg)" }}
                >
                  <VerticalAlignTop />
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
                  <MultipleStop />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onEvenSpacingVertical}
                  title="Even Spacing Vertical"
                  sx={{ transform: "rotate(90deg)" }}
                >
                  <MultipleStop />
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
                  onChange={handleToggleButtonChange}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      padding: "1px",
                      minWidth: "30px",
                      minHeight: "30px",
                    },
                  }}
                >
                  {/* Only show select/connect/text tools when user owns the lock */}
                  {isOwner && (
                    <ToggleButton value="select">
                      <NearMe fontSize="small" />
                    </ToggleButton>
                  )}
                  <ToggleButton value="pan">
                    <PanTool fontSize="small" />
                  </ToggleButton>
                  {isOwner && (
                    <>
                      <ToggleButton value="connect">
                        <Cable fontSize="small" />
                      </ToggleButton>
                      <ToggleButton value="text">
                        <TextFields fontSize="small" />
                      </ToggleButton>
                    </>
                  )}
                </ToggleButtonGroup>
                {selectedTool === "connect" && isOwner && (
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
              variant={showPreview ? "contained" : "outlined"}
              size="small"
              onClick={onTogglePreview}
            >
              Preview
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
          </Box>
          {showCollapseButton && (
            <IconButton
              size="small"
              onClick={handleToggleExpand}
              sx={{ ml: 1, my: 0.5, flexShrink: 0 }}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    // Only re-render if values that affect the UI actually change

    // Compare mainProps
    if (prevProps.mainProps !== nextProps.mainProps) {
      const prev = prevProps.mainProps || {};
      const next = nextProps.mainProps || {};
      if (
        prev.canUndo !== next.canUndo ||
        prev.canRedo !== next.canRedo ||
        prev.isLocked !== next.isLocked ||
        prev.isOwner !== next.isOwner
      ) {
        return false; // Props changed, should re-render
      }
    }

    // Compare toolsProps
    if (prevProps.toolsProps !== nextProps.toolsProps) {
      const prev = prevProps.toolsProps || {};
      const next = nextProps.toolsProps || {};
      if (prev.selectedTool !== next.selectedTool || prev.placementMode !== next.placementMode) {
        return false; // Props changed, should re-render
      }
    }

    // Compare viewProps
    if (prevProps.viewProps !== nextProps.viewProps) {
      const prev = prevProps.viewProps || {};
      const next = nextProps.viewProps || {};
      if (
        prev.showGrid !== next.showGrid ||
        prev.showLayers !== next.showLayers ||
        prev.showPreview !== next.showPreview ||
        Math.abs(prev.zoomLevel - next.zoomLevel) > 0.01
      ) {
        return false; // Props changed, should re-render
      }
    }

    // Compare alignProps
    if (prevProps.alignProps !== nextProps.alignProps) {
      const prev = prevProps.alignProps || {};
      const next = nextProps.alignProps || {};
      if (prev.selectedCount !== next.selectedCount) {
        return false; // Props changed, should re-render
      }
    }

    return true; // Props are effectively the same, skip re-render
  },
);

DesignerToolbarRow.displayName = "DesignerToolbarRow";

export default DesignerToolbarRow;
