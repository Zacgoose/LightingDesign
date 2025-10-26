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

    // Calculate bounding box using visual bounds (x/y + width/height)
    const allItems = [...productSnapshot, ...textSnapshot];
    const bounds = allItems.map(item => {
      // For products, use x/y and width/height if available
      if (item.width && item.height) {
        return {
          minX: item.x - item.width / 2,
          maxX: item.x + item.width / 2,
          minY: item.y - item.height / 2,
          maxY: item.y + item.height / 2,
        };
      } else {
        // Fallback: treat x/y as center, no size
        return {
          minX: item.x,
          maxX: item.x,
          minY: item.y,
          maxY: item.y,
        };
      }
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

      // Set the group's rotation first
      selectionGroupRef.current.rotation(currentRotation);

      // Store as initial rotation
      setInitialRotation(currentRotation);

      // Set up the transformer
      transformerRef.current.nodes([selectionGroupRef.current]);

      // Ensure the transformer's rotation matches
      transformerRef.current.rotation(currentRotation);

      // Force update
      transformerRef.current.getLayer()?.batchDraw();
      
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
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
    // Use tolerance for floating-point comparisons to avoid precision issues
    const tolerance = 0.0001;
    if (
      Math.abs(groupX - selectionSnapshot.centerX) < tolerance &&
      Math.abs(groupY - selectionSnapshot.centerY) < tolerance &&
      Math.abs(groupScaleX - 1) < tolerance &&
      Math.abs(groupScaleY - 1) < tolerance &&
      Math.abs(groupRotation - (selectionSnapshot.rotation || 0)) < tolerance
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
