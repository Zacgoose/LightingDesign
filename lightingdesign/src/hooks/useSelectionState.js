/**
 * Simple Selection State Management Hook
 * 
 * Manages selection state with minimal complexity
 * Following Konva example pattern from logs.txt
 */

import { useState, useRef, useEffect, useCallback } from "react";

export const useSelectionState = (products, textBoxes = []) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);
  const [groupKey, setGroupKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for Konva nodes
  const transformerRef = useRef();
  const selectionGroupRef = useRef();
  
  // Snapshot captured when selection changes (not when products change!)
  // Using state so components re-render when snapshot changes
  const [selectionSnapshot, setSelectionSnapshot] = useState({ products: [], textBoxes: [] });

  // Capture snapshot when selection changes or group resets (NOT when products change!)
  useEffect(() => {
    if (selectedIds.length === 0) {
      setSelectionSnapshot({ products: [], textBoxes: [] });
      return;
    }

    const productIds = selectedIds.filter(id => !id.startsWith('text-'));
    const textIds = selectedIds
      .filter(id => id.startsWith('text-'))
      .map(id => id.substring(5));

    // Capture current products/textBoxes at this moment
    // This won't re-run when products change, only when selection/groupKey changes
    setSelectionSnapshot({
      products: products.filter(p => productIds.includes(p.id)).map(p => ({ ...p })),
      textBoxes: textBoxes.filter(t => textIds.includes(t.id)).map(t => ({ ...t })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, groupKey]); // Intentionally NOT including products/textBoxes

  // Attach transformer to group
  useEffect(() => {
    if (selectedIds.length && selectionGroupRef.current && transformerRef.current) {
      transformerRef.current.nodes([selectionGroupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds, groupKey]);

  // Helper: Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedConnectorId(null);
    setGroupKey((k) => k + 1);
  }, []);

  // Helper: Force group update
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
    clearSelection,
    forceGroupUpdate,
  };
};

export default useSelectionState;
