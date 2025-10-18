/**
 * Selection State Management Hook
 *
 * Manages product/connector selection, group transformations,
 * and selection-related operations
 */

import { useState, useRef, useMemo, useEffect, useCallback } from "react";

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

    // Calculate average rotation including both products and text boxes
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
    
    const avgRotation = rotationCount > 0 ? totalRotation / rotationCount : 0;

    // Calculate center including both products and text boxes
    let sumX = 0;
    let sumY = 0;
    let totalCount = 0;

    productSnapshot.forEach((p) => {
      sumX += p.x;
      sumY += p.y;
      totalCount++;
    });

    textSnapshot.forEach((t) => {
      sumX += t.x;
      sumY += t.y;
      totalCount++;
    });

    const centerX = totalCount > 0 ? sumX / totalCount : 0;
    const centerY = totalCount > 0 ? sumY / totalCount : 0;

    return {
      centerX,
      centerY,
      rotation: avgRotation,
      products: productSnapshot.map((p) => {
        // Calculate relative position
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
        // Calculate relative position
        const relX = t.x - centerX;
        const relY = t.y - centerY;

        return {
          ...t,
          relativeX: relX,
          relativeY: relY,
          // Subtract average rotation to avoid double rotation when in selection group
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

      // Set the group's rotation first
      selectionGroupRef.current.rotation(currentRotation);

      // Store as initial rotation
      setInitialRotation(currentRotation);

      // Set up the transformer
      transformerRef.current.nodes([selectionGroupRef.current]);

      // Ensure the transformer's rotation matches
      transformerRef.current.rotation(currentRotation);

      // Only cache if there are multiple selected items (caching is expensive)
      // and skip caching during dragging operations
      if (selectedIds.length > 1 && !isDragging) {
        selectionGroupRef.current.cache();
      }

      // Force update
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      if (selectionGroupRef.current) {
        selectionGroupRef.current.clearCache();
      }
    }
  }, [selectedIds, groupKey, isDragging, selectionSnapshot.rotation]);

  // Apply group transform to actual product data
  const applyGroupTransform = useCallback(() => {
    if (!selectedIds.length || !selectionGroupRef.current || !selectionSnapshot.products?.length) {
      return null;
    }

    const group = selectionGroupRef.current;
    const groupX = group.x();
    const groupY = group.y();
    const groupScaleX = group.scaleX();
    const groupScaleY = group.scaleY();
    const groupRotation = group.rotation();

    // Check if the group has actually been transformed
    // If all values are at their defaults, skip the update
    if (
      groupX === selectionSnapshot.centerX &&
      groupY === selectionSnapshot.centerY &&
      groupScaleX === 1 &&
      groupScaleY === 1 &&
      groupRotation === 0
    ) {
      return null;
    }

    const { products: snapshotProducts } = selectionSnapshot;

    const transformedProducts = products.map((product) => {
      if (!selectedIds.includes(product.id)) return product;

      const original = snapshotProducts.find((p) => p.id === product.id);
      if (!original) return product;

      let relX = original.relativeX;
      let relY = original.relativeY;

      if (groupRotation !== 0) {
        const angle = (groupRotation * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedX = relX * cos - relY * sin;
        const rotatedY = relX * sin + relY * cos;
        relX = rotatedX;
        relY = rotatedY;
      }

      relX *= groupScaleX;
      relY *= groupScaleY;

      const newX = groupX + relX;
      const newY = groupY + relY;

      return {
        ...product,
        x: newX,
        y: newY,
        rotation: original.rotation + groupRotation,
        scaleX: original.scaleX * groupScaleX,
        scaleY: original.scaleY * groupScaleY,
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
