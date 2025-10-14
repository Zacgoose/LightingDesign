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

  // Calculate a point on the quadratic Bezier curve at parameter t
  // B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
  const getPointOnCurve = (t) => {
    const t1 = 1 - t;
    const x = t1 * t1 * fromProduct.x + 2 * t1 * t * controlX + t * t * toProduct.x;
    const y = t1 * t1 * fromProduct.y + 2 * t1 * t * controlY + t * t * toProduct.y;
    return { x, y };
  };

  // Calculate the derivative (tangent) at parameter t for curve adjustment
  const getTangentAtPoint = (t) => {
    const t1 = 1 - t;
    const dx = 2 * t1 * (controlX - fromProduct.x) + 2 * t * (toProduct.x - controlX);
    const dy = 2 * t1 * (controlY - fromProduct.y) + 2 * t * (toProduct.y - controlY);
    return { dx, dy };
  };

  // Handle dragging control points on the curve
  const handleCurvePointDrag = (t, e) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Calculate the current point on curve and tangent
    const currentPoint = getPointOnCurve(t);
    const tangent = getTangentAtPoint(t);
    
    // Calculate the offset from the curve
    const offsetX = newX - currentPoint.x;
    const offsetY = newY - currentPoint.y;
    
    // Calculate the perpendicular to the tangent
    const tangentLength = Math.sqrt(tangent.dx * tangent.dx + tangent.dy * tangent.dy);
    if (tangentLength === 0) return;
    
    const perpX = -tangent.dy / tangentLength;
    const perpY = tangent.dx / tangentLength;
    
    // Project the offset onto the perpendicular to get the distance from curve
    const distance = offsetX * perpX + offsetY * perpY;
    
    // Adjust the control point to create the desired curve shape
    const newControlX = controlX + distance * perpX;
    const newControlY = controlY + distance * perpY;
    
    onChange({
      ...connector,
      controlX: newControlX,
      controlY: newControlY,
    });
  };

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
    onSelect(e, connector.id);
  };

  return (
    <Group>
      {/* The curved line */}
      <Shape
        id={connector.id}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(fromProduct.x, fromProduct.y);
          ctx.quadraticCurveTo(controlX, controlY, toProduct.x, toProduct.y);
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

          {/* Draggable control point (off-curve, traditional Bezier control) */}
          <Circle
            x={controlX}
            y={controlY}
            radius={6}
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

          {/* Control point at 1/4 of the curve (near start) */}
          <Circle
            x={getPointOnCurve(0.25).x}
            y={getPointOnCurve(0.25).y}
            radius={7}
            fill={theme.palette.info.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleCurvePointDrag(0.25, e);
            }}
            onDragMove={(e) => handleCurvePointDrag(0.25, e)}
          />

          {/* Control point at 1/2 of the curve (middle) */}
          <Circle
            x={getPointOnCurve(0.5).x}
            y={getPointOnCurve(0.5).y}
            radius={8}
            fill={theme.palette.secondary.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleCurvePointDrag(0.5, e);
            }}
            onDragMove={(e) => handleCurvePointDrag(0.5, e)}
          />

          {/* Control point at 3/4 of the curve (near end) */}
          <Circle
            x={getPointOnCurve(0.75).x}
            y={getPointOnCurve(0.75).y}
            radius={7}
            fill={theme.palette.info.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleCurvePointDrag(0.75, e);
            }}
            onDragMove={(e) => handleCurvePointDrag(0.75, e)}
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
