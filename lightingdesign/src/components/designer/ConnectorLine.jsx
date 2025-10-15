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

  // Initialize 3 control points for cubic Bézier curve
  // Control points positioned to create a natural curve
  const defaultControl1X = fromProduct.x + (toProduct.x - fromProduct.x) * 0.25;
  const defaultControl1Y = Math.min(fromProduct.y, toProduct.y) - 60;
  const defaultControl2X = fromProduct.x + (toProduct.x - fromProduct.x) * 0.5;
  const defaultControl2Y = Math.min(fromProduct.y, toProduct.y) - 80;
  const defaultControl3X = fromProduct.x + (toProduct.x - fromProduct.x) * 0.75;
  const defaultControl3Y = Math.min(fromProduct.y, toProduct.y) - 60;

  const control1 = connector.control1 ?? { x: defaultControl1X, y: defaultControl1Y };
  const control2 = connector.control2 ?? { x: defaultControl2X, y: defaultControl2Y };
  const control3 = connector.control3 ?? { x: defaultControl3X, y: defaultControl3Y };

  // Handle control point drag
  const handleControlDrag = (controlName, e) => {
    onChange({
      ...connector,
      [controlName]: { x: e.target.x(), y: e.target.y() },
    });
  };

  // Calculate if mouse is near the curve
  const handleLineClick = (e) => {
    e.cancelBubble = true;
    onSelect(e, connector.id);
  };

  return (
    <Group>
      {/* The curved line using cubic Bézier with 3 control points */}
      <Shape
        id={connector.id}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(fromProduct.x, fromProduct.y);
          // Draw smooth curve through 3 control points
          // Use two cubic Bézier curves to pass through all 3 control points
          const midX = (control1.x + control2.x) / 2;
          const midY = (control1.y + control2.y) / 2;
          const mid2X = (control2.x + control3.x) / 2;
          const mid2Y = (control2.y + control3.y) / 2;

          ctx.bezierCurveTo(control1.x, control1.y, midX, midY, control2.x, control2.y);
          ctx.bezierCurveTo(mid2X, mid2Y, control3.x, control3.y, toProduct.x, toProduct.y);
          ctx.fillStrokeShape(shape);
        }}
        stroke={
          connector.color ||
          (isSelected ? theme.palette.secondary.main : theme.palette.primary.main)
        }
        strokeWidth={isSelected ? 3 : 2}
        lineCap="round"
        hitStrokeWidth={20} // Makes it easier to click
        onClick={handleLineClick}
        onTap={handleLineClick}
        onContextMenu={onContextMenu}
      />

      {/* Show control points and guide lines when selected */}
      {isSelected && selectedTool === "select" && (
        <>
          {/* Guide lines to control points */}
          <Line
            points={[fromProduct.x, fromProduct.y, control1.x, control1.y]}
            stroke={theme.palette.action.disabled}
            strokeWidth={1}
            dash={[3, 3]}
            listening={false}
          />
          <Line
            points={[control1.x, control1.y, control2.x, control2.y]}
            stroke={theme.palette.action.disabled}
            strokeWidth={1}
            dash={[3, 3]}
            listening={false}
          />
          <Line
            points={[control2.x, control2.y, control3.x, control3.y]}
            stroke={theme.palette.action.disabled}
            strokeWidth={1}
            dash={[3, 3]}
            listening={false}
          />
          <Line
            points={[control3.x, control3.y, toProduct.x, toProduct.y]}
            stroke={theme.palette.action.disabled}
            strokeWidth={1}
            dash={[3, 3]}
            listening={false}
          />

          {/* Draggable control points */}
          <Circle
            x={control1.x}
            y={control1.y}
            radius={7}
            fill={theme.palette.info.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleControlDrag("control1", e);
            }}
            onDragMove={(e) => handleControlDrag("control1", e)}
          />
          <Circle
            x={control2.x}
            y={control2.y}
            radius={8}
            fill={theme.palette.secondary.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleControlDrag("control2", e);
            }}
            onDragMove={(e) => handleControlDrag("control2", e)}
          />
          <Circle
            x={control3.x}
            y={control3.y}
            radius={7}
            fill={theme.palette.info.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleControlDrag("control3", e);
            }}
            onDragMove={(e) => handleControlDrag("control3", e)}
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
