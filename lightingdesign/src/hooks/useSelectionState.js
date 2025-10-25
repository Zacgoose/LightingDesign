/**
 * Selection State Management Hook
 *
 * Manages product/connector selection, group transformations,
 * and selection-related operations
 */

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import productTypesConfig from "/src/data/productTypes.json";

export const useSelectionState = (products, textBoxes = []) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);
  const [groupKey, setGroupKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const transformerRef = useRef();
  const selectionGroupRef = useRef();

  // Selection snapshot for group transformations
  const selectionSnapshot = useMemo(() => {
    if (selectedIds.length === 0) {
      return { centerX: 0, centerY: 0, products: [], textBoxes: [], rotation: 0 };
    }

    // Split IDs into products and text boxes
    const productIds = selectedIds.filter(id => !id.startsWith('text-'));
    const textIds = selectedIds
      .filter(id => id.startsWith('text-'))
      .map(id => id.substring(5)); // Remove 'text-' prefix

    const productSnapshot = products.filter((p) => productIds.includes(p.id)).map((p) => ({ ...p }));
    const textSnapshot = textBoxes.filter((t) => textIds.includes(t.id)).map((t) => ({ ...t }));

    if (productSnapshot.length === 0 && textSnapshot.length === 0) {
      return { centerX: 0, centerY: 0, products: [], textBoxes: [], rotation: 0 };
    }

    // Calculate bounding box using visual bounds (x/y + width/height)
    const allItems = [...productSnapshot, ...textSnapshot];
    const bounds = allItems.map(item => {
      let width, height;
      
      // For text boxes, they have text property
      if (item.text) {
        // Text boxes: calculate dimensions from fontSize
        const baseFontSize = item.fontSize || 24;
        const scaleFactor = item.scaleFactor || 100;
        const renderedFontSize = baseFontSize * (scaleFactor / 100);
        width = item.width || 200;
        height = renderedFontSize * 1.2;
        console.log('[useSelectionState] Text box dimensions:', {
          id: item.id,
          baseFontSize,
          scaleFactor,
          renderedFontSize,
          width,
          height,
        });
      } else {
        // For products: calculate rendered dimensions from their configuration
        const productType = item.product_type?.toLowerCase() || "default";
        const config = productTypesConfig[productType] || productTypesConfig.default;
        const scaleFactor = item.scaleFactor || 100;
        const realWorldSize = item.realWorldSize || config.realWorldSize;
        const realWorldWidth = item.realWorldWidth || config.realWorldWidth;
        const realWorldHeight = item.realWorldHeight || config.realWorldHeight;

        if (realWorldSize) {
          width = height = realWorldSize * scaleFactor;
        } else if (realWorldWidth && realWorldHeight) {
          width = realWorldWidth * scaleFactor;
          height = realWorldHeight * scaleFactor;
        } else {
          width = config.width || 30;
          height = config.height || 30;
        }
        
        // Apply product's scale transforms
        width *= (item.scaleX || 1);
        height *= (item.scaleY || 1);
        
        console.log('[useSelectionState] Product dimensions:', {
          id: item.id,
          productType,
          scaleFactor,
          realWorldSize,
          realWorldWidth,
          realWorldHeight,
          configWidth: config.width,
          configHeight: config.height,
          scaleX: item.scaleX || 1,
          scaleY: item.scaleY || 1,
          finalWidth: width,
          finalHeight: height,
        });
      }
      
      const bounds = {
        minX: item.x - width / 2,
        maxX: item.x + width / 2,
        minY: item.y - height / 2,
        maxY: item.y + height / 2,
      };
      
      console.log('[useSelectionState] Item bounds:', {
        id: item.id,
        x: item.x,
        y: item.y,
        width,
        height,
        bounds,
      });
      
      return bounds;
    });
    const minX = bounds.length ? Math.min(...bounds.map(b => b.minX)) : 0;
    const maxX = bounds.length ? Math.max(...bounds.map(b => b.maxX)) : 0;
    const minY = bounds.length ? Math.min(...bounds.map(b => b.minY)) : 0;
    const maxY = bounds.length ? Math.max(...bounds.map(b => b.maxY)) : 0;
    // Use bounding box center as group origin
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    
    console.log('[useSelectionState] Final bounding box:', {
      minX,
      maxX,
      minY,
      maxY,
      centerX,
      centerY,
      width,
      height,
      itemCount: allItems.length,
    });

    // Calculate average rotation for single selection only
    let totalRotation = 0;
    let rotationCount = 0;
    productSnapshot.forEach((p) => {
      totalRotation += (p.rotation || 0);
      rotationCount++;
    });
    textSnapshot.forEach((t) => {
      totalRotation += (t.rotation || 0);
      rotationCount++;
    });
    const avgRotation = rotationCount === 1 ? (totalRotation / rotationCount) : 0;

    // Debug: Log all selected item positions and bounding box calculation
    console.log('[SelectionState] Selected product positions:', productSnapshot.map(p => ({ id: p.id, x: p.x, y: p.y })));
    console.log('[SelectionState] Selected text positions:', textSnapshot.map(t => ({ id: t.id, x: t.x, y: t.y })));
    console.log('[SelectionState] Bounding box:', { minX, minY, maxX, maxY, centerX, centerY });

    return {
      centerX,
      centerY,
      width,
      height,
      rotation: avgRotation,
      products: productSnapshot.map((p) => {
        // Calculate relative position from bounding box center
        const relX = p.x - centerX;
        const relY = p.y - centerY;
        return {
          ...p,
          relativeX: relX,
          relativeY: relY,
          rotation: (p.rotation || 0) - avgRotation,
        };
      }),
      textBoxes: textSnapshot.map((t) => {
        // Calculate relative position from bounding box center
        const relX = t.x - centerX;
        const relY = t.y - centerY;
        return {
          ...t,
          relativeX: relX,
          relativeY: relY,
          rotation: (t.rotation || 0) - avgRotation,
        };
      }),
    };
  }, [products, textBoxes, selectedIds]);

  // Store the initial rotation when selection changes
  const [initialRotation, setInitialRotation] = useState(0);

  // Attach transformer to selection group
  useEffect(() => {
    if (selectedIds.length && selectionGroupRef.current && transformerRef.current) {
      // Get current or initial rotation
      const currentRotation = selectionSnapshot.rotation || 0;

      console.log('[useEffect transformer] Attaching transformer', {
        selectedCount: selectedIds.length,
        currentRotation,
        groupX: selectionGroupRef.current.x(),
        groupY: selectionGroupRef.current.y(),
        centerX: selectionSnapshot.centerX,
        centerY: selectionSnapshot.centerY,
        snapshotWidth: selectionSnapshot.width,
        snapshotHeight: selectionSnapshot.height,
      });

      // Set the group's rotation first
      selectionGroupRef.current.rotation(currentRotation);

      // Store as initial rotation
      setInitialRotation(currentRotation);

      // Set up the transformer
      transformerRef.current.nodes([selectionGroupRef.current]);

      // Ensure the transformer's rotation matches
      transformerRef.current.rotation(currentRotation);

      // Get the Group's client rect to see what Konva is calculating
      const groupRect = selectionGroupRef.current.getClientRect();
      console.log('[useEffect transformer] Group client rect:', groupRect);
      
      // Get transformer bounds
      const transformerRect = transformerRef.current.getClientRect();
      console.log('[useEffect transformer] Transformer client rect:', transformerRect);

      // Force update
      transformerRef.current.getLayer()?.batchDraw();
      
      console.log('[useEffect transformer] Transformer and Group event handlers:', {
        hasGroupOnTransformEnd: typeof selectionGroupRef.current.attrs.onTransformEnd,
        hasGroupOnDragEnd: typeof selectionGroupRef.current.attrs.onDragEnd,
      });
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds, groupKey, isDragging, selectionSnapshot.rotation]);

  // Apply group transform to actual product data
  // Following Konva best practices from: https://konvajs.org/docs/sandbox/Resizing_Stress_Test.html
  const applyGroupTransform = useCallback(() => {
    if (!selectedIds.length || !selectionGroupRef.current) {
      return null;
    }

    const group = selectionGroupRef.current;
    
    // Get the absolute transform matrix from the group
    const transform = group.getAbsoluteTransform();
    
    // Decompose to get the scale factor
    const { scaleX: groupScaleX, scaleY: groupScaleY } = transform.decompose();
    
    // Check if the group has actually been transformed
    // Compare against identity transform
    const tolerance = 0.0001;
    const isIdentity = 
      Math.abs(transform.m[0] - 1) < tolerance && // scaleX
      Math.abs(transform.m[1]) < tolerance && // skewY
      Math.abs(transform.m[2]) < tolerance && // skewX
      Math.abs(transform.m[3] - 1) < tolerance && // scaleY
      Math.abs(transform.m[4]) < tolerance && // translateX relative to parent
      Math.abs(transform.m[5]) < tolerance; // translateY relative to parent
    
    if (isIdentity) {
      console.log('[applyGroupTransform] No transform detected (identity matrix), skipping update');
      return null;
    }

    console.log('[applyGroupTransform] Transform detected, applying changes', {
      matrix: transform.m,
      decomposed: transform.decompose(),
      selectedCount: selectedIds.length,
    });

    const { products: snapshotProducts } = selectionSnapshot;

    // Transform products using Konva's transform.point() for accurate position calculation
    const transformedProducts = products.map((product) => {
      const productId = product.id;
      // Skip non-selected products and text boxes (text boxes are handled separately)
      if (!selectedIds.includes(productId) || productId.startsWith('text-')) return product;

      const original = snapshotProducts?.find((p) => p.id === productId);
      if (!original) return product;

      // Use transform.point() to get the new position
      // This applies the full transform matrix (rotation + scale + translation)
      const newPos = transform.point({ 
        x: original.x, 
        y: original.y 
      });

      // For rotation and scale, we need to apply them to the product's existing values
      const groupRotation = group.rotation();
      
      // Calculate new scale - for products with realWorldSize, scale affects the size
      const productType = product.product_type?.toLowerCase() || "default";
      const config = productTypesConfig[productType] || productTypesConfig.default;
      
      // Determine if this product uses realWorldSize or direct width/height
      const usesRealWorldSize = original.realWorldSize || config.realWorldSize;
      
      let newScaleX = (original.scaleX || 1) * groupScaleX;
      let newScaleY = (original.scaleY || 1) * groupScaleY;
      
      // For products with realWorldSize, we can also update the scaleFactor
      let newScaleFactor = original.scaleFactor;
      if (usesRealWorldSize) {
        // Average the scale factors if they differ
        const avgScale = (groupScaleX + groupScaleY) / 2;
        newScaleFactor = (original.scaleFactor || 100) * avgScale;
        // Reset the scaleX/Y to 1 since we're encoding it in scaleFactor
        newScaleX = 1;
        newScaleY = 1;
      }

      return {
        ...product,
        x: newPos.x,
        y: newPos.y,
        rotation: (original.rotation || 0) + groupRotation,
        scaleX: newScaleX,
        scaleY: newScaleY,
        scaleFactor: newScaleFactor,
      };
    });

    return transformedProducts;
  }, [selectedIds, selectionSnapshot, products]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedConnectorId(null);
    setGroupKey((k) => k + 1);
  }, []);

  // Force group update
  const forceGroupUpdate = useCallback(() => {
    setGroupKey((k) => k + 1);
  }, []);

  return {
    // State
    selectedIds,
    selectedConnectorId,
    groupKey,
    isDragging,
    selectionSnapshot,
    initialRotation,

    // Refs
    transformerRef,
    selectionGroupRef,

    // Setters
    setSelectedIds,
    setSelectedConnectorId,
    setGroupKey,
    setIsDragging,

    // Helpers
    applyGroupTransform,
    clearSelection,
    forceGroupUpdate,
  };
};

export default useSelectionState;
