import { Group, Transformer, Text } from "react-konva";
import { ProductShape } from "./ProductShape";
import productTypesConfig from "/src/data/productTypes.json";
import { useEffect, useRef, memo } from "react";
import { COLOR_PALETTE } from "./ProductsLayer";

const getProductStrokeColor = (product, products, defaultColor) => {
  if (product.strokeColor) {
    return product.strokeColor;
  }

  const sku = product.sku;
  if (!sku) return defaultColor;
  const skuProducts = products.filter((p) => p.sku === sku);
  if (skuProducts.length <= 1) return defaultColor;

  const existingProduct = skuProducts.find((p) => p.strokeColor);
  if (existingProduct) {
    return existingProduct.strokeColor;
  }

  const skuList = [...new Set(products.map((p) => p.sku).filter(Boolean))];
  const skuIndex = skuList.indexOf(sku);
  return COLOR_PALETTE[skuIndex % COLOR_PALETTE.length];
};

/**
 * UnifiedSelectionGroup - Handles both products and text boxes in a single draggable/transformable group
 */
export const UnifiedSelectionGroup = memo(
  ({
    selectedIds,
    products,
    textBoxes,
    selectionSnapshot,
    selectionGroupRef,
    transformerRef,
    rotationSnaps,
    theme,
    groupKey,
    selectedTool,
    canInteract,
    isConnectMode,
    onProductClick,
    onContextMenu,
    onGroupTransformEnd,
  }) => {
    // Extract product IDs and text IDs from selectedIds
    const productIds = selectedIds.filter(id => !id.startsWith('text-'));
    const textIds = selectedIds
      .filter(id => id.startsWith('text-'))
      .map(id => id.substring(5)); // Remove 'text-' prefix

    const hasProducts = productIds.length > 0;
    const hasTexts = textIds.length > 0;

    if (!hasProducts && !hasTexts) {
      return null;
    }

    return (
      <>
        <Group
          key={groupKey}
          ref={selectionGroupRef}
          x={selectionSnapshot.centerX || 0}
          y={selectionSnapshot.centerY || 0}
          rotation={selectionSnapshot.rotation || 0}
          offsetX={0}
          offsetY={0}
          draggable={selectedTool === "select" && canInteract}
          onDragEnd={onGroupTransformEnd}
          onTransformEnd={onGroupTransformEnd}
        >
          {/* Render selected products */}
          {(selectionSnapshot.products?.length > 0
            ? selectionSnapshot.products
            : products
                .filter((p) => productIds.includes(p.id))
                .map((p) => {
                  const centerX =
                    products
                      .filter((prod) => productIds.includes(prod.id))
                      .reduce((sum, prod) => sum + prod.x, 0) / productIds.length;
                  const centerY =
                    products
                      .filter((prod) => productIds.includes(prod.id))
                      .reduce((sum, prod) => sum + prod.y, 0) / productIds.length;
                  
                  // If we have mixed selection (products + texts), calculate center including texts
                  let finalCenterX = centerX;
                  let finalCenterY = centerY;
                  
                  if (hasTexts) {
                    const selectedTexts = textBoxes.filter((t) => textIds.includes(t.id));
                    const totalCount = productIds.length + textIds.length;
                    const textSumX = selectedTexts.reduce((sum, t) => sum + t.x, 0);
                    const textSumY = selectedTexts.reduce((sum, t) => sum + t.y, 0);
                    finalCenterX = (centerX * productIds.length + textSumX) / totalCount;
                    finalCenterY = (centerY * productIds.length + textSumY) / totalCount;
                  }
                  
                  return {
                    ...p,
                    relativeX: p.x - finalCenterX,
                    relativeY: p.y - finalCenterY,
                  };
                })
          ).map((product) => {
            const productType = product.product_type?.toLowerCase() || "default";
            const config = productTypesConfig[productType] || productTypesConfig.default;
            const customStroke = getProductStrokeColor(product, products, config.stroke);

            const relativeProduct = {
              ...product,
              x: product.relativeX || 0,
              y: product.relativeY || 0,
              rotation: product.rotation || 0,
            };

            return (
              <ProductShape
                key={product.id}
                product={relativeProduct}
                config={config}
                isSelected={true}
                draggable={false}
                onMouseDown={(e) =>
                  (canInteract || isConnectMode) && onProductClick(e, product.id)
                }
                onContextMenu={(e) => canInteract && onContextMenu(e, product.id)}
                customStroke={customStroke}
                theme={theme}
              />
            );
          })}

          {/* Render selected text boxes */}
          {(selectionSnapshot.textBoxes?.length > 0
            ? selectionSnapshot.textBoxes
            : textBoxes
                .filter((t) => textIds.includes(t.id))
                .map((t) => {
                  // Calculate center including both products and texts
                  let centerX = 0;
                  let centerY = 0;
                  let totalCount = 0;
                  
                  if (hasProducts) {
                    const selectedProducts = products.filter((p) => productIds.includes(p.id));
                    centerX += selectedProducts.reduce((sum, p) => sum + p.x, 0);
                    centerY += selectedProducts.reduce((sum, p) => sum + p.y, 0);
                    totalCount += selectedProducts.length;
                  }
                  
                  if (hasTexts) {
                    const selectedTexts = textBoxes.filter((tb) => textIds.includes(tb.id));
                    centerX += selectedTexts.reduce((sum, tb) => sum + tb.x, 0);
                    centerY += selectedTexts.reduce((sum, tb) => sum + tb.y, 0);
                    totalCount += selectedTexts.length;
                  }
                  
                  centerX /= totalCount;
                  centerY /= totalCount;
                  
                  return {
                    ...t,
                    relativeX: t.x - centerX,
                    relativeY: t.y - centerY,
                  };
                })
          ).map((textBox) => {
            // Parse font style
            const isBold = textBox.fontStyle?.includes("bold") || false;
            const isItalic = textBox.fontStyle?.includes("italic") || false;
            const fontStyle = isItalic ? "italic" : "normal";
            const fontWeight = isBold ? "bold" : "normal";

            return (
              <Text
                key={textBox.id}
                x={textBox.relativeX || 0}
                y={textBox.relativeY || 0}
                text={textBox.text}
                fontSize={textBox.fontSize || 24}
                fontFamily={textBox.fontFamily || "Arial"}
                fontStyle={fontStyle}
                fontVariant={fontWeight}
                textDecoration={textBox.textDecoration || ""}
                fill={textBox.color || "#000000"}
                rotation={textBox.rotation || 0}
                scaleX={textBox.scaleX || 1}
                scaleY={textBox.scaleY || 1}
                width={textBox.width}
                draggable={false}
                listening={false}
              />
            );
          })}
        </Group>

        {/* Transformer for selected group */}
        {selectedTool === "select" && (
          <Transformer
            ref={transformerRef}
            rotationSnaps={
              rotationSnaps > 0
                ? Array.from({ length: rotationSnaps }, (_, i) => (360 / rotationSnaps) * i)
                : undefined
            }
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            keepRatio={false}
            ignoreStroke={true}
            anchorSize={8}
            borderDash={[4, 4]}
            rotationSnapTolerance={5}
            rotationDeltaOffset={-(selectionSnapshot.rotation || 0)}
          />
        )}
      </>
    );
  }
);
