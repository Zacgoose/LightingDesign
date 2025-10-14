import { Group, Circle, Line } from "react-konva";
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

  // Initialize waypoints if not present
  // Default waypoints: start -> waypoint1 -> waypoint2 -> end
  const defaultWaypoint1X = fromProduct.x + (toProduct.x - fromProduct.x) * 0.33;
  const defaultWaypoint1Y = Math.min(fromProduct.y, toProduct.y) - 60;
  const defaultWaypoint2X = fromProduct.x + (toProduct.x - fromProduct.x) * 0.67;
  const defaultWaypoint2Y = Math.min(fromProduct.y, toProduct.y) - 60;

  const waypoints = connector.waypoints ?? [
    { x: defaultWaypoint1X, y: defaultWaypoint1Y },
    { x: defaultWaypoint2X, y: defaultWaypoint2Y },
  ];

  // Handle waypoint drag
  const handleWaypointDrag = (index, e) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = { x: e.target.x(), y: e.target.y() };
    onChange({
      ...connector,
      waypoints: newWaypoints,
    });
  };

  // Calculate if mouse is near the line
  const handleLineClick = (e) => {
    e.cancelBubble = true;
    onSelect(e, connector.id);
  };

  return (
    <Group>
      {/* The polyline connector */}
      <Line
        id={connector.id}
        points={[
          fromProduct.x, fromProduct.y,
          ...waypoints.flatMap(wp => [wp.x, wp.y]),
          toProduct.x, toProduct.y
        ]}
        stroke={
          connector.color ||
          (isSelected ? theme.palette.secondary.main : theme.palette.primary.main)
        }
        strokeWidth={isSelected ? 3 : 2}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={20} // Makes it easier to click
        onClick={handleLineClick}
        onTap={handleLineClick}
        onContextMenu={onContextMenu}
      />

      {/* Show waypoints and guide lines when selected */}
      {isSelected && selectedTool === "select" && (
        <>
          {/* Draw guide lines connecting segments */}
          {waypoints.map((wp, index) => {
            const prevPoint = index === 0 
              ? { x: fromProduct.x, y: fromProduct.y }
              : waypoints[index - 1];
            
            return (
              <Line
                key={`guide-${index}`}
                points={[prevPoint.x, prevPoint.y, wp.x, wp.y]}
                stroke={theme.palette.action.disabled}
                strokeWidth={1}
                dash={[3, 3]}
                listening={false}
              />
            );
          })}
          
          {/* Last segment guide line */}
          <Line
            points={[
              waypoints[waypoints.length - 1].x,
              waypoints[waypoints.length - 1].y,
              toProduct.x,
              toProduct.y
            ]}
            stroke={theme.palette.action.disabled}
            strokeWidth={1}
            dash={[3, 3]}
            listening={false}
          />

          {/* Draggable waypoints */}
          {waypoints.map((wp, index) => (
            <Circle
              key={`waypoint-${index}`}
              x={wp.x}
              y={wp.y}
              radius={7}
              fill={theme.palette.info.main}
              stroke={theme.palette.background.paper}
              strokeWidth={2}
              draggable
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(e) => {
                setIsDragging(false);
                handleWaypointDrag(index, e);
              }}
              onDragMove={(e) => handleWaypointDrag(index, e)}
            />
          ))}

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
