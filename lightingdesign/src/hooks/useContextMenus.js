/**
 * Context Menu and Color Picker Hook
 * 
 * Manages context menus, color picker, and related operations
 */

import { useState, useCallback } from 'react';

export const useContextMenus = ({
  products,
  connectors,
  selectedIds,
  selectedConnectorId,
  selectedTool,
  placementMode,
  stagePosition,
  stageScale,
  updateHistory,
  setConnectors,
  setSelectedIds,
  setSelectedConnectorId,
  setGroupKey,
  setProductDrawerVisible,
  setConnectSequence,
  applyGroupTransform,
  pendingInsertPosition,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleStageContextMenu = useCallback((e) => {
    // Always prevent default system context menu
    e.evt.preventDefault();

    // Handle right-click in connect mode to break the connection sequence
    if (selectedTool === 'connect') {
      setConnectSequence([]);
      return;
    }

    // Disable context menus in pan mode
    if (selectedTool === 'pan') return;

    // Always move our context menu to the new location
    let menuType = null;
    let menuProps = {};
    if (placementMode) {
      menuType = 'placement';
    } else if (selectedIds.length > 0) {
      menuType = 'product';
    } else if (selectedConnectorId) {
      menuType = 'connector';
    } else if (e.target === e.target.getStage()) {
      menuType = 'canvas';
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
        ...menuProps
      });
    }
  }, [
    selectedTool,
    placementMode,
    selectedIds,
    selectedConnectorId,
    stagePosition,
    stageScale,
    setConnectSequence,
  ]);

  const handleContextMenu = useCallback((e, productId) => {
    e.evt.preventDefault();
    
    // In connect mode, don't show context menu
    if (selectedTool === 'connect') {
      return;
    }
    
    if (!selectedIds.includes(productId)) {
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      setSelectedIds([productId]);
      setSelectedConnectorId(null);
      setGroupKey(k => k + 1);
    }
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, type: 'product' });
  }, [
    selectedTool,
    selectedIds,
    applyGroupTransform,
    updateHistory,
    setSelectedIds,
    setSelectedConnectorId,
    setGroupKey,
  ]);

  const handleConnectorContextMenu = useCallback((e, connectorId) => {
    e.evt.preventDefault();
    setSelectedConnectorId(connectorId);
    const transformed = applyGroupTransform();
    if (transformed) updateHistory(transformed);
    setSelectedIds([]);
    setGroupKey(k => k + 1);
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, type: 'connector' });
  }, [
    applyGroupTransform,
    updateHistory,
    setSelectedIds,
    setSelectedConnectorId,
    setGroupKey,
  ]);

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

  const handleOpenColorPicker = useCallback((e) => {
    setColorPickerAnchor(e.currentTarget);
    if (selectedIds.length > 0) {
      setColorPickerTarget({ type: 'products', ids: selectedIds });
    } else if (selectedConnectorId) {
      setColorPickerTarget({ type: 'connector', id: selectedConnectorId });
    }
    handleCloseContextMenu();
  }, [selectedIds, selectedConnectorId, handleCloseContextMenu]);

  const handleColorChange = useCallback((color) => {
    if (!colorPickerTarget) return;
    
    if (colorPickerTarget.type === 'products') {
      const transformed = applyGroupTransform();
      const baseProducts = transformed || products;
      const newProducts = baseProducts.map(p => {
        if (colorPickerTarget.ids.includes(p.id)) {
          return { ...p, color };
        }
        return p;
      });
      updateHistory(newProducts);
      setGroupKey(k => k + 1);
    } else if (colorPickerTarget.type === 'connector') {
      const newConnectors = connectors.map(c => {
        if (c.id === colorPickerTarget.id) {
          return { ...c, color };
        }
        return c;
      });
      setConnectors(newConnectors);
    }
    
    setColorPickerAnchor(null);
    setColorPickerTarget(null);
  }, [
    colorPickerTarget,
    products,
    connectors,
    applyGroupTransform,
    updateHistory,
    setConnectors,
    setGroupKey,
  ]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedConnectorId) {
      const newConnectors = connectors.filter(c => c.id !== selectedConnectorId);
      setConnectors(newConnectors);
      setSelectedConnectorId(null);
    }
    
    if (selectedIds.length > 0) {
      const transformed = applyGroupTransform();
      const baseProducts = transformed || products;
      const newProducts = baseProducts.filter(p => !selectedIds.includes(p.id));
      const newConnectors = connectors.filter(
        c => !selectedIds.includes(c.from) && !selectedIds.includes(c.to)
      );
      updateHistory(newProducts);
      setConnectors(newConnectors);
      setSelectedIds([]);
      setGroupKey(k => k + 1);
    }
    
    handleCloseContextMenu();
  }, [
    selectedIds,
    selectedConnectorId,
    products,
    connectors,
    applyGroupTransform,
    updateHistory,
    setConnectors,
    setSelectedIds,
    setSelectedConnectorId,
    setGroupKey,
    handleCloseContextMenu,
  ]);

  const handleDuplicateSelected = useCallback(() => {
    const transformed = applyGroupTransform();
    const baseProducts = transformed || products;
    const selectedProducts = baseProducts.filter(p => selectedIds.includes(p.id));
    const idMap = {};
    const newProducts = selectedProducts.map((p, index) => {
      const newId = `product-${Date.now()}-${index}`;
      idMap[p.id] = newId;
      return { ...p, id: newId, x: p.x + 30, y: p.y + 30 };
    });
    
    const selectedConnectors = connectors.filter(c => 
      selectedIds.includes(c.from) && selectedIds.includes(c.to)
    );
    
    const newConnectors = selectedConnectors.map((c, index) => ({
      ...c,
      id: `connector-${Date.now()}-${index}`,
      from: idMap[c.from],
      to: idMap[c.to],
    }));
    
    updateHistory([...baseProducts, ...newProducts]);
    setConnectors([...connectors, ...newConnectors]);
    setSelectedIds(newProducts.map(p => p.id));
    setGroupKey(k => k + 1);
    handleCloseContextMenu();
  }, [
    selectedIds,
    products,
    connectors,
    applyGroupTransform,
    updateHistory,
    setConnectors,
    setSelectedIds,
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
    handleCloseContextMenu,
    setContextMenu,
    setColorPickerAnchor,
    setColorPickerTarget,
  };
};

export default useContextMenus;
