import { Shape, Group, Text } from "react-konva";
import { getShapeFunction } from "/src/components/designer/productShapes";
import { memo } from "react";

export const ProductShape = memo(
  ({
    product,
    config,
    onMouseDown,
    onContextMenu,
    onDragStart,
    onDragEnd,
    customStroke,
    theme,
    draggable = false,
    opacity = 1,
    listening,
    letterPrefix, // Add letterPrefix prop
    groupRotation = 0, // New: rotation of parent group (for selected products)
  }) => {
    const shapeFunction = getShapeFunction(config.shapeType);

    // Calculate actual rendered dimensions based on scaleFactor and real-world size
    // Ensure shape is always centered at (x, y) with no offset for text
    const scaleFactor = product.scaleFactor || 100;
    const realWorldSize = product.realWorldSize || config.realWorldSize;
    const realWorldWidth = product.realWorldWidth || config.realWorldWidth;
    const realWorldHeight = product.realWorldHeight || config.realWorldHeight;

    let renderedWidth, renderedHeight;
    if (realWorldSize) {
      renderedWidth = renderedHeight = realWorldSize * scaleFactor;
    } else if (realWorldWidth && realWorldHeight) {
      renderedWidth = realWorldWidth * scaleFactor;
      renderedHeight = realWorldHeight * scaleFactor;
    } else {
      renderedWidth = config.width || 30;
      renderedHeight = config.height || 30;
    }

    // Calculate font size based on rendered dimensions
    const fontSize = Math.max(12, Math.min(renderedWidth, renderedHeight) * 0.3);
    
    // Calculate quantity badge position and size (top-right corner)
    const quantity = product.quantity || 1;
    const showQuantityBadge = quantity > 1;
    const badgeSize = Math.max(12, Math.min(renderedWidth, renderedHeight) * 0.25);
    const badgeFontSize = Math.max(8, badgeSize * 0.6);

    return (
      <Group
        x={product.x}
        y={product.y}
        rotation={product.rotation || 0}
        scaleX={product.scaleX || 1}
        scaleY={product.scaleY || 1}
        draggable={draggable}
        opacity={opacity}
        listening={listening}
        onDragStart={(e) => {
          // Prevent dragging on middle mouse button
          if (e.evt.button === 1) {
            e.target.stopDrag();
            e.cancelBubble = true;
            e.evt.preventDefault();
            e.evt.stopPropagation();
            return false;
          }
          if (onDragStart) {
            onDragStart(e);
          }
        }}
        onMouseDown={onMouseDown}
        onTap={onMouseDown}
        onDragEnd={onDragEnd}
        onContextMenu={onContextMenu}
      >
        <Shape
          sceneFunc={(context, shape) => {
            // Compensate for the offset so shapes still draw centered at (0,0)
            // Without this, offsetX/offsetY would translate the drawing
            context.translate(renderedWidth / 2, renderedHeight / 2);
            shapeFunction(context, shape);
          }}
          fill={product.color || config.fill}
          stroke={customStroke}
          strokeWidth={config.strokeWidth + 1}
          width={renderedWidth}
          height={renderedHeight}
          offsetX={renderedWidth / 2}
          offsetY={renderedHeight / 2}
          listening={listening}
          realWorldWidth={product.realWorldWidth}
          realWorldHeight={product.realWorldHeight}
          realWorldSize={product.realWorldSize}
          scaleFactor={product.scaleFactor}
        />
        {letterPrefix && (
          <Text
            text={letterPrefix}
            fontSize={fontSize}
            fontFamily="Arial"
            fontStyle="bold"
            fill="#000000"
            strokeWidth={1}
            align="center"
            verticalAlign="middle"
            listening={false}
            x={0}
            y={0}
            width={renderedWidth}
            height={renderedHeight}
            offsetX={renderedWidth / 2}
            offsetY={renderedHeight / 2}
            rotation={-((product.rotation || 0) + (groupRotation || 0))}
          />
        )}
        {showQuantityBadge && (
          <Group
            x={renderedWidth / 2 - badgeSize / 2}
            y={-renderedHeight / 2 - badgeSize / 2}
            rotation={-((product.rotation || 0) + (groupRotation || 0))}
            listening={false}
          >
            <Shape
              sceneFunc={(context, shape) => {
                context.beginPath();
                context.arc(0, 0, badgeSize / 2, 0, Math.PI * 2);
                context.closePath();
                context.fillStrokeShape(shape);
              }}
              fill="#FF5722"
              stroke="#FFFFFF"
              strokeWidth={1}
            />
            <Text
              text={quantity.toString()}
              fontSize={badgeFontSize}
              fontFamily="Arial"
              fontStyle="bold"
              fill="#FFFFFF"
              align="center"
              verticalAlign="middle"
              listening={false}
              x={-badgeSize / 2}
              y={-badgeSize / 2}
              width={badgeSize}
              height={badgeSize}
            />
          </Group>
        )}
      </Group>
    );
  },
);
