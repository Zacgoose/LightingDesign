/**
 * Selection State Management Hook
 *
 * Manages product/connector selection, group transformations,
 * and selection-related operations
 */

import { useState, useRef, useMemo, useEffect, useCallback } from "react";

export const useSelectionState = (products) => {
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
      return { centerX: 0, centerY: 0, products: [], rotation: 0 };
    }

    const snapshot = products.filter((p) => selectedIds.includes(p.id)).map((p) => ({ ...p }));

    if (snapshot.length === 0) {
      return { centerX: 0, centerY: 0, products: [], rotation: 0 };
    }

    // Calculate average rotation of selected products first
    const totalRotation = snapshot.reduce((sum, p) => sum + (p.rotation || 0), 0);
    const avgRotation = totalRotation / snapshot.length;

    // Calculate center considering rotation
    let sumX = 0;
    let sumY = 0;

    snapshot.forEach((p) => {
      // If the product is rotated, we need to adjust its position relative to the average rotation
      if (p.rotation) {
        const angle = ((p.rotation - avgRotation) * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        sumX += p.x * cos - p.y * sin;
        sumY += p.x * sin + p.y * cos;
      } else {
        sumX += p.x;
        sumY += p.y;
      }
    });

    const centerX = sumX / snapshot.length;
    const centerY = sumY / snapshot.length;

    return {
      centerX,
      centerY,
      rotation: avgRotation,
      products: snapshot.map((p) => {
        // Calculate relative position accounting for rotation
        const angle = (avgRotation * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const relX = (p.x - centerX) * cos + (p.y - centerY) * sin;
        const relY = -(p.x - centerX) * sin + (p.y - centerY) * cos;

        return {
          ...p,
          relativeX: relX,
          relativeY: relY,
          rotation: (p.rotation || 0) - avgRotation, // Store relative rotation
        };
      }),
    };
  }, [products, selectedIds]);

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
