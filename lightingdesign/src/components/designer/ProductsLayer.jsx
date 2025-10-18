import { Group, Transformer, Text } from "react-konva";
import { ProductShape } from "./ProductShape";
import productTypesConfig from "/src/data/productTypes.json";
import { useEffect, useRef, memo } from "react";
import { logRender } from "/src/utils/performanceLogger";

export const COLOR_PALETTE = [
  "#1976d2",
  "#d32f2f",
  "#388e3c",
  "#f57c00",
  "#7b1fa2",
  "#0097a7",
  "#c2185b",
  "#5d4037",
  "#455a64",
  "#00796b",
];

const getProductStrokeColor = (product, products, defaultColor) => {
  // If product already has a strokeColor assigned, use it
  if (product.strokeColor) {
    return product.strokeColor;
  }

  const sku = product.sku;
  if (!sku) return defaultColor;
  const skuProducts = products.filter((p) => p.sku === sku);
  if (skuProducts.length <= 1) return defaultColor;

  // Use stored strokeColor if available
  const existingProduct = skuProducts.find((p) => p.strokeColor);
  if (existingProduct) {
    return existingProduct.strokeColor;
  }

  const skuList = [...new Set(products.map((p) => p.sku).filter(Boolean))];
  const skuIndex = skuList.indexOf(sku);
  return COLOR_PALETTE[skuIndex % COLOR_PALETTE.length];
};

