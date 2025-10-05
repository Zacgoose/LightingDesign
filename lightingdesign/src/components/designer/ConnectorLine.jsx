import { Group, Shape, Circle, Line } from "react-konva";
import { useState } from "react";

export const ConnectorLine = ({
  connector,
  fromProduct,
  toProduct,
  isSelected,
  onSelect,
  onChange,
  onContextMenu,
  theme,
  selectedTool,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Default control point if not set
  const defaultControlX = (fromProduct.x + toProduct.x) / 2;
  const defaultControlY = Math.min(fromProduct.y, toProduct.y) - 80;
  
  const controlX = connector.controlX ?? defaultControlX;
  const controlY = connector.controlY ?? defaultControlY;

  const handleControlDrag = (e) => {
    onChange({
      ...connector,
      controlX: e.target.x(),
      controlY: e.target.y(),
    });
  };

  // Calculate if mouse is near the curve
  const handleLineClick = (e) => {
    e.cancelBubble = true;
    onSelect(e);
  };

  return (
    <Group>
      {/* The curved line */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(fromProduct.x, fromProduct.y);
          ctx.quadraticCurveTo(
            controlX,
            controlY,
            toProduct.x,
            toProduct.y
          );
          ctx.fillStrokeShape(shape);
        }}
        stroke={connector.color || (isSelected ? theme.palette.secondary.main : theme.palette.primary.main)}
        strokeWidth={isSelected ? 3 : 2}
        lineCap="round"
        hitStrokeWidth={20} // Makes it easier to click
        onClick={handleLineClick}
        onTap={handleLineClick}
        onContextMenu={onContextMenu}
      />

      {/* Show control point and guide lines when selected */}
      {isSelected && selectedTool === "select" && (
        <>
          {/* Guide line from start to control point */}
          <Line
            points={[fromProduct.x, fromProduct.y, controlX, controlY]}
            stroke={theme.palette.action.disabled}
            strokeWidth={1}
            dash={[5, 5]}
            listening={false}
          />
          
          {/* Guide line from control point to end */}
          <Line
            points={[controlX, controlY, toProduct.x, toProduct.y]}
            stroke={theme.palette.action.disabled}
            strokeWidth={1}
            dash={[5, 5]}
            listening={false}
          />
          
          {/* Draggable control point */}
          <Circle
            x={controlX}
            y={controlY}
            radius={8}
            fill={theme.palette.secondary.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleControlDrag(e);
            }}
            onDragMove={handleControlDrag}
          />
          
          {/* Start point indicator */}
          <Circle
            x={fromProduct.x}
            y={fromProduct.y}
            radius={5}
            fill={theme.palette.success.main}
            listening={false}
          />
          
          {/* End point indicator */}
          <Circle
            x={toProduct.x}
            y={toProduct.y}
            radius={5}
            fill={theme.palette.error.main}
            listening={false}
          />
        </>
      )}
    </Group>
  );
};