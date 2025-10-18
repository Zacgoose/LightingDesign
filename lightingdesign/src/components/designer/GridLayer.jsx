import React, { useMemo } from "react";
import { Layer, Line } from "react-konva";

/**
 * Optimized grid layer component with memoization to prevent unnecessary re-renders
 * Only regenerates grid when dimensions, scale, or visibility changes
 */
export const GridLayer = React.memo(
  ({
    visible = true,
    width = 4200,
    height = 2970,
    gridSize = 100,
    scaleFactor = 100,
    backgroundImageNaturalSize = null,
    imageScale = 1,
    gridColor = "rgba(0, 0, 0, 0.5)",
    strokeWidth = 0.5,
    opacity = 0.5,
  }) => {
    // Generate grid lines with memoization for performance
    const gridLines = useMemo(() => {
      if (!visible) return [];

      const lines = [];
      let gridWidth = width;
      let gridHeight = height;
      let offsetX = -width / 2;
      let offsetY = -height / 2;

      // Adjust grid to match background image if present
      if (backgroundImageNaturalSize) {
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
        console.warn("Grid density too high, skipping grid render to prevent performance issues");
        return lines;
      }

      // Vertical lines
      for (let x = offsetX; x <= offsetX + gridWidth; x += scaledGridSize) {
        lines.push({
          key: `v-${x}`,
          points: [x, offsetY, x, offsetY + gridHeight],
        });
      }

      // Horizontal lines
      for (let y = offsetY; y <= offsetY + gridHeight; y += scaledGridSize) {
        lines.push({
          key: `h-${y}`,
          points: [offsetX, y, offsetX + gridWidth, y],
        });
      }

      return lines;
    }, [visible, width, height, gridSize, scaleFactor, backgroundImageNaturalSize, imageScale]);

    if (!visible || gridLines.length === 0) {
      return null;
    }

    return (
      <Layer listening={false}>
        {gridLines.map((line) => (
          <Line
            key={line.key}
            points={line.points}
            stroke={gridColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            listening={false}
            perfectDrawEnabled={false}
          />
        ))}
      </Layer>
    );
  },
);

GridLayer.displayName = "GridLayer";

export default GridLayer;
