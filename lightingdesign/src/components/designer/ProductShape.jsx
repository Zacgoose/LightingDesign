import { Shape, Group } from "react-konva";
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
        onDragStart={onDragStart}
        onMouseDown={onMouseDown}
        onTap={onMouseDown}
        onDragEnd={onDragEnd}
        onContextMenu={onContextMenu}
      >
        <Shape
          sceneFunc={(context, shape) => shapeFunction(context, shape)}
          fill={product.color || config.fill}
          stroke={customStroke}
          strokeWidth={config.strokeWidth + 1}
          width={renderedWidth}
          height={renderedHeight}
          listening={listening}
          realWorldWidth={product.realWorldWidth}
          realWorldHeight={product.realWorldHeight}
          realWorldSize={product.realWorldSize}
          scaleFactor={product.scaleFactor}
        />
      </Group>
    );
  },
);
