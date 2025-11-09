import { Group, Transformer, Text, Rect } from "react-konva";
import { ProductShape } from "./ProductShape";
import productTypesConfig from "/src/data/productTypes.json";
import { useEffect, memo, useMemo } from "react";

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

/**
 * Gets the grouping key for a product, which is used to determine its letter prefix number.
 *
 * For products with SKUs, the grouping key is "sku:{SKU_VALUE}".
 * For custom shapes without SKUs, the grouping key is "shape:{SHAPE_TYPE}".
 *
 * Products with the same grouping key will receive the same number suffix.
 *
 * @param {Object} product - The product object
 * @param {Object} productTypesConfig - Configuration object for product types
 * @returns {string} Grouping key in format "sku:XXX" or "shape:YYY"
 */
const getProductGroupingKey = (product, productTypesConfig) => {
  // Normalize SKU: trim whitespace and handle empty strings as null
  const sku = product.sku?.trim();
  const hasSku = sku && sku !== "";

  // For products with SKUs, group by SKU
  // For products without SKUs (custom shapes), group by shape type
  if (hasSku) {
    return `sku:${sku}`;
  } else {
    const productType = product.product_type?.toLowerCase() || "default";
    const config = productTypesConfig[productType] || productTypesConfig.default;
    // Use the actual shape property if available, otherwise use shapeType from config,
    // with a final fallback to the default shapeType
    const shapeType = product.shape || config.shapeType || productTypesConfig.default.shapeType;
    return `shape:${shapeType}`;
  }
};

/**
 * Calculate letter prefix for a product based on its type and SKU.
 *
 * Products are assigned numbers based on their grouping key within the same letter prefix.
 * Numbers are assigned in the order that unique grouping keys first appear in the products array.
 * For example, products with prefix "O" and unique SKUs get O1, O2, O3, etc. based on insertion order.
 * Products with the same SKU get the same number (e.g., all SKU "ABC" get O1).
 * Custom shapes without SKUs are grouped by shape type (e.g., all circles get one number).
 *
 * @param {Object} product - The product to calculate prefix for
 * @param {Array} products - All products in the design
 * @param {Object} productTypesConfig - Configuration object for product types
 * @returns {string} Letter prefix with number (e.g., "O1", "P2", "D3")
 */
