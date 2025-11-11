import React, { memo } from "react";
import { Circle, Line } from "react-konva";

export const MeasurementLayer = memo(
  ({
    measureMode,
    measurePoints,
    cursorPosition,
    theme,
    stagePosition,
    stageScale,
    onMeasurePointAdd,
  }) => {
    const handleClick = (e) => {
      if (!measureMode) return;
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = {
        x: (pointerPosition.x - stagePosition.x) / stageScale,
        y: (pointerPosition.y - stagePosition.y) / stageScale,
      };

      if (measurePoints.length < 2) {
        onMeasurePointAdd(canvasPos);
      }
    };

    if (!measureMode) return null;

    return (
      <>
        {/* Points */}
        {measurePoints.map((point, i) => (
          <Circle key={i} x={point.x} y={point.y} radius={4} fill={theme.palette.primary.main} />
        ))}

        {/* Line between points */}
        {measurePoints.length === 2 && (
          <Line
            points={[
              measurePoints[0].x,
              measurePoints[0].y,
              measurePoints[1].x,
              measurePoints[1].y,
            ]}
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}

        {/* Preview line to cursor */}
        {measurePoints.length === 1 && (
          <Line
            points={[measurePoints[0].x, measurePoints[0].y, cursorPosition.x, cursorPosition.y]}
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dash={[5, 5]}
            opacity={0.5}
          />
        )}
      </>
    );
  },
);

export default MeasurementLayer;
