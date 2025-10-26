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
  // Following Konva best practices - stores absolute positions of selected items
  const selectionSnapshot = useMemo(() => {
    if (selectedIds.length === 0) {
      return { products: [], textBoxes: [] };
    }

    // Split IDs into products and text boxes
    const productIds = selectedIds.filter(id => !id.startsWith('text-'));
    const textIds = selectedIds
      .filter(id => id.startsWith('text-'))
      .map(id => id.substring(5)); // Remove 'text-' prefix

    // Store selected items with their absolute positions (not relative!)
    const productSnapshot = products.filter((p) => productIds.includes(p.id)).map((p) => ({ ...p }));
    const textSnapshot = textBoxes.filter((t) => textIds.includes(t.id)).map((t) => ({ ...t }));

    return {
      products: productSnapshot,
      textBoxes: textSnapshot,
    };
  }, [products, textBoxes, selectedIds]);

  // Attach transformer to selection group (following Konva example pattern)
  useEffect(() => {
    if (selectedIds.length && selectionGroupRef.current && transformerRef.current) {
      // Attach transformer to the group
      transformerRef.current.nodes([selectionGroupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds, groupKey]);

  // Apply group transform to actual product data (following Konva example pattern)
  const applyGroupTransform = useCallback(() => {
    if (!selectedIds.length || !selectionGroupRef.current) return null;

    const transform = selectionGroupRef.current.getAbsoluteTransform();
    const { scaleX: groupScaleX, scaleY: groupScaleY } = transform.decompose();

    const { products: snapshotProducts } = selectionSnapshot;

    // Transform products using absolute transform
    const transformedProducts = products.map((product) => {
      if (!selectedIds.includes(product.id) || product.id.startsWith('text-')) return product;

      const original = snapshotProducts.find((p) => p.id === product.id);
      if (!original) return product;

      // Use transform.point() to get the new position (applies rotation, scale, translation)
      const newPos = transform.point({ x: original.x, y: original.y });

      const groupRotation = selectionGroupRef.current.rotation();

      return {
        ...product,
        x: newPos.x,
        y: newPos.y,
        rotation: (original.rotation || 0) + groupRotation,
        scaleX: (original.scaleX || 1) * groupScaleX,
        scaleY: (original.scaleY || 1) * groupScaleY,
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