const getProductLetterPrefix = (product, products, productTypesConfig) => {
  const productType = product.product_type?.toLowerCase() || "default";
  const config = productTypesConfig[productType] || productTypesConfig.default;
  const letterPrefix = config.letterPrefix || "O";

  // Filter to products with the same letter prefix
  const samePrefixProducts = products.filter((p) => {
    const pType = p.product_type?.toLowerCase() || "default";
    const pConfig = productTypesConfig[pType] || productTypesConfig.default;
    const pPrefix = pConfig.letterPrefix || "O";
    return pPrefix === letterPrefix;
  });

  // Get the grouping key for this product
  const groupingKey = getProductGroupingKey(product, productTypesConfig);

  // Build a list of unique grouping keys in the order they first appear
  // This ensures O1 goes to the first unique type, O2 to the second, etc.
  const uniqueGroupingKeys = [];
  const seenKeys = new Set();
  for (const p of samePrefixProducts) {
    const key = getProductGroupingKey(p, productTypesConfig);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueGroupingKeys.push(key);
    }
  }

  // Find the index of this product's grouping key
  const groupIndex = uniqueGroupingKeys.indexOf(groupingKey);

  // If grouping key not found (shouldn't happen), return just the letter
  if (groupIndex === -1) {
    console.warn(
      `Grouping key "${groupingKey}" not found in uniqueGroupingKeys for ${productType}:`,
      uniqueGroupingKeys,
    );
    return letterPrefix;
  }

  return `${letterPrefix}${groupIndex + 1}`;
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
    isMiddlePanning = false, // Add isMiddlePanning prop to disable dragging during middle mouse panning
    isStageDragging = false, // Add isStageDragging prop to disable listening during canvas panning
    onProductClick,
    onProductDragStart,
    onProductDragEnd,
    onContextMenu,
    onGroupTransformEnd,
    textBoxes = [], // Add textBoxes support
    onTextSelect, // Add text selection handler
    onTextContextMenu, // Add text context menu handler
    onTextDoubleClick, // Add text double click handler
    renderUnselected = true, // Control rendering of unselected products
    renderSelection = true, // Control rendering of selection group
    renderTransformer = true, // Control rendering of transformer
  }) => {
    // Pre-calculate all letter prefixes efficiently to avoid O(n²) complexity during rendering
    // This optimization prevents recalculating letter prefixes for each product in the map loop
    // Uses the same logic as export.jsx for consistent numbering
    const letterPrefixMap = useMemo(() => {
      const prefixMap = new Map();

      // Build a map of letter prefixes to their filtered products
      const productsByPrefix = new Map();
      
      products.forEach((product) => {
        const productType = product.product_type?.toLowerCase() || "default";
        const config = productTypesConfig[productType] || productTypesConfig.default;
        
        // Skip products with empty letterPrefix (visual helpers like boxoutline)
        if (config.letterPrefix === "") {
          prefixMap.set(product.id, "");
          return;
        }
        
        const letterPrefix = config.letterPrefix || "O";
        
        if (!productsByPrefix.has(letterPrefix)) {
          productsByPrefix.set(letterPrefix, []);
        }
        productsByPrefix.get(letterPrefix).push(product);
      });

      // For each letter prefix, build unique grouping keys in insertion order
      const groupingKeysByPrefix = new Map();
      
      productsByPrefix.forEach((prefixProducts, letterPrefix) => {
        const uniqueGroupingKeys = [];
        const seenKeys = new Set();
        
        prefixProducts.forEach((product) => {
          const groupingKey = getProductGroupingKey(product, productTypesConfig);
          if (!seenKeys.has(groupingKey)) {
            seenKeys.add(groupingKey);
            uniqueGroupingKeys.push(groupingKey);
          }
        });
        
        groupingKeysByPrefix.set(letterPrefix, uniqueGroupingKeys);
      });

      // Assign letter prefixes based on grouping key position
      products.forEach((product) => {
        const productType = product.product_type?.toLowerCase() || "default";
        const config = productTypesConfig[productType] || productTypesConfig.default;
        
        // Skip products with empty letterPrefix (visual helpers like boxoutline)
        if (config.letterPrefix === "") {
          // Already set in the first loop
          return;
        }
        
        const letterPrefix = config.letterPrefix || "O";
        const groupingKey = getProductGroupingKey(product, productTypesConfig);

        const uniqueGroupingKeys = groupingKeysByPrefix.get(letterPrefix) || [];
        const groupIndex = uniqueGroupingKeys.indexOf(groupingKey);

        if (groupIndex !== -1) {
          prefixMap.set(product.id, `${letterPrefix}${groupIndex + 1}`);
        } else {
          prefixMap.set(product.id, letterPrefix);
        }
      });

      return prefixMap;
    }, [products]);

    // Pre-calculate stroke colors to avoid O(n²) complexity during rendering
    const strokeColorMap = useMemo(() => {
      const colorMap = new Map();
      const skuList = [...new Set(products.map((p) => p.sku).filter(Boolean))];

      products.forEach((product) => {
        // If product already has a strokeColor assigned, use it
        if (product.strokeColor) {
          colorMap.set(product.id, product.strokeColor);
          return;
        }

        const sku = product.sku;
        if (!sku) {
          colorMap.set(product.id, null); // Will use default
          return;
        }

        const skuProducts = products.filter((p) => p.sku === sku);
        if (skuProducts.length <= 1) {
          colorMap.set(product.id, null); // Will use default
          return;
        }

        // Use stored strokeColor if available
        const existingProduct = skuProducts.find((p) => p.strokeColor);
        if (existingProduct) {
          colorMap.set(product.id, existingProduct.strokeColor);
          return;
        }

        const skuIndex = skuList.indexOf(sku);
        colorMap.set(product.id, COLOR_PALETTE[skuIndex % COLOR_PALETTE.length]);
      });

      return colorMap;
    }, [products]);

    // Manually attach transformend event listener to Transformer
    // This is necessary because the Group's onTransformEnd prop doesn't fire reliably
    // IMPORTANT: Only attach listener in the instance that renders the transformer to avoid duplicates
    useEffect(() => {
      // Only attach if this instance is rendering the transformer
      if (!renderTransformer) return;
      if (!transformerRef.current || !onGroupTransformEnd) return;

      const transformer = transformerRef.current;

      const handleTransformEnd = () => {
        onGroupTransformEnd();
      };

      // Attach the event listener
      transformer.on("transformend", handleTransformEnd);

      // Cleanup
      return () => {
        transformer.off("transformend", handleTransformEnd);
      };
    }, [transformerRef, onGroupTransformEnd, renderTransformer]);

    const isPlacementMode = selectedTool === "placement" || placementMode;
    const isPanMode = selectedTool === "pan";
    const isConnectMode = selectedTool === "connect";
    const canInteract = !isPlacementMode && !isPanMode && !isConnectMode;

    // Extract product IDs and text IDs from selectedIds
    const productOnlyIds = selectedIds.filter((id) => !id.startsWith("text-"));
    const textIds = selectedIds.filter((id) => id.startsWith("text-")).map((id) => id.substring(5)); // Remove 'text-' prefix

    const hasSelection = productOnlyIds.length > 0 || textIds.length > 0;

    return (
      <>
        {/* Unselected products - individually draggable */}
        {renderUnselected &&
          products
            .filter((p) => !productOnlyIds.includes(p.id))
            .map((product) => {
              const productType = product.product_type?.toLowerCase() || "default";
              const config = productTypesConfig[productType] || productTypesConfig.default;
              const customStroke = strokeColorMap.get(product.id) || config.stroke;
              // Use explicit check for map presence to handle empty string letterPrefix
              const letterPrefix = letterPrefixMap.has(product.id) 
                ? letterPrefixMap.get(product.id) 
                : (config.letterPrefix || "O");

              return (
                <ProductShape
                  key={product.id}
                  product={product}
                  config={config}
                  isSelected={false}
                  draggable={
                    selectedTool === "select" && canInteract && !isMiddlePanning && !isStageDragging
                  }
                  listening={
                    (selectedTool === "select" || selectedTool === "connect") &&
                    !isMiddlePanning &&
                    !isStageDragging
                  } // Disable listening during middle panning AND stage dragging for performance
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
            draggable={
              (selectedTool === "select" || selectedTool === "text") &&
              canInteract &&
              !isMiddlePanning
            }
            onDragStart={(e) => {
              // Prevent dragging on middle mouse button
              if (e.evt.button === 1) {
                e.target.stopDrag();
                e.cancelBubble = true;
                e.evt.preventDefault();
                e.evt.stopPropagation();
                return false;
              }
            }}
            onDragEnd={onGroupTransformEnd}
            // Note: onTransformEnd removed - transformer event listener handles this (see useEffect above)
            // Having both caused duplicate history entries (2x for products, 4x for textboxes)
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
              const customStroke = strokeColorMap.get(product.id) || config.stroke;
              // Use explicit check for map presence to handle empty string letterPrefix
              const letterPrefix = letterPrefixMap.has(product.id) 
                ? letterPrefixMap.get(product.id) 
                : (config.letterPrefix || "O");

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
                  listening={!isDragging && !isPanMode} // Disable listening during drag and pan mode for performance
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
                  listening={!isDragging && !isPanMode} // Disable listening during drag and pan mode for performance
                  onClick={(e) => {
                    e.cancelBubble = true;
                    // Allow clicking on selected text for deselection with Ctrl/Shift
                    if (onTextSelect) {
                      const originalTextId = textBox.id;
                      onTextSelect(e, originalTextId);
                    }
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    // Allow tapping on selected text for deselection with Ctrl/Shift
                    if (onTextSelect) {
                      const originalTextId = textBox.id;
                      onTextSelect(e, originalTextId);
                    }
                  }}
                  onDblClick={(e) => {
                    e.cancelBubble = true;
                    // Only allow left mouse button double-click to edit
                    if (e.evt.button !== 0) {
                      return;
                    }
                    // Only allow double-click to edit if exactly 1 text box is selected (no products selected)
                    if (textIds.length === 1 && productOnlyIds.length === 0 && onTextDoubleClick) {
                      const originalTextId = textBox.id;
                      onTextDoubleClick(e, originalTextId);
                    }
                  }}
                  onDblTap={(e) => {
                    e.cancelBubble = true;
                    // Only allow double-tap to edit if exactly 1 text box is selected (no products selected)
                    if (textIds.length === 1 && productOnlyIds.length === 0 && onTextDoubleClick) {
                      const originalTextId = textBox.id;
                      onTextDoubleClick(e, originalTextId);
                    }
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
        {renderTransformer &&
          (selectedTool === "select" || selectedTool === "text") &&
          !isPlacementMode &&
          hasSelection && (
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
                    const isCornerAnchor =
                      activeAnchor &&
                      (activeAnchor === "top-left" ||
                        activeAnchor === "top-right" ||
                        activeAnchor === "bottom-left" ||
                        activeAnchor === "bottom-right");
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
              padding={10}
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
      prevProps.onTextSelect === nextProps.onTextSelect &&
      prevProps.onTextContextMenu === nextProps.onTextContextMenu &&
      prevProps.onGroupTransformEnd === nextProps.onGroupTransformEnd
    );
  },
);
