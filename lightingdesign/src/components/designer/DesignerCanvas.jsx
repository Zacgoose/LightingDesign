import { Box, useTheme } from "@mui/material";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import { useState, useEffect, useMemo, useRef, memo } from "react";
import { GridLayer } from "./GridLayer";
import { usePerformanceMonitor, logRender } from "/src/utils/performanceLogger";

export const DesignerCanvas = memo(
  ({
    width = 4200,
    height = 2970,
    stageScale = 1,
    stagePosition,
    showGrid,
    gridSize = 100,
    scaleFactor = 100,
    onWheel,
    onDragEnd,
    onMouseDown,
    onTouchStart,
    onContextMenu,
    draggable = true,
    stageRef,
    backgroundImage = null,
    backgroundImageNaturalSize = null,
    children,
    onMouseMove,
    onPan,
  }) => {
    const theme = useTheme();
    const [bgImage, setBgImage] = useState(null);

    // Performance monitoring
    const renderCount = useRef(0);
    useEffect(() => {
      renderCount.current++;
      logRender("DesignerCanvas", {
        renderCount: renderCount.current,
        width,
        height,
        stageScale,
        showGrid,
        childrenCount: Array.isArray(children) ? children.length : children ? 1 : 0,
      });
    });

    // Load background image
    useEffect(() => {
      if (!backgroundImage) {
        setBgImage(null);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        console.log('Background image loaded successfully', {
          width: img.width,
          height: img.height,
          dataLength: backgroundImage?.length || 0
        });
        setBgImage(img);
      };
      
      img.onerror = (err) => {
        console.error('Failed to load background image:', err);
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
      theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";

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

    // Middle mouse down handler
    const handleStageMouseDown = (e) => {
      if (e.evt.button === 1) {
        // Middle mouse
        setIsMiddlePanning(true);
        setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
        e.evt.preventDefault();
      }
      if (onMouseDown) onMouseDown(e);
    };

    // Middle mouse up handler
    const handleStageMouseUp = (e) => {
      if (isMiddlePanning) {
        setIsMiddlePanning(false);
        setLastPanPos(null);
        e.evt.preventDefault();
      }
    };

    // Middle mouse move handler
    const handleStageMouseMove = (e) => {
      if (isMiddlePanning && lastPanPos) {
        const dx = e.evt.clientX - lastPanPos.x;
        const dy = e.evt.clientY - lastPanPos.y;
        if (typeof onPan === "function") {
          onPan(dx, dy);
        }
        setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
        e.evt.preventDefault();
      }
      if (onMouseMove) onMouseMove(e);
    };

    return (
      <Box
        sx={{
          width: "100%",
          height: height,
          overflow: "hidden",
          position: "relative",
          backgroundColor: backgroundColor,
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable={draggable}
          onWheel={onWheel}
          onDragEnd={onDragEnd}
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
            scaleFactor={scaleFactor * imageScale}
            backgroundImageNaturalSize={backgroundImageNaturalSize}
            imageScale={imageScale}
            gridColor={gridColor}
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
                opacity={0.7}
                listening={false}
              />
            </Layer>
          )}

          {/* Products and Connectors Layer */}
          <Layer>{children}</Layer>
        </Stage>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if these props actually change
    // Note: stagePosition and stageScale changes are handled by Konva internally
    // so we include them to ensure proper updates but the Stage component handles the actual rendering
    return (
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.stageScale === nextProps.stageScale &&
      prevProps.stagePosition.x === nextProps.stagePosition.x &&
      prevProps.stagePosition.y === nextProps.stagePosition.y &&
      prevProps.showGrid === nextProps.showGrid &&
      prevProps.gridSize === nextProps.gridSize &&
      prevProps.scaleFactor === nextProps.scaleFactor &&
      prevProps.draggable === nextProps.draggable &&
      prevProps.backgroundImage === nextProps.backgroundImage &&
      prevProps.backgroundImageNaturalSize === nextProps.backgroundImageNaturalSize &&
      prevProps.children === nextProps.children &&
      prevProps.onWheel === nextProps.onWheel &&
      prevProps.onDragEnd === nextProps.onDragEnd &&
      prevProps.onMouseDown === nextProps.onMouseDown &&
      prevProps.onTouchStart === nextProps.onTouchStart &&
      prevProps.onContextMenu === nextProps.onContextMenu &&
      prevProps.onMouseMove === nextProps.onMouseMove &&
      prevProps.onPan === nextProps.onPan
    );
  },
);
