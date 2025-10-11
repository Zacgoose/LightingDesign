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
    
    // Safeguard: Prevent creating too many grid lines (max 200 lines in each direction)
    const maxLines = 200;
    const verticalLineCount = Math.ceil(gridWidth / scaledGridSize);
    const horizontalLineCount = Math.ceil(gridHeight / scaledGridSize);
    
    if (verticalLineCount > maxLines || horizontalLineCount > maxLines) {
      // Grid is too dense, skip rendering to prevent performance issues
      console.warn('Grid density too high, skipping grid render to prevent performance issues');
      return lines;
    }

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