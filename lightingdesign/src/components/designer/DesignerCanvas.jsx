import { Box, useTheme } from "@mui/material";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import { useState, useEffect, memo, forwardRef } from "react";
import { GridLayer } from "./GridLayer";

export const DesignerCanvas = memo(
  forwardRef(
    (
      {
        width = 4200,
        height = 2970,
        viewportWidth, // Optional: actual visible viewport width (overrides width for Stage)
        viewportHeight, // Optional: actual visible viewport height (overrides height for Stage)
        stageScale = 1,
        stagePosition,
        showGrid,
        gridSize = 100,
        scaleFactor = 100,
        onWheel,
        onDragStart,
        onDragEnd,
        onMouseDown,
        onMouseUp,
        onTouchStart,
        onContextMenu,
        draggable = true,
        backgroundImage = null,
        backgroundImageNaturalSize = null,
        children, // Kept for backward compatibility, but prefer layer-specific props
        objectsChildren, // Layer 1: Connectors and unselected products
        textAndSelectionChildren, // Layer 2: Text boxes and selection group
        transformerChildren, // Layer 3: Transformer (always on top)
        onMouseMove,
        onPan,
        gridOpacity,
        backgroundOpacity,
        onMiddlePanningChange, // Callback to notify parent of middle mouse panning state
        onStageDraggingChange, // Callback to notify parent of stage dragging state
      },
      ref,
    ) => {
      const theme = useTheme();
      const [bgImage, setBgImage] = useState(null);

      // Use viewport dimensions for Stage if provided, otherwise use virtual canvas dimensions
      const stageWidth = viewportWidth || width;
      const stageHeight = viewportHeight || height;

      // Load background image
      useEffect(() => {
        if (!backgroundImage) {
          setBgImage(null);
          return;
        }

        const img = new window.Image();
        img.onload = () => {
          setBgImage(img);
        };

        img.onerror = (err) => {
          console.error("Failed to load background image:", err);
          setBgImage(null);
        };

        if (typeof backgroundImage === "string") {
          img.src = backgroundImage;
        } else if (backgroundImage instanceof window.Image) {
          setBgImage(backgroundImage);
        }
      }, [backgroundImage]);

      // Theme-aware colors
      const backgroundColor =
        theme.palette.mode === "dark" ? theme.palette.background.default : "#f5f5f5";

      const gridColor =
        theme.palette.mode === "dark" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)";

      // Calculate image scale to fit canvas
      const getImageScale = () => {
        if (!bgImage || !backgroundImageNaturalSize) return 1;
        const scaleX = width / backgroundImageNaturalSize.width;
        const scaleY = height / backgroundImageNaturalSize.height;
        return Math.min(scaleX, scaleY);
      };

      const imageScale = getImageScale();

      // Middle mouse panning state
      const [isMiddlePanning, setIsMiddlePanning] = useState(false);
      const [lastPanPos, setLastPanPos] = useState(null);
      const panStartPosRef = useState({ x: 0, y: 0 })[0];

      // Stage dragging handlers
      const handleStageDragStart = (e) => {
        if (onStageDraggingChange) onStageDraggingChange(true);
        if (onDragStart) onDragStart(e);
      };

      const handleStageDragEnd = (e) => {
        if (onStageDraggingChange) onStageDraggingChange(false);
        if (onDragEnd) onDragEnd(e);
      };

      // Middle mouse down handler
      const handleStageMouseDown = (e) => {
        if (e.evt.button === 1) {
          // Middle mouse
          setIsMiddlePanning(true);
          if (onMiddlePanningChange) onMiddlePanningChange(true);
          setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
          // Store initial stage position
          const stage = e.target.getStage();
          panStartPosRef.x = stage.x();
          panStartPosRef.y = stage.y();
          e.evt.preventDefault();
        }
        if (onMouseDown) onMouseDown(e);
      };

      // Middle mouse up handler
      const handleStageMouseUp = (e) => {
        if (isMiddlePanning) {
          setIsMiddlePanning(false);
          if (onMiddlePanningChange) onMiddlePanningChange(false);
          setLastPanPos(null);
          // Update state with final position when pan ends
          const stage = e.target.getStage();
          if (typeof onPan === "function") {
            const finalDx = stage.x() - panStartPosRef.x;
            const finalDy = stage.y() - panStartPosRef.y;
            onPan(finalDx, finalDy);
          }
          e.evt.preventDefault();
        }
        if (onMouseUp) onMouseUp(e);
      };

      // Middle mouse move handler
      const handleStageMouseMove = (e) => {
        if (isMiddlePanning && lastPanPos) {
          const dx = e.evt.clientX - lastPanPos.x;
          const dy = e.evt.clientY - lastPanPos.y;

          // Apply pan directly to stage for immediate visual feedback
          const stage = e.target.getStage();
          const currentPos = stage.position();
          stage.position({
            x: currentPos.x + dx,
            y: currentPos.y + dy,
          });
          stage.batchDraw();

          setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
          e.evt.preventDefault();
        }
        if (onMouseMove) onMouseMove(e);
      };

      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            position: "relative",
            backgroundColor: backgroundColor,
          }}
        >
          <Stage
            ref={ref}
            width={stageWidth}
            height={stageHeight}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            draggable={draggable}
            onWheel={onWheel}
            onDragStart={handleStageDragStart}
            onDragEnd={handleStageDragEnd}
            onMouseDown={handleStageMouseDown}
            onMouseUp={handleStageMouseUp}
            onTouchStart={onTouchStart}
            onContextMenu={onContextMenu}
            onMouseMove={handleStageMouseMove}
          >
            {/* Grid Layer - Optimized with memoization */}
            <GridLayer
              visible={showGrid}
              width={width}
              height={height}
              gridSize={gridSize}
              scaleFactor={scaleFactor}
              backgroundImageNaturalSize={backgroundImageNaturalSize}
              imageScale={imageScale}
              gridColor={gridColor}
              opacity={gridOpacity !== undefined ? gridOpacity / 100 : 0.5}
            />

            {/* Background Image Layer */}
            {bgImage && backgroundImageNaturalSize && (
              <Layer>
                <KonvaImage
                  image={bgImage}
                  x={(-backgroundImageNaturalSize.width * imageScale) / 2}
                  y={(-backgroundImageNaturalSize.height * imageScale) / 2}
                  width={backgroundImageNaturalSize.width * imageScale}
                  height={backgroundImageNaturalSize.height * imageScale}
                  opacity={backgroundOpacity !== undefined ? backgroundOpacity / 100 : 0.7}
                  listening={false}
                />
              </Layer>
            )}

            {/* Layer 1: Objects (Connectors and unselected products) */}
            {objectsChildren && <Layer>{objectsChildren}</Layer>}

            {/* Layer 2: Text and Selection (Text boxes and selection group) */}
            {textAndSelectionChildren && <Layer>{textAndSelectionChildren}</Layer>}

            {/* Layer 3: Transformer (Always on top) */}
            {transformerChildren && <Layer>{transformerChildren}</Layer>}

            {/* Fallback: Legacy single layer support for backward compatibility */}
            {!objectsChildren && !textAndSelectionChildren && !transformerChildren && children && (
              <Layer>{children}</Layer>
            )}
          </Stage>
        </Box>
      );
    },
  ),
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if these props actually change
    // Note: We don't compare callbacks (onWheel, onDragEnd, etc.) because they may have
    // new references due to useCallback dependencies, but Konva handles them correctly.
    // IMPORTANT: We ignore stagePosition changes to prevent re-renders during panning
    // The Stage component will update its internal position through the x/y props,
    // but we don't need to re-render the entire component tree for pan operations
    return (
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.viewportWidth === nextProps.viewportWidth &&
      prevProps.viewportHeight === nextProps.viewportHeight &&
      prevProps.stageScale === nextProps.stageScale &&
      // Removed stagePosition comparison - panning updates Stage directly without re-render
      prevProps.showGrid === nextProps.showGrid &&
      prevProps.gridSize === nextProps.gridSize &&
      prevProps.scaleFactor === nextProps.scaleFactor &&
      prevProps.draggable === nextProps.draggable &&
      prevProps.backgroundImage === nextProps.backgroundImage &&
      prevProps.backgroundImageNaturalSize === nextProps.backgroundImageNaturalSize &&
      prevProps.children === nextProps.children &&
      prevProps.objectsChildren === nextProps.objectsChildren &&
      prevProps.textAndSelectionChildren === nextProps.textAndSelectionChildren &&
      prevProps.transformerChildren === nextProps.transformerChildren &&
      prevProps.gridOpacity === nextProps.gridOpacity &&
      prevProps.backgroundOpacity === nextProps.backgroundOpacity
    );
  },
);

DesignerCanvas.displayName = "DesignerCanvas";
