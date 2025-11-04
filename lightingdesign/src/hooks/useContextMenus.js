/**
 * Context Menu and Color Picker Hook
 *
 * Manages context menus, color picker, and related operations
 */

import { useState, useCallback } from "react";

export const useContextMenus = ({
  products,
  connectors,
  selectedIds,
  selectedConnectorIds,
  selectedTool,
  placementMode,
  stagePosition,
  stageScale,
  updateHistory,
  updateConnectorHistory,
  setSelectedIds,
  setSelectedConnectorIds,
  setGroupKey,
  setProductDrawerVisible,
  setConnectSequence,
  applyGroupTransform,
  pendingInsertPosition,
  selectedTextId,
  textBoxes,
  updateTextBoxHistory,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleStageContextMenu = useCallback(
    (e) => {
      // Always prevent default system context menu
      e.evt.preventDefault();

      // Handle right-click in connect mode to break the connection sequence
      if (selectedTool === "connect") {
        setConnectSequence([]);
        return;
      }

      // Disable context menus in pan mode
      if (selectedTool === "pan") return;

      // In text mode, disable object context menus on stage
      if (selectedTool === "text") return;

      // Always move our context menu to the new location
      let menuType = null;
      let menuProps = {};
      if (placementMode) {
        menuType = "placement";
      } else if (selectedIds.length > 0) {
        menuType = "product";
      } else if (selectedConnectorIds.length > 0) {
        menuType = "connector";
      } else if (e.target === e.target.getStage()) {
        menuType = "canvas";
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        menuProps.canvasX = (pointerPosition.x - stagePosition.x) / stageScale;
        menuProps.canvasY = (pointerPosition.y - stagePosition.y) / stageScale;
      }
      if (menuType) {
        setContextMenu({
          x: e.evt.clientX,
          y: e.evt.clientY,
          type: menuType,
          ...menuProps,
        });
      }
    },
    [
      selectedTool,
      placementMode,
      selectedIds,
      selectedConnectorIds,
      stagePosition,
      stageScale,
      setConnectSequence,
    ],
  );

  const handleContextMenu = useCallback(
    (e, productId) => {
      e.evt.preventDefault();

      // In connect mode, don't show context menu
      if (selectedTool === "connect") {
        return;
      }

      if (!selectedIds.includes(productId)) {
        const transformed = applyGroupTransform();
        if (transformed) updateHistory(transformed);
        setSelectedIds([productId]);
        setSelectedConnectorIds([]);
        setGroupKey((k) => k + 1);
      }
      setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, type: "product" });
    },
    [
      selectedTool,
      selectedIds,
      applyGroupTransform,
      updateHistory,
      setSelectedIds,
      setSelectedConnectorIds,
      setGroupKey,
    ],
  );

  const handleConnectorContextMenu = useCallback(
    (e, connectorId) => {
      e.evt.preventDefault();
      
      // Handle multi-select with Shift/Ctrl
      const shiftKey = e.evt?.shiftKey;
      const ctrlKey = e.evt?.ctrlKey || e.evt?.metaKey;
      
      if (shiftKey || ctrlKey) {
        // Add to or remove from selection
        if (selectedConnectorIds.includes(connectorId)) {
          setSelectedConnectorIds(selectedConnectorIds.filter((id) => id !== connectorId));
        } else {
          setSelectedConnectorIds([...selectedConnectorIds, connectorId]);
        }
      } else {
        // Right-click without modifier keys:
        // If clicking on an already-selected connector, keep the multi-selection
        // If clicking on an unselected connector, select only that one
        if (!selectedConnectorIds.includes(connectorId)) {
          setSelectedConnectorIds([connectorId]);
        }
        // If already selected, don't change the selection (keep multi-selection)
      }
      
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      setSelectedIds([]);
      setGroupKey((k) => k + 1);
      setContextMenu({ 
        x: e.evt.clientX, 
        y: e.evt.clientY, 
        type: "connector"
      });
    },
    [selectedConnectorIds, applyGroupTransform, updateHistory, setSelectedIds, setSelectedConnectorIds, setGroupKey],
  );

  const handleInsertProductAtPosition = useCallback(() => {
    if (contextMenu?.canvasX !== undefined) {
      pendingInsertPosition.current = {
        x: contextMenu.canvasX,
        y: contextMenu.canvasY,
      };
      setProductDrawerVisible(true);
    }
    handleCloseContextMenu();
  }, [contextMenu, pendingInsertPosition, setProductDrawerVisible, handleCloseContextMenu]);

  const handleOpenColorPicker = useCallback(
    (e) => {
      setColorPickerAnchor(e.currentTarget);
      if (selectedIds.length > 0) {
        setColorPickerTarget({ type: "products", ids: selectedIds });
      } else if (selectedConnectorIds.length > 0) {
        setColorPickerTarget({ type: "connectors", ids: selectedConnectorIds });
      } else if (selectedTextId) {
        setColorPickerTarget({ type: "text", id: selectedTextId });
      }
      handleCloseContextMenu();
    },
    [selectedIds, selectedConnectorIds, selectedTextId, handleCloseContextMenu],
  );

  const handleColorChange = useCallback(
    (color) => {
      if (!colorPickerTarget) return;

      if (colorPickerTarget.type === "products") {
        const transformed = applyGroupTransform();
        const baseProducts = transformed || products;
        const newProducts = baseProducts.map((p) => {
          if (colorPickerTarget.ids.includes(p.id)) {
            return { ...p, color };
          }
          return p;
        });
        updateHistory(newProducts);
        setGroupKey((k) => k + 1);
      } else if (colorPickerTarget.type === "connectors") {
        const newConnectors = connectors.map((c) => {
          if (colorPickerTarget.ids.includes(c.id)) {
            return { ...c, color };
          }
          return c;
        });
        updateConnectorHistory(newConnectors);
      } else if (colorPickerTarget.type === "text") {
        if (updateTextBoxHistory) {
          const updatedTextBoxes = textBoxes.map((box) => 
            box.id === colorPickerTarget.id ? { ...box, color } : box
          );
          updateTextBoxHistory(updatedTextBoxes);
        }
      }

      setColorPickerAnchor(null);
      setColorPickerTarget(null);
    },
    [
      colorPickerTarget,
      products,
      connectors,
      textBoxes,
      applyGroupTransform,
      updateHistory,
      updateConnectorHistory,
      updateTextBoxHistory,
      setGroupKey,
    ],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedConnectorIds.length > 0) {
      const newConnectors = connectors.filter((c) => !selectedConnectorIds.includes(c.id));
      updateConnectorHistory(newConnectors);
      setSelectedConnectorIds([]);
    }

    if (selectedTextId && updateTextBoxHistory) {
      updateTextBoxHistory(textBoxes.filter((box) => box.id !== selectedTextId));
    }

    if (selectedIds.length > 0) {
      const transformed = applyGroupTransform();
      const baseProducts = transformed || products;
      const newProducts = baseProducts.filter((p) => !selectedIds.includes(p.id));
      const newConnectors = connectors.filter(
        (c) => !selectedIds.includes(c.from) && !selectedIds.includes(c.to),
      );
      updateHistory(newProducts);
      updateConnectorHistory(newConnectors);
      setSelectedIds([]);
      setGroupKey((k) => k + 1);
    }

    handleCloseContextMenu();
  }, [
    selectedIds,
    selectedConnectorIds,
    selectedTextId,
    products,
    connectors,
    textBoxes,
    applyGroupTransform,
    updateHistory,
    updateConnectorHistory,
    updateTextBoxHistory,
    setSelectedIds,
    setSelectedConnectorIds,
    setGroupKey,
    handleCloseContextMenu,
  ]);

  const handleDuplicateSelected = useCallback(() => {
    const transformed = applyGroupTransform();
    const baseProducts = transformed || products;
    const selectedProducts = baseProducts.filter((p) => selectedIds.includes(p.id));
    const idMap = {};
    const newProducts = selectedProducts.map((p, index) => {
      const newId = `product-${Date.now()}-${index}`;
      idMap[p.id] = newId;
      return { ...p, id: newId, x: p.x + 30, y: p.y + 30 };
    });

    const selectedConnectors = connectors.filter(
      (c) => selectedIds.includes(c.from) && selectedIds.includes(c.to),
    );

    const newConnectors = selectedConnectors.map((c, index) => ({
      ...c,
      id: `connector-${Date.now()}-${index}`,
      from: idMap[c.from],
      to: idMap[c.to],
    }));

    updateHistory([...baseProducts, ...newProducts]);
    updateConnectorHistory([...connectors, ...newConnectors]);
    setSelectedIds(newProducts.map((p) => p.id));
    setGroupKey((k) => k + 1);
    handleCloseContextMenu();
  }, [
    selectedIds,
    products,
    connectors,
    applyGroupTransform,
    updateHistory,
    updateConnectorHistory,
    setSelectedIds,
    setGroupKey,
    handleCloseContextMenu,
  ]);

  const handleResetConnectorToStraight = useCallback(() => {
    if (selectedConnectorIds.length > 0) {
      const newConnectors = connectors.map((c) => {
        if (selectedConnectorIds.includes(c.id)) {
          // Reset control points to null so they default to straight positioning
          return { ...c, control1: null, control3: null };
        }
        return c;
      });
      updateConnectorHistory(newConnectors);
    }
    handleCloseContextMenu();
  }, [selectedConnectorIds, connectors, updateConnectorHistory, handleCloseContextMenu]);

  const handleAlignHorizontalCenter = useCallback(() => {
    // Only align if multiple objects are selected
    if (selectedIds.length < 2) {
      handleCloseContextMenu();
      return;
    }

    const transformed = applyGroupTransform();
    const baseProducts = transformed || products;
    
    // Separate product IDs and text IDs
    const productIds = selectedIds.filter((id) => !id.startsWith("text-"));
    const textIds = selectedIds.filter((id) => id.startsWith("text-")).map((id) => id.substring(5));
    
    // Get selected products and text boxes
    const selectedProducts = baseProducts.filter((p) => productIds.includes(p.id));
    const selectedTextBoxes = textBoxes.filter((t) => textIds.includes(t.id));
    
    // Calculate average X position (align horizontal centers - center along the horizontal axis)
    const allXPositions = [
      ...selectedProducts.map((p) => p.x),
      ...selectedTextBoxes.map((t) => t.x),
    ];
    
    if (allXPositions.length === 0) {
      handleCloseContextMenu();
      return;
    }
    
    const averageX = allXPositions.reduce((sum, x) => sum + x, 0) / allXPositions.length;
    
    // Update products to align to average X
    if (productIds.length > 0) {
      const alignedProducts = baseProducts.map((p) => {
        if (productIds.includes(p.id)) {
          return { ...p, x: averageX };
        }
        return p;
      });
      updateHistory(alignedProducts);
    }
    
    // Update text boxes to align to average X
    if (textIds.length > 0) {
      const alignedTextBoxes = textBoxes.map((t) => {
        if (textIds.includes(t.id)) {
          return { ...t, x: averageX };
        }
        return t;
      });
      updateTextBoxHistory(alignedTextBoxes);
    }
    
    setGroupKey((k) => k + 1);
    handleCloseContextMenu();
  }, [
    selectedIds,
    products,
    textBoxes,
    applyGroupTransform,
    updateHistory,
    updateTextBoxHistory,
    setGroupKey,
    handleCloseContextMenu,
  ]);

  const handleAlignVerticalCenter = useCallback(() => {
    // Only align if multiple objects are selected
    if (selectedIds.length < 2) {
      handleCloseContextMenu();
      return;
    }

    const transformed = applyGroupTransform();
    const baseProducts = transformed || products;
    
    // Separate product IDs and text IDs
    const productIds = selectedIds.filter((id) => !id.startsWith("text-"));
    const textIds = selectedIds.filter((id) => id.startsWith("text-")).map((id) => id.substring(5));
    
    // Get selected products and text boxes
    const selectedProducts = baseProducts.filter((p) => productIds.includes(p.id));
    const selectedTextBoxes = textBoxes.filter((t) => textIds.includes(t.id));
    
    // Calculate average Y position (align vertical centers - center along the vertical axis)
    const allYPositions = [
      ...selectedProducts.map((p) => p.y),
      ...selectedTextBoxes.map((t) => t.y),
    ];
    
    if (allYPositions.length === 0) {
      handleCloseContextMenu();
      return;
    }
    
    const averageY = allYPositions.reduce((sum, y) => sum + y, 0) / allYPositions.length;
    
    // Update products to align to average Y
    if (productIds.length > 0) {
      const alignedProducts = baseProducts.map((p) => {
        if (productIds.includes(p.id)) {
          return { ...p, y: averageY };
        }
        return p;
      });
      updateHistory(alignedProducts);
    }
    
    // Update text boxes to align to average Y
    if (textIds.length > 0) {
      const alignedTextBoxes = textBoxes.map((t) => {
        if (textIds.includes(t.id)) {
          return { ...t, y: averageY };
        }
        return t;
      });
      updateTextBoxHistory(alignedTextBoxes);
    }
    
    setGroupKey((k) => k + 1);
    handleCloseContextMenu();
  }, [
    selectedIds,
    products,
    textBoxes,
    applyGroupTransform,
    updateHistory,
    updateTextBoxHistory,
    setGroupKey,
    handleCloseContextMenu,
  ]);

  return {
    contextMenu,
    colorPickerAnchor,
    colorPickerTarget,
    handleStageContextMenu,
    handleContextMenu,
    handleConnectorContextMenu,
    handleInsertProductAtPosition,
    handleOpenColorPicker,
    handleColorChange,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleResetConnectorToStraight,
    handleAlignHorizontalCenter,
    handleAlignVerticalCenter,
    handleCloseContextMenu,
    setContextMenu,
    setColorPickerAnchor,
    setColorPickerTarget,
  };
};

export default useContextMenus;
