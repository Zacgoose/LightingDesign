/**
 * Product Interaction Handlers Hook
 *
 * Manages product click, drag, and interaction logic
 */

import { useCallback } from "react";

export const useProductInteraction = ({
  products,
  selectedIds,
  selectedConnectorIds,
  selectedTool,
  isDragging,
  setIsDragging,
  setSelectedIds,
  setSelectedConnectorIds,
  setSelectedTextId,
  setGroupKey,
  updateConnectorHistory,
  setConnectSequence,
  updateHistory,
  applyGroupTransform,
  activeLayer,
  connectors,
}) => {
  const handleProductClick = useCallback(
    (e, productId) => {
      if (isDragging) return;

      // Connect mode logic
      if (selectedTool === "connect") {
        // Right-click splits the sequence
        if (e.evt?.button === 2) {
          setConnectSequence([]);
          return;
        }
        // Add to sequence if not already last
        setConnectSequence((seq) => {
          if (seq.length > 0 && seq[seq.length - 1] === productId) return seq;
          const newSeq = [...seq, productId];
          // If at least two, create connector
          if (newSeq.length >= 2) {
            const prevId = newSeq[newSeq.length - 2];
            
            // Check if a connection already exists between these two objects (in either direction)
            const connectionExists = connectors.some(
              (c) =>
                (c.from === prevId && c.to === productId) ||
                (c.from === productId && c.to === prevId)
            );
            
            // Only create connector if connection doesn't already exist
            if (!connectionExists) {
              // Get default sublayer from active layer
              const defaultSublayerId = activeLayer?.defaultSublayerId || null;
              updateConnectorHistory([
                ...connectors,
                {
                  id: `connector-${Date.now()}-${Math.random()}`,
                  from: prevId,
                  to: productId,
                  controlX: null,
                  controlY: null,
                  color: null,
                  sublayerId: defaultSublayerId,
                },
              ]);
            }
          }
          return newSeq;
        });
        return;
      }

      // Normal selection logic
      const shiftKey = e.evt?.shiftKey;
      const ctrlKey = e.evt?.ctrlKey || e.evt?.metaKey;
      if (shiftKey || ctrlKey) {
        // Ignore product clicks when connectors are already selected
        if (selectedConnectorIds.length > 0) {
          return;
        }
        if (selectedIds.includes(productId)) {
          const transformed = applyGroupTransform();
          if (transformed) updateHistory(transformed);
          setSelectedIds(selectedIds.filter((id) => id !== productId));
          setGroupKey((k) => k + 1);
        } else {
          const transformed = applyGroupTransform();
          if (transformed) updateHistory(transformed);
          setSelectedIds([...selectedIds, productId]);
          setGroupKey((k) => k + 1);
        }
      } else {
        // Only clear connector and text selections when not holding modifier keys
        setSelectedConnectorIds([]);
        setSelectedTextId(null);
        if (!selectedIds.includes(productId)) {
          const transformed = applyGroupTransform();
          if (transformed) updateHistory(transformed);
          setSelectedIds([productId]);
          setGroupKey((k) => k + 1);
        }
      }
    },
    [
      isDragging,
      selectedTool,
      selectedIds,
      selectedConnectorIds,
      applyGroupTransform,
      updateHistory,
      setSelectedIds,
      setSelectedConnectorIds,
      setSelectedTextId,
      setGroupKey,
      updateConnectorHistory,
      setConnectSequence,
      activeLayer,
      connectors,
    ],
  );

  const handleProductDragStart = useCallback(
    (e, productId) => {
      setIsDragging(true);
      if (!selectedIds.includes(productId)) {
        const shiftKey = e.evt?.shiftKey;
        const ctrlKey = e.evt?.ctrlKey || e.evt?.metaKey;

        if (shiftKey || ctrlKey) {
          setSelectedIds([...selectedIds, productId]);
        } else {
          const transformed = applyGroupTransform();
          if (transformed) updateHistory(transformed);
          setSelectedIds([productId]);
        }
        setGroupKey((k) => k + 1);
      }
    },
    [selectedIds, applyGroupTransform, updateHistory, setSelectedIds, setGroupKey, setIsDragging],
  );

  const handleProductDragEnd = useCallback(
    (e, productId) => {
      setIsDragging(false);
      const newX = e.target.x();
      const newY = e.target.y();

      if (selectedIds.includes(productId) && selectedIds.length > 1) {
        const draggedProduct = products.find((p) => p.id === productId);
        const deltaX = newX - draggedProduct.x;
        const deltaY = newY - draggedProduct.y;

        const newProducts = products.map((p) => {
          if (selectedIds.includes(p.id)) {
            return { ...p, x: p.x + deltaX, y: p.y + deltaY };
          }
          return p;
        });
        updateHistory(newProducts);
      } else {
        const newProducts = products.map((p) => {
          if (p.id === productId) {
            return { ...p, x: newX, y: newY };
          }
          return p;
        });
        updateHistory(newProducts);
      }
    },
    [selectedIds, products, updateHistory, setIsDragging],
  );

  const handleGroupTransformEnd = useCallback(() => {
    // Apply transforms to products
    if (!selectedIds.length) return;

    const transformed = applyGroupTransform();
    if (transformed) {
      updateHistory(transformed);
    }

    // Force transformer and connections to update
    setGroupKey((k) => k + 1);
  }, [selectedIds, applyGroupTransform, updateHistory, setGroupKey]);

  return {
    handleProductClick,
    handleProductDragStart,
    handleProductDragEnd,
    handleGroupTransformEnd,
  };
};

export default useProductInteraction;
