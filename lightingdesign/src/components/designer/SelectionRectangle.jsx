import { Rect } from "react-konva";
import { memo } from "react";

export const SelectionRectangle = memo(({ selectionRect }) => {
  if (!selectionRect) return null;

  const { x1, y1, x2, y2 } = selectionRect;
  const width = x2 - x1;
  const height = y2 - y1;

  return (
    <Rect
      x={x1}
      y={y1}
      width={width}
      height={height}
      fill="rgba(33, 150, 243, 0.1)"
      stroke="#2196f3"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
});

export default SelectionRectangle;
