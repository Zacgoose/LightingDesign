import { Shape, Text, Group } from "react-konva";
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
    
    // Scale text size based on rendered dimensions
    // Base font sizes: 11 for SKU, 10 for name (designed for ~50px baseline)
    // Scale proportionally with object size
    const baselineDimension = 50; // Original config baseline size
    const textScale = maxDimension / baselineDimension;
    const skuFontSize = Math.max(11 * textScale, 8); // Min 8px
    const nameFontSize = Math.max(10 * textScale, 7); // Min 7px
    const textWidth = 120 * textScale;
    
    // Position text relative to rendered dimensions
    const textYOffset = maxDimension / 2 + 10 * textScale;
    const skuYOffset = -(maxDimension / 2 + 20 * textScale);

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
          x={-renderedWidth / 2}
          y={-renderedHeight / 2}
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
