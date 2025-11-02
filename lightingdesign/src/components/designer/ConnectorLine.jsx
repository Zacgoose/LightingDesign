import { Group, Shape, Circle, Line } from "react-konva";
import { useState, useRef } from "react";

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
  const control1Ref = useRef(null);
  const control3Ref = useRef(null);
  const shapeRef = useRef(null);

  // Initialize 3 control points for cubic Bézier curve
  // Control points positioned to create a natural curve
  const defaultControl1X = fromProduct.x + (toProduct.x - fromProduct.x) * 0.25;
  const defaultControl1Y = Math.min(fromProduct.y, toProduct.y) - 60;
  const defaultControl3X = fromProduct.x + (toProduct.x - fromProduct.x) * 0.75;
  const defaultControl3Y = Math.min(fromProduct.y, toProduct.y) - 60;

  const control1 = connector.control1 ?? { x: defaultControl1X, y: defaultControl1Y };
  const control3 = connector.control3 ?? { x: defaultControl3X, y: defaultControl3Y };
  
  // Control2 (center point) is always positioned in a straight line between control1 and control3
  // Not user-adjustable - ensures smooth flow from one end to the other
  const control2 = {
    x: (control1.x + control3.x) / 2,
    y: (control1.y + control3.y) / 2,
  };

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
        ref={shapeRef}
        id={connector.id}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(fromProduct.x, fromProduct.y);
          
          // Get current control point positions (may be mid-drag)
          const c1 = control1Ref.current ? { x: control1Ref.current.x(), y: control1Ref.current.y() } : control1;
          const c3 = control3Ref.current ? { x: control3Ref.current.x(), y: control3Ref.current.y() } : control3;
          
          // Control2 (center point) is always positioned in a straight line between control1 and control3
          const c2 = {
            x: (c1.x + c3.x) / 2,
            y: (c1.y + c3.y) / 2,
          };
          
          // Draw smooth curve through 3 control points
          // Use two cubic Bézier curves to pass through all 3 control points
          const midX = (c1.x + c2.x) / 2;
          const midY = (c1.y + c2.y) / 2;
          const mid2X = (c2.x + c3.x) / 2;
          const mid2Y = (c2.y + c3.y) / 2;

          ctx.bezierCurveTo(c1.x, c1.y, midX, midY, c2.x, c2.y);
          ctx.bezierCurveTo(mid2X, mid2Y, c3.x, c3.y, toProduct.x, toProduct.y);
          ctx.fillStrokeShape(shape);
        }}
        stroke={
          connector.color ||
          (isSelected ? theme.palette.secondary.main : theme.palette.primary.main)
        }
        strokeWidth={isSelected ? 6 : 4}
        lineCap="round"
        dash={[20, 10]} // Dashed line pattern: 20px dash, 10px gap (more spacing)
        hitStrokeWidth={20} // Makes it easier to click
        listening={selectedTool === "select" || selectedTool === "connect"} // Only listen when interaction is needed
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

          {/* Draggable control points (only outer two) */}
          <Circle
            ref={control1Ref}
            x={control1.x}
            y={control1.y}
            radius={10}
            fill={theme.palette.info.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragMove={() => {
              // Redraw the curve during drag without updating state
              if (shapeRef.current) {
                shapeRef.current.getLayer()?.batchDraw();
              }
            }}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleControlDrag("control1", e);
            }}
          />
          {/* Center control point (control2) is not visible or draggable - auto-positioned */}
          <Circle
            ref={control3Ref}
            x={control3.x}
            y={control3.y}
            radius={10}
            fill={theme.palette.info.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragMove={() => {
              // Redraw the curve during drag without updating state
              if (shapeRef.current) {
                shapeRef.current.getLayer()?.batchDraw();
              }
            }}
            onDragEnd={(e) => {
              setIsDragging(false);
              handleControlDrag("control3", e);
            }}
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
