import { Box, useTheme } from "@mui/material";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import { useState, useEffect } from "react";

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
  onMouseMove
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

  // Generate grid lines to match scaled image bounds if image is present
  const generateGrid = () => {
    const lines = [];
    let gridWidth = width;
    let gridHeight = height;
    let offsetX = -width / 2;
    let offsetY = -height / 2;

    if (bgImage && backgroundImageNaturalSize) {
      gridWidth = backgroundImageNaturalSize.width * imageScale;
      gridHeight = backgroundImageNaturalSize.height * imageScale;
      offsetX = -gridWidth / 2;
      offsetY = -gridHeight / 2;
    }

    const scaledGridSize = scaleFactor > 0 ? scaleFactor : gridSize;

    // Vertical lines
    for (let x = offsetX; x <= offsetX + gridWidth; x += scaledGridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, offsetY, x, offsetY + gridHeight]}
          stroke={gridColor}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = offsetY; y <= offsetY + gridHeight; y += scaledGridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[offsetX, y, offsetX + gridWidth, y]}
          stroke={gridColor}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    return lines;
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
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onContextMenu={onContextMenu}
        onMouseMove={onMouseMove}
      >
        {/* Grid Layer */}
        {showGrid && (
          <Layer>
            {generateGrid()}
          </Layer>
        )}

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