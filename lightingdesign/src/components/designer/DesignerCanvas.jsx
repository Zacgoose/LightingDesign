import { Box, useTheme } from "@mui/material";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import { useState, useEffect, useMemo } from "react";
import { GridLayer } from "./GridLayer";

export const DesignerCanvas = ({
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
  onPan
}) => {
  const theme = useTheme();
  const [bgImage, setBgImage] = useState(null);

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

    if (typeof backgroundImage === 'string') {
      img.src = backgroundImage;
    } else if (backgroundImage instanceof window.Image) {
      setBgImage(backgroundImage);
    }
  }, [backgroundImage]);

  // Theme-aware colors
  const backgroundColor = theme.palette.mode === 'dark'
    ? theme.palette.background.default
    : '#f5f5f5';

  const gridColor = theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.5)'
    : 'rgba(0, 0, 0, 0.5)';

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
    if (e.evt.button === 1) { // Middle mouse
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
      if (typeof onPan === 'function') {
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
          scaleFactor={scaleFactor}
          backgroundImageNaturalSize={backgroundImageNaturalSize}
          imageScale={imageScale}
          gridColor={gridColor}
        />

        {/* Background Image Layer */}
        {bgImage && backgroundImageNaturalSize && (
          <Layer>
            <KonvaImage
              image={bgImage}
              x={-backgroundImageNaturalSize.width * imageScale / 2}
              y={-backgroundImageNaturalSize.height * imageScale / 2}
              width={backgroundImageNaturalSize.width * imageScale}
              height={backgroundImageNaturalSize.height * imageScale}
              opacity={0.7}
              listening={false}
            />
          </Layer>
        )}

        {/* Products and Connectors Layer */}
        <Layer>
          {children}
        </Layer>
      </Stage>
    </Box>
  );
};