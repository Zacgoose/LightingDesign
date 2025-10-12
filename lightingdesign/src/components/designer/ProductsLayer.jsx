import { Group, Transformer } from "react-konva";
import { ProductShape } from "./ProductShape";
import productTypesConfig from "/src/data/productTypes.json";
import { useEffect, useRef } from "react";
import { logRender } from "/src/utils/performanceLogger";

const COLOR_PALETTE = [
  '#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2',
  '#0097a7', '#c2185b', '#5d4037', '#455a64', '#00796b',
];

const getProductStrokeColor = (product, products, defaultColor) => {
  const sku = product.sku;
  if (!sku) return defaultColor;
  const skuProducts = products.filter(p => p.sku === sku);
  if (skuProducts.length <= 1) return defaultColor;
  const skuList = [...new Set(products.map(p => p.sku).filter(Boolean))];
  const skuIndex = skuList.indexOf(sku);
  return COLOR_PALETTE[skuIndex % COLOR_PALETTE.length];
};

export const ProductsLayer = ({
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
}) => {
  // Performance monitoring
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    logRender('ProductsLayer', {
      renderCount: renderCount.current,
      productsCount: products.length,
      selectedCount: selectedIds.length,
      selectedTool,
      groupKey
    });
  });

  const isPlacementMode = selectedTool === "placement" || placementMode;
  const isPanMode = selectedTool === "pan";
  const isConnectMode = selectedTool === "connect";
  const canInteract = !isPlacementMode && !isPanMode && !isConnectMode;
  return (
    <>
      {/* Unselected products - individually draggable */}
      {products
        .filter(p => !selectedIds.includes(p.id))
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
              onDragStart={(e) => selectedTool === "select" && canInteract && onProductDragStart(e, product.id)}
              onMouseDown={(e) => {
                // Allow click in connect mode or select mode
                if (selectedTool === "connect" || selectedTool === "select") {
                  onProductClick(e, product.id);
                }
              }}
              onDragEnd={(e) => selectedTool === "select" && canInteract && onProductDragEnd(e, product.id)}
              onContextMenu={(e) => selectedTool === "select" && canInteract && onContextMenu(e, product.id)}
              customStroke={customStroke}
              theme={theme}
            />
          );
        })}

      {/* Selected products in a draggable group */}
      {selectedIds.length > 0 && (
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
          {(selectionSnapshot.products?.length > 0 
            ? selectionSnapshot.products 
            : products
                .filter(p => selectedIds.includes(p.id))
                .map(p => {
                  const centerX = products
                    .filter(prod => selectedIds.includes(prod.id))
                    .reduce((sum, prod) => sum + prod.x, 0) / selectedIds.length;
                  const centerY = products
                    .filter(prod => selectedIds.includes(prod.id))
                    .reduce((sum, prod) => sum + prod.y, 0) / selectedIds.length;
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
                  onMouseDown={(e) => (canInteract || isConnectMode) && onProductClick(e, product.id)}
                  onContextMenu={(e) => canInteract && onContextMenu(e, product.id)}
                  customStroke={customStroke}
                  theme={theme}
                />
              );
            })}
        </Group>
      )}

      {/* Transformer for selected group */}
      {selectedTool === "select" && !isPlacementMode && (
        <Transformer
          ref={transformerRef}
          rotationSnaps={rotationSnaps > 0 ? Array.from(
            { length: rotationSnaps }, 
            (_, i) => (360 / rotationSnaps) * i
          ) : undefined}
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
};