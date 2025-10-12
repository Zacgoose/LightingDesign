import { Shape, Text, Group } from "react-konva";
import { getShapeFunction } from "/src/components/designer/productShapes";
import { useEffect, useRef, memo } from "react";
import { logRender } from "/src/utils/performanceLogger";

export const ProductShape = memo(({ 
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
        draggable
      });
    }
  });

  const shapeFunction = getShapeFunction(config.shapeType);
  const maxDimension = Math.max(config.width || 30, config.height || 30);
  const textYOffset = maxDimension / 2 + 10;
  const skuYOffset = -(maxDimension / 2 + 20);

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
        width={config.width}
        height={config.height}
        listening={listening}
        realWorldWidth={product.realWorldWidth}
        realWorldHeight={product.realWorldHeight}
        realWorldSize={product.realWorldSize}
        scaleFactor={product.scaleFactor}
      />
      
      {product.sku && (
        <Text
          text={product.sku}
          fontSize={11}
          fill={theme.palette.text.primary}
          fontStyle="bold"
          align="center"
          y={skuYOffset}
          x={-60}
          width={120}
          listening={listening}
        />
      )}
      
      <Text
        text={product.customLabel || product.name}
        fontSize={10}
        fill={theme.palette.text.secondary}
        align="center"
        y={textYOffset}
        x={-60}
        width={120}
        listening={listening}
      />
      
      {product.quantity > 1 && (
        <>
          <Shape
            sceneFunc={(context, shape) => {
              context.beginPath();
              context.arc(maxDimension * 0.6, -maxDimension * 0.4, 12, 0, Math.PI * 2);
              context.fillStrokeShape(shape);
            }}
            fill={theme.palette.error.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
            listening={listening}
          />
          <Text
            text={`${product.quantity}`}
            fontSize={10}
            fill={theme.palette.error.contrastText}
            fontStyle="bold"
            align="center"
            x={maxDimension * 0.6 - 6}
            y={-maxDimension * 0.4 - 5}
            width={12}
            listening={listening}
          />
        </>
      )}
    </Group>
  );
});