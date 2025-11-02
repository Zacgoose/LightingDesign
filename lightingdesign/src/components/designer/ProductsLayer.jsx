import { Group, Transformer, Text } from "react-konva";
import { ProductShape } from "./ProductShape";
import productTypesConfig from "/src/data/productTypes.json";
import { useEffect, memo } from "react";

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

// Calculate letter prefix for a product based on its type and SKU
const getProductLetterPrefix = (product, products, productTypesConfig) => {
  const productType = product.product_type?.toLowerCase() || "default";
  const config = productTypesConfig[productType] || productTypesConfig.default;
  const letterPrefix = config.letterPrefix || "O";

  // Normalize SKU: trim whitespace and handle empty strings as null
  const sku = product.sku?.trim();
  if (!sku || sku === "") {
    return letterPrefix; // No SKU, just return letter without number
  }

  // Find all unique SKUs for this product type, sorted to ensure consistent ordering
  const sameTypeProducts = products.filter(
    (p) => (p.product_type?.toLowerCase() || "default") === productType
  );

  // Get unique SKUs, filtering out null/undefined/empty, then sort
  const uniqueSkus = [...new Set(
    sameTypeProducts
      .map((p) => p.sku?.trim())
      .filter((s) => s && s !== "")
  )].sort();

  // Find the index of this product's SKU among unique SKUs of this type
  const skuIndex = uniqueSkus.indexOf(sku);

  // If SKU not found (shouldn't happen), return just the letter
  if (skuIndex === -1) {
    console.warn(`SKU "${sku}" not found in uniqueSkus for ${productType}:`, uniqueSkus);
    return letterPrefix;
  }

  return `${letterPrefix}${skuIndex + 1}`;
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
    isDragging = false, // Add isDragging prop for performance optimization
    onProductClick,
    onProductDragStart,
    onProductDragEnd,
    onContextMenu,
    onGroupTransformEnd,
    textBoxes = [], // Add textBoxes support
    onTextContextMenu, // Add text context menu handler
    renderUnselected = true, // Control rendering of unselected products
    renderSelection = true, // Control rendering of selection group
    renderTransformer = true, // Control rendering of transformer
  }) => {

    // Manually attach transformend event listener to Transformer
    // This is necessary because the Group's onTransformEnd prop doesn't fire reliably
    useEffect(() => {
      if (!transformerRef.current || !onGroupTransformEnd) return;

      const transformer = transformerRef.current;
      
      const handleTransformEnd = () => {
        onGroupTransformEnd();
      };

      // Attach the event listener
      transformer.on('transformend', handleTransformEnd);

      // Cleanup
      return () => {
        transformer.off('transformend', handleTransformEnd);
      };
    }, [transformerRef, onGroupTransformEnd]);

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
        {renderUnselected && products
          .filter((p) => !productOnlyIds.includes(p.id))
          .map((product) => {
            const productType = product.product_type?.toLowerCase() || "default";
            const config = productTypesConfig[productType] || productTypesConfig.default;
            const customStroke = getProductStrokeColor(product, products, config.stroke);
            const letterPrefix = getProductLetterPrefix(product, products, productTypesConfig);

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
                letterPrefix={letterPrefix}
              />
            );
          })}

        {/* Selected products and text boxes in a draggable group */}
        {renderSelection && hasSelection && (
          <Group
            key={groupKey}
            ref={selectionGroupRef}
            x={selectionSnapshot.centerX || 0}
            y={selectionSnapshot.centerY || 0}
            //offsetX={(selectionSnapshot.width || 0) / 2}
            //offsetY={(selectionSnapshot.height || 0) / 2}
            rotation={selectionSnapshot.rotation || 0}
            draggable={(selectedTool === "select" || selectedTool === "text") && canInteract}
            onDragEnd={onGroupTransformEnd}
            onTransformEnd={onGroupTransformEnd}
            onTransform={(e) => {
              const node = e.target;
              // Keep the group centered at its original position during rotation/scale
              // Don't modify position during transform - this causes the shifting issue
              // The transformer already handles the positioning correctly

              // Real-time updates during transformation for text boxes
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              const scaleDiff = Math.abs(scaleX - scaleY);
              const isSideResize = scaleDiff > 0.1;
              if (isSideResize && textIds.length > 0) {
                node.getLayer()?.batchDraw();
              }
            }}
          >
            {/* Render selected products */}
            {/* Always use snapshot to avoid inconsistencies */}
            {selectionSnapshot.products?.map((product) => {
              const productType = product.product_type?.toLowerCase() || "default";
              const config = productTypesConfig[productType] || productTypesConfig.default;
              const customStroke = getProductStrokeColor(product, products, config.stroke);
              const letterPrefix = getProductLetterPrefix(product, products, productTypesConfig);

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
                  listening={!isDragging} // Disable listening during drag for performance
                  onMouseDown={(e) =>
                    (canInteract || isConnectMode) && onProductClick(e, product.id)
                  }
                  onContextMenu={(e) => canInteract && onContextMenu(e, product.id)}
                  customStroke={customStroke}
                  theme={theme}
                  letterPrefix={letterPrefix}
                  groupRotation={selectionSnapshot.rotation || 0}
                />
              );
            })}
            
            {/* Render selected text boxes */}
            {/* Always use snapshot to avoid inconsistencies */}
            {selectionSnapshot.textBoxes?.map((textBox) => {
              // Parse font style
              const isBold = textBox.fontStyle?.includes("bold") || false;
              const isItalic = textBox.fontStyle?.includes("italic") || false;
              const fontStyle = isItalic ? "italic" : "normal";
              const fontWeight = isBold ? "bold" : "normal";

              // Calculate rendered font size based on scaleFactor
              const baseFontSize = textBox.fontSize || 24;
              const scaleFactor = textBox.scaleFactor || 100;
              const renderedFontSize = baseFontSize * (scaleFactor / 100);

              // Calculate center offset for rotation
              // Text width is known, height is approximately fontSize * 1.2 for single line
              const textWidth = textBox.width || 100;
              const textHeight = renderedFontSize * 1.2;

              return (
                <Group
                  key={textBox.id}
                  x={textBox.relativeX || 0}
                  y={textBox.relativeY || 0}
                  rotation={textBox.rotation || 0}
                  scaleX={textBox.scaleX || 1}
                  scaleY={textBox.scaleY || 1}
                  draggable={false}
                  listening={true}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    // Text is already selected, clicking does nothing (prevents new text creation in text mode)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                  }}
                  // Don't cancel mouseDown - let it propagate to parent Group for dragging
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    e.cancelBubble = true;
                    if (onTextContextMenu) {
                      // Find the original text ID and call context menu
                      const originalTextId = textBox.id;
                      onTextContextMenu(e, originalTextId);
                    }
                  }}
                >
                  <Text
                    x={-textWidth / 2}
                    y={-textHeight / 2}
                    text={textBox.text}
                    fontSize={renderedFontSize}
                    fontFamily={textBox.fontFamily || "Arial"}
                    fontStyle={fontStyle}
                    fontVariant={fontWeight}
                    textDecoration={textBox.textDecoration || ""}
                    fill={textBox.color || "#000000"}
                    width={textBox.max}
                    wrap="none"
                    draggable={false}
                    listening={true}
                  />
                </Group>
              );
            })}
          </Group>
        )}

        {/* Transformer for selected group - visible in both select and text modes */}
        {renderTransformer && (selectedTool === "select" || selectedTool === "text") && !isPlacementMode && hasSelection && (
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
                    // Strictly maintain aspect ratio for corner resize
                    const ratio = oldBox.width / oldBox.height;
                    const scaleX = newBox.width / oldBox.width;
                    const scaleY = newBox.height / oldBox.height;
                    const avgScale = (scaleX + scaleY) / 2;
                    newBox.width = oldBox.width * avgScale;
                    newBox.height = oldBox.height * avgScale;
                  }
                }
              }
              return newBox;
            }}
            rotateEnabled={true}
            keepRatio={textIds.length > 0 && productOnlyIds.length === 0}
            ignoreStroke={true}
            anchorSize={8}
            borderDash={[4, 4]}
            rotationSnapTolerance={5}
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
      prevProps.isDragging === nextProps.isDragging &&
      prevProps.rotationSnaps === nextProps.rotationSnaps &&
      prevProps.theme === nextProps.theme &&
      prevProps.renderUnselected === nextProps.renderUnselected &&
      prevProps.renderSelection === nextProps.renderSelection &&
      prevProps.renderTransformer === nextProps.renderTransformer &&
      prevProps.onProductClick === nextProps.onProductClick &&
      prevProps.onProductDragStart === nextProps.onProductDragStart &&
      prevProps.onProductDragEnd === nextProps.onProductDragEnd &&
      prevProps.onContextMenu === nextProps.onContextMenu &&
      prevProps.onTextContextMenu === nextProps.onTextContextMenu &&
      prevProps.onGroupTransformEnd === nextProps.onGroupTransformEnd
    );
  },
);
