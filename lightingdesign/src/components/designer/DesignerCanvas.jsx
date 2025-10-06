import { Box, useTheme } from "@mui/material";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import { useState, useEffect } from "react";

export const DesignerCanvas = ({
  width,
  height,
  stageScale,
  stagePosition,
  showGrid,
  gridSize = 20,
  onWheel,
  onDragEnd,
  onMouseDown,
  onTouchStart,
  onContextMenu,
  draggable = true,
  stageRef,
  backgroundImage = null, // URL or Image object
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
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)';
  
  const indicatorBg = theme.palette.mode === 'dark'
    ? theme.palette.background.paper
    : 'white';
  
  const indicatorColor = theme.palette.mode === 'dark'
    ? theme.palette.text.primary
    : theme.palette.text.primary;

  // Generate grid lines
  const generateGrid = () => {
    const lines = [];
    const gridWidth = width * 2;
    const gridHeight = height * 2;
    
    const startX = -gridWidth / 2;
    const endX = gridWidth / 2;
    const startY = -gridHeight / 2;
    const endY = gridHeight / 2;

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke={gridColor}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
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
        {bgImage && (
          <Layer>
            <KonvaImage
              image={bgImage}
              x={-bgImage.width / 2}
              y={-bgImage.height / 2}
              opacity={0.5}
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