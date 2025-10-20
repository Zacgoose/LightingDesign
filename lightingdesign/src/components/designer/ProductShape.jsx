import { Shape, Text, Group } from "react-konva";
import { getShapeFunction } from "/src/components/designer/productShapes";
import { useEffect, useRef, memo } from "react";
import { logRender } from "/src/utils/performanceLogger";

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
    // Performance monitoring
    const renderCount = useRef(0);
    useEffect(() => {
      renderCount.current++;
      if (renderCount.current > 1) {
        logRender(`ProductShape-${product.id}`, {
          renderCount: renderCount.current,
          sku: product.sku,
          draggable,
        });
      }
    });

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
    
    // Custom client rect function for accurate transformer bounds
    // Returns the bounding box of the shape in its local coordinate space
    const getClientRect = () => {
      // Shapes are drawn centered at (0, 0), so we need to account for how they extend
      // For pendant: circle at (0,0) radius=width/2, wire extends to y=-(width/2)*1.5
      // For spotlight: body centered, bracket extends above
      
      const halfWidth = renderedWidth / 2;
      const halfHeight = renderedHeight / 2;
      
      // Most shapes are symmetric and centered, so bounds are ±half dimensions
      // But shapes with vertical extensions (pendant, spotlight) extend more upward
      
      // For pendant/chandelier (shapeType='pendant'):
      // - Circle: y from -radius to +radius (centered at 0)
      // - Wire: y from -radius*1.5 to -radius
      // - Total: y from -radius*1.5 to +radius = height of width*1.25
      // - Since circle is centered, top = -1.5*halfWidth, bottom = +halfWidth
      if (config.shapeType === 'pendant') {
        return {
          x: -halfWidth,
          y: -halfWidth * 1.5,  // Wire extends 1.5x radius above center
          width: renderedWidth,
          height: renderedWidth * 1.25,  // Total height is 1.25x width
        };
      }
      
      // For spotlight:
      // - Bracket: y from -radius*1.2 to -radius*0.8 (at x from -radius/2 to +radius/2)
      // - Body: x from -radius*0.8 to +radius*0.8, y from -radius to +radius
      // - Total bounds: x from -radius*0.8 to +radius*0.8, y from -radius*1.2 to +radius
      if (config.shapeType === 'spotlight') {
        return {
          x: -halfWidth * 0.8,  // Body width is ±0.8*radius
          y: -halfWidth * 1.2,  // Bracket extends 1.2*radius above center
          width: halfWidth * 0.8 * 2,  // Total width: 1.6*radius
          height: halfWidth * (1.2 + 1),  // Total height: from -1.2*radius to +radius = 2.2*radius
        };
      }
      
      // For all other shapes, use symmetric centered bounds
      return {
        x: -halfWidth,
        y: -halfHeight,
        width: renderedWidth,
        height: renderedHeight,
      };
    };
    
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
          listening={listening}
          realWorldWidth={product.realWorldWidth}
          realWorldHeight={product.realWorldHeight}
          realWorldSize={product.realWorldSize}
          scaleFactor={product.scaleFactor}
          getClientRect={getClientRect}
        />

        {product.sku && (
          <Text
            text={product.sku}
            fontSize={skuFontSize}
            fill={theme.palette.text.primary}
            fontStyle="bold"
            align="center"
            y={skuYOffset}
            x={-textWidth / 2}
            width={textWidth}
            listening={listening}
          />
        )}

        <Text
          text={product.customLabel || product.name}
          fontSize={nameFontSize}
          fill={theme.palette.text.secondary}
          align="center"
          y={textYOffset}
          x={-textWidth / 2}
          width={textWidth}
          listening={listening}
        />

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
