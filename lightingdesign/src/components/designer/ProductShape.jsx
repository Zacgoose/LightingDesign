import { Shape, Text, Group, Rect } from "react-konva";
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
    // This ensures text and bounding boxes align with the actual rendered shape
    const scaleFactor = product.scaleFactor || 100; // fallback to default
    const realWorldSize = product.realWorldSize || config.realWorldSize;
    const realWorldWidth = product.realWorldWidth || config.realWorldWidth;
    const realWorldHeight = product.realWorldHeight || config.realWorldHeight;
    
    // Calculate rendered width and height (actual size in virtual canvas units)
    let renderedWidth, renderedHeight;
    if (realWorldSize) {
      // For circular/square shapes
      renderedWidth = renderedHeight = realWorldSize * scaleFactor;
    } else if (realWorldWidth && realWorldHeight) {
      // For rectangular shapes
      renderedWidth = realWorldWidth * scaleFactor;
      renderedHeight = realWorldHeight * scaleFactor;
    } else {
      // Fallback to config dimensions
      renderedWidth = config.width || 30;
      renderedHeight = config.height || 30;
    }
    
    const maxDimension = Math.max(renderedWidth, renderedHeight);
    
    // Scale for quantity badge
    const baselineDimension = 50; // Original config baseline size
    const textScale = maxDimension / baselineDimension;

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
        {/* Invisible rect to define bounds for transformer */}
        <Rect
          x={-renderedWidth / 2}
          y={-renderedHeight / 2}
          width={renderedWidth}
          height={renderedHeight}
          fill="transparent"
          stroke="transparent"
          listening={false}
        />
        
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

        {/* Text labels removed - now shown in preview panel */}

        {product.quantity > 1 && (
          <>
            <Shape
              sceneFunc={(context, shape) => {
                const badgeRadius = 12 * textScale;
                context.beginPath();
                // Badge positioned in Group coordinate system (centered at 0,0)
                context.arc(maxDimension * 0.6, -maxDimension * 0.4, badgeRadius, 0, Math.PI * 2);
                context.fillStrokeShape(shape);
              }}
              fill={theme.palette.error.main}
              stroke={theme.palette.background.paper}
              strokeWidth={2}
              listening={listening}
            />
            <Text
              text={`${product.quantity}`}
              fontSize={Math.max(10 * textScale, 8)}
              fill={theme.palette.error.contrastText}
              fontStyle="bold"
              align="center"
              x={maxDimension * 0.6 - 6 * textScale}
              y={-maxDimension * 0.4 - 5 * textScale}
              width={12 * textScale}
              listening={listening}
            />
          </>
        )}
      </Group>
    );
  },
);