export const ProductsLayer = memo(
  ({
    products,
    selectedIds,
    selectedTool,
    selectionSnapshot,
    selectionGroupRef,
    transformerRef,
    rotationSnaps,
    theme,
    groupKey,
    placementMode,
    onProductClick,
    onProductDragStart,
    onProductDragEnd,
    onContextMenu,
    onGroupTransformEnd,
    textBoxes = [], // Add textBoxes support
    onTextContextMenu, // Add text context menu handler
  }) => {
    // Performance monitoring
    const renderCount = useRef(0);
    useEffect(() => {
      renderCount.current++;
      logRender("ProductsLayer", {
        renderCount: renderCount.current,
        productsCount: products.length,
        selectedCount: selectedIds.length,
        selectedTool,
        groupKey,
      });
    });

    const isPlacementMode = selectedTool === "placement" || placementMode;
    const isPanMode = selectedTool === "pan";
    const isConnectMode = selectedTool === "connect";
    const canInteract = !isPlacementMode && !isPanMode && !isConnectMode;
    
    // Extract product IDs and text IDs from selectedIds
    const productOnlyIds = selectedIds.filter(id => !id.startsWith('text-'));
    const textIds = selectedIds
      .filter(id => id.startsWith('text-'))
      .map(id => id.substring(5)); // Remove 'text-' prefix
    
    const hasSelection = productOnlyIds.length > 0 || textIds.length > 0;
    
    return (
      <>
        {/* Unselected products - individually draggable */}
        {products
          .filter((p) => !productOnlyIds.includes(p.id))
          .map((product) => {
            const productType = product.product_type?.toLowerCase() || "default";
            const config = productTypesConfig[productType] || productTypesConfig.default;
            const customStroke = getProductStrokeColor(product, products, config.stroke);

            return (
              <ProductShape
                key={product.id}
                product={product}
                config={config}
                isSelected={false}
                draggable={selectedTool === "select" && canInteract}
                onDragStart={(e) =>
                  selectedTool === "select" && canInteract && onProductDragStart(e, product.id)
                }
                onMouseDown={(e) => {
                  // Allow click in connect mode or select mode
                  if (selectedTool === "connect" || selectedTool === "select") {
                    onProductClick(e, product.id);
                  }
                }}
                onDragEnd={(e) =>
                  selectedTool === "select" && canInteract && onProductDragEnd(e, product.id)
                }
                onContextMenu={(e) =>
                  selectedTool === "select" && canInteract && onContextMenu(e, product.id)
                }
                customStroke={customStroke}
                theme={theme}
              />
            );
          })}

        {/* Selected products and text boxes in a draggable group */}
        {hasSelection && (
          <Group
            key={groupKey}
            ref={selectionGroupRef}
            x={selectionSnapshot.centerX || 0}
            y={selectionSnapshot.centerY || 0}
            rotation={selectionSnapshot.rotation || 0}
            offsetX={0}
            offsetY={0}
            draggable={(selectedTool === "select" || selectedTool === "text") && canInteract}
            onDragEnd={onGroupTransformEnd}
            onTransformEnd={onGroupTransformEnd}
            onTransform={(e) => {
              // Real-time updates during transformation for text boxes
              const node = e.target;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              
              // Detect if this is a side/top resize (non-proportional)
              const scaleDiff = Math.abs(scaleX - scaleY);
              const isSideResize = scaleDiff > 0.1;
              
              if (isSideResize && textIds.length > 0) {
                // For side resize, update width in real-time for text wrapping
                // This provides live preview of text wrapping
                node.getLayer()?.batchDraw();
              }
            }}
          >
            {/* Render selected products */}
            {(selectionSnapshot.products?.length > 0
              ? selectionSnapshot.products
              : products
                  .filter((p) => productOnlyIds.includes(p.id))
                  .map((p) => {
                    // Calculate center including both products and text boxes
                    let centerX = 0;
                    let centerY = 0;
                    let totalCount = 0;
                    
                    if (productOnlyIds.length > 0) {
                      const selectedProducts = products.filter((prod) => productOnlyIds.includes(prod.id));
                      centerX += selectedProducts.reduce((sum, prod) => sum + prod.x, 0);
                      centerY += selectedProducts.reduce((sum, prod) => sum + prod.y, 0);
                      totalCount += selectedProducts.length;
                    }
                    
                    if (textIds.length > 0) {
                      const selectedTexts = textBoxes.filter((t) => textIds.includes(t.id));
                      centerX += selectedTexts.reduce((sum, t) => sum + t.x, 0);
                      centerY += selectedTexts.reduce((sum, t) => sum + t.y, 0);
                      totalCount += selectedTexts.length;
                    }
                    
                    centerX /= totalCount;
                    centerY /= totalCount;
                    
                    return {
                      ...p,
                      relativeX: p.x - centerX,
                      relativeY: p.y - centerY,
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
                    // Calculate center including both products and text boxes
                    let centerX = 0;
                    let centerY = 0;
                    let totalCount = 0;
                    
                    if (productOnlyIds.length > 0) {
                      const selectedProducts = products.filter((p) => productOnlyIds.includes(p.id));
                      centerX += selectedProducts.reduce((sum, p) => sum + p.x, 0);
                      centerY += selectedProducts.reduce((sum, p) => sum + p.y, 0);
                      totalCount += selectedProducts.length;
                    }
                    
                    if (textIds.length > 0) {
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

              // Calculate rendered font size based on scaleFactor
              const baseFontSize = textBox.fontSize || 24;
              const scaleFactor = textBox.scaleFactor || 100;
              const renderedFontSize = baseFontSize * (scaleFactor / 100);

              return (
                <Text
                  key={textBox.id}
                  x={textBox.relativeX || 0}
                  y={textBox.relativeY || 0}
                  text={textBox.text}
                  fontSize={renderedFontSize}
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
                  listening={true}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    // Text is already selected, clicking does nothing (prevents new text creation in text mode)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                  }}
                  // Don't cancel mouseDown - let it propagate to Group for dragging
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    e.cancelBubble = true;
                    if (onTextContextMenu) {
                      // Find the original text ID and call context menu
                      const originalTextId = textBox.id;
                      onTextContextMenu(e, originalTextId);
                    }
                  }}
                />
              );
            })}
          </Group>
        )}

        {/* Transformer for selected group - visible in both select and text modes */}
        {(selectedTool === "select" || selectedTool === "text") && !isPlacementMode && hasSelection && (
          <Transformer
            ref={transformerRef}
            rotationSnaps={
              rotationSnaps > 0
                ? Array.from({ length: rotationSnaps }, (_, i) => (360 / rotationSnaps) * i)
                : undefined
            }
            boundBoxFunc={(oldBox, newBox) => {
              // Prevent box from getting too small
              const minWidth = 20;
              const minHeight = 15;
              
              if (newBox.width < minWidth || newBox.height < minHeight) {
                return oldBox;
              }
              
              // For text-only selections, enforce aspect ratio on corner resizes
              if (textIds.length > 0 && productOnlyIds.length === 0) {
                const transformer = transformerRef.current;
                if (transformer) {
                  const activeAnchor = transformer.getActiveAnchor();
                  const isCornerAnchor = activeAnchor && (
                    activeAnchor === 'top-left' ||
                    activeAnchor === 'top-right' ||
                    activeAnchor === 'bottom-left' ||
                    activeAnchor === 'bottom-right'
                  );
                  
                  if (isCornerAnchor) {
                    // Maintain aspect ratio for corner resize
                    const ratio = oldBox.width / oldBox.height;
                    const newRatio = newBox.width / newBox.height;
                    
                    // If ratio changed, adjust to maintain it
                    if (Math.abs(ratio - newRatio) > 0.01) {
                      newBox.height = newBox.width / ratio;
                    }
                  }
                }
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
            enabledAnchors={
              textIds.length > 0 && productOnlyIds.length === 0
                ? [
                    // For text-only selections: only corners for proportional scaling
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                  ]
                : undefined // Default anchors for products or mixed selections
            }
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if these specific props change
    return (
      prevProps.products === nextProps.products &&
      prevProps.textBoxes === nextProps.textBoxes &&
      prevProps.selectedIds === nextProps.selectedIds &&
      prevProps.selectedTool === nextProps.selectedTool &&
      prevProps.selectionSnapshot === nextProps.selectionSnapshot &&
      prevProps.groupKey === nextProps.groupKey &&
      prevProps.placementMode === nextProps.placementMode &&
      prevProps.rotationSnaps === nextProps.rotationSnaps &&
      prevProps.theme === nextProps.theme &&
      prevProps.onProductClick === nextProps.onProductClick &&
      prevProps.onProductDragStart === nextProps.onProductDragStart &&
      prevProps.onProductDragEnd === nextProps.onProductDragEnd &&
      prevProps.onContextMenu === nextProps.onContextMenu &&
      prevProps.onTextContextMenu === nextProps.onTextContextMenu &&
      prevProps.onGroupTransformEnd === nextProps.onGroupTransformEnd
    );
  },
);
