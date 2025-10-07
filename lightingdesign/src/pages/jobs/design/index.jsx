import { useRouter } from "next/router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Box, Container, Card, CardContent, useTheme } from "@mui/material";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { DesignerToolbarRow } from "/src/components/designer/DesignerToolbarRow";
import { DesignerCanvas } from "/src/components/designer/DesignerCanvas";
import { ProductSelectionDrawer } from "/src/components/designer/ProductSelectionDrawer";
import { ContextMenus } from "/src/components/designer/ContextMenus";
import { ColorPickerPopover } from "/src/components/designer/ColorPickerPopover";
import { ConnectionModeBanner } from "/src/components/designer/ConnectionModeBanner";
import { ProductsLayer } from "/src/components/designer/ProductsLayer";
import { ConnectorsLayer } from "/src/components/designer/ConnectorsLayer";
import { ProductShape } from "/src/components/designer/ProductShape";
import { ScaleButton } from "/src/components/designer/ScaleButton";
import { useHistory } from "/src/hooks/useHistory";
import { useKeyboardShortcuts } from "/src/hooks/useKeyboardShortcuts";
import productTypesConfig from "/src/data/productTypes.json";

const Page = () => {
  // Middle mouse pan handler
  const handleCanvasPan = (dx, dy) => {
    setStagePosition(pos => ({ x: pos.x + dx, y: pos.y + dy }));
  };
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();

  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(4200);
  const [canvasHeight, setCanvasHeight] = useState(2970);
  const [stagePosition, setStagePosition] = useState({ 
    x: canvasWidth / 2, 
    y: canvasHeight / 2 
  });

  // View options
  const [showGrid, setShowGrid] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [selectedTool, setSelectedTool] = useState("select");
  const [rotationSnaps, setRotationSnaps] = useState(8);
  
  // Placement mode
  const [placementMode, setPlacementMode] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Products and connectors with history
  const {
    state: products,
    updateHistory,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  } = useHistory([]);
  
  const [connectors, setConnectors] = useState([]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);
  const [groupKey, setGroupKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Scale dialog state
  const [scaleDialogOpen, setScaleDialogOpen] = useState(false);
  const [scaleValue, setScaleValue] = useState(1);

  // Handler for context menu 'Scale...'
  const handleOpenScaleDialog = () => {
    setScaleDialogOpen(true);
    handleCloseContextMenu();
  };

  // Handler for applying scale to selected products
  const handleScaleConfirm = (scaleValue) => {
    applyGroupTransform();
    // For each selected product, set its real-world size attribute based on dialog input (meters)
    const newProducts = products.map(product => {
      if (!selectedIds.includes(product.id)) return product;
      // Get product type config
      const config = productTypesConfig[product.type] || productTypesConfig.default;
      let updated = { ...product };
      if (productTypesConfig[product.type]) {
        // Known type
        if (config.realWorldSize !== undefined) {
          updated.realWorldSize = scaleValue;
        }
        if (config.realWorldWidth !== undefined && config.realWorldHeight !== undefined) {
          updated.realWorldWidth = scaleValue;
          updated.realWorldHeight = scaleValue;
        } else if (config.realWorldWidth !== undefined) {
          updated.realWorldWidth = scaleValue;
        } else if (config.realWorldHeight !== undefined) {
          updated.realWorldHeight = scaleValue;
        }
      } else {
        // Fallback/default type: always set both width and height
        updated.realWorldWidth = scaleValue;
        updated.realWorldHeight = scaleValue;
      }
      // Always update scaleFactor for rendering
      updated.scaleFactor = scaleFactor;
      return updated;
    });
    updateHistory(newProducts);
    setGroupKey(k => k + 1);
    setScaleDialogOpen(false);
  };

  // Connection mode
  const [connectMode, setConnectMode] = useState(null);

  // UI state
  const [contextMenu, setContextMenu] = useState(null);
  const [productDrawerVisible, setProductDrawerVisible] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);

  // Refs
  const clipboard = useRef({ products: [], connectors: [] });
  const transformerRef = useRef();
  const selectionGroupRef = useRef();
  const pendingInsertPosition = useRef(null);
  const canvasContainerRef = useRef();

  // Background and Scale
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [scaleFactor, setScaleFactor] = useState(100); // 100px per meter
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [objectScaleFactor, setObjectScaleFactor] = useState(1); // For future use
  const [backgroundImageNaturalSize, setBackgroundImageNaturalSize] = useState(null);

  // Selection snapshot for group transformations
  const selectionSnapshot = useMemo(() => {
    if (selectedIds.length === 0) {
      return { centerX: 0, centerY: 0, products: [] };
    }

    const snapshot = products
      .filter(p => selectedIds.includes(p.id))
      .map(p => ({ ...p }));
    
    if (snapshot.length === 0) {
      return { centerX: 0, centerY: 0, products: [] };
    }

    const centerX = snapshot.reduce((sum, p) => sum + p.x, 0) / snapshot.length;
    const centerY = snapshot.reduce((sum, p) => sum + p.y, 0) / snapshot.length;
    
    return {
      centerX,
      centerY,
      products: snapshot.map(p => ({
        ...p,
        relativeX: p.x - centerX,
        relativeY: p.y - centerY,
      })),
    };
  }, [products, selectedIds]);

  // Attach transformer to selection group
  useEffect(() => {
    if (selectedIds.length && selectionGroupRef.current && transformerRef.current) {
      transformerRef.current.nodes([selectionGroupRef.current]);
      selectionGroupRef.current.cache();
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      if (selectionGroupRef.current) {
        selectionGroupRef.current.clearCache();
      }
    }
  }, [selectedIds, groupKey]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasWidth(rect.width);
        setCanvasHeight(rect.height);
        setStagePosition({
          x: rect.width / 2,
          y: rect.height / 2,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Apply group transform to actual product data
  const applyGroupTransform = () => {
    if (!selectedIds.length || !selectionGroupRef.current || !selectionSnapshot.products?.length) return;

    const group = selectionGroupRef.current;
    const groupX = group.x();
    const groupY = group.y();
    const groupScaleX = group.scaleX();
    const groupScaleY = group.scaleY();
    const groupRotation = group.rotation();
    
    const { products: snapshotProducts } = selectionSnapshot;
    
    const newProducts = products.map((product) => {
      if (!selectedIds.includes(product.id)) return product;
      
      const original = snapshotProducts.find(p => p.id === product.id);
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
    
    updateHistory(newProducts);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    products,
    selectedIds,
    selectedConnectorId,
    connectors,
    clipboard,
    onCopy: () => {
      const selectedProducts = products.filter(p => selectedIds.includes(p.id));
      const selectedConnectors = connectors.filter(c => 
        selectedIds.includes(c.from) && selectedIds.includes(c.to)
      );
      clipboard.current = {
        products: selectedProducts.map(p => ({ ...p })),
        connectors: selectedConnectors.map(c => ({ ...c })),
      };
    },
    onPaste: () => {
      applyGroupTransform();
      const idMap = {};
      const newProducts = clipboard.current.products.map((p, index) => {
        const newId = `product-${Date.now()}-${index}`;
        idMap[p.id] = newId;
        return { ...p, id: newId, x: p.x + 20, y: p.y + 20 };
      });
      
      const newConnectors = (clipboard.current.connectors || []).map((c, index) => ({
        ...c,
        id: `connector-${Date.now()}-${index}`,
        from: idMap[c.from],
        to: idMap[c.to],
      }));
      
      updateHistory([...products, ...newProducts]);
      setConnectors([...connectors, ...newConnectors]);
      setSelectedIds(newProducts.map(p => p.id));
      setGroupKey(k => k + 1);
    },
    onDelete: () => handleDeleteSelected(),
    onSelectAll: () => {
      applyGroupTransform();
      setSelectedIds(products.map(p => p.id));
      setGroupKey(k => k + 1);
    },
    onEscape: () => {
      if (placementMode) {
        setPlacementMode(null);
        setSelectedTool("select");
        return;
      }
      applyGroupTransform();
      setSelectedIds([]);
      setSelectedConnectorId(null);
      setConnectMode(null);
      setGroupKey(k => k + 1);
    },
    onUndo: () => {
      applyGroupTransform();
      handleUndo();
      setSelectedIds([]);
      setGroupKey(k => k + 1);
    },
    onRedo: () => {
      applyGroupTransform();
      handleRedo();
      setSelectedIds([]);
      setGroupKey(k => k + 1);
    },
  });

  const handleUploadFloorPlan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new window.Image();
          img.onload = () => {
            setBackgroundImage(ev.target.result);
            setBackgroundImageNaturalSize({ width: img.width, height: img.height });
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleMeasure = () => {
    setMeasureMode(true);
    setMeasurePoints([]);
  };

  const handleCanvasMeasureClick = (e) => {
    if (!measureMode) return;
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const canvasPos = {
      x: (pointerPosition.x - stagePosition.x) / stageScale,
      y: (pointerPosition.y - stagePosition.y) / stageScale,
    };
    setMeasurePoints(points => {
      const newPoints = [...points, canvasPos];
      if (newPoints.length === 2) {
        // Prompt for real-world distance
        const pixelDistance = Math.sqrt(
          Math.pow(newPoints[1].x - newPoints[0].x, 2) +
          Math.pow(newPoints[1].y - newPoints[0].y, 2)
        );
        const input = window.prompt("Enter real-world distance between points (meters):", "1");
        const realDistance = parseFloat(input);
        if (realDistance > 0 && pixelDistance > 0) {
          setScaleFactor(pixelDistance / realDistance);
        }
        setMeasureMode(false);
        return [];
      }
      return newPoints;
    });
  };

  // Context menu handlers
  const handleOpenColorPicker = (e) => {
    setColorPickerAnchor(e.currentTarget);
    if (selectedIds.length > 0) {
      setColorPickerTarget({ type: 'products', ids: selectedIds });
    } else if (selectedConnectorId) {
      setColorPickerTarget({ type: 'connector', id: selectedConnectorId });
    }
    handleCloseContextMenu();
  };

  const handleColorChange = (color) => {
    if (!colorPickerTarget) return;
    
    if (colorPickerTarget.type === 'products') {
      applyGroupTransform();
      const newProducts = products.map(p => {
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
  };

  const handleStageContextMenu = (e) => {
    e.evt.preventDefault();
    
    if (placementMode) {
      // Show placement context menu at mouse position
      setContextMenu({
        x: e.evt.clientX,
        y: e.evt.clientY,
        type: 'placement',
      });
      return;
    }
    
    if (selectedIds.length > 0) {
      setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, type: 'product' });
      return;
    }
    
    if (selectedConnectorId) {
      setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, type: 'connector' });
      return;
    }
    
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = {
        x: (pointerPosition.x - stagePosition.x) / stageScale,
        y: (pointerPosition.y - stagePosition.y) / stageScale,
      };
      
      setContextMenu({
        x: e.evt.clientX,
        y: e.evt.clientY,
        type: 'canvas',
        canvasX: canvasPos.x,
        canvasY: canvasPos.y,
      });
    }
  };

  const handleInsertProductAtPosition = () => {
    if (contextMenu?.canvasX !== undefined) {
      pendingInsertPosition.current = {
        x: contextMenu.canvasX,
        y: contextMenu.canvasY,
      };
      setProductDrawerVisible(true);
    }
    handleCloseContextMenu();
  };

  const handleContextMenu = (e, productId) => {
    e.evt.preventDefault();
    if (!selectedIds.includes(productId)) {
      applyGroupTransform();
      setSelectedIds([productId]);
      setSelectedConnectorId(null);
      setGroupKey(k => k + 1);
    }
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, type: 'product' });
  };

  const handleConnectorContextMenu = (e, connectorId) => {
    e.evt.preventDefault();
    setSelectedConnectorId(connectorId);
    applyGroupTransform();
    setSelectedIds([]);
    setGroupKey(k => k + 1);
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, type: 'connector' });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleSwapPlacementProduct = () => {
    setProductDrawerVisible(true);
    handleCloseContextMenu();
  };

  const handleDeleteSelected = () => {
    if (selectedConnectorId) {
      const newConnectors = connectors.filter(c => c.id !== selectedConnectorId);
      setConnectors(newConnectors);
      setSelectedConnectorId(null);
    }
    
    if (selectedIds.length > 0) {
      applyGroupTransform();
      const newProducts = products.filter(p => !selectedIds.includes(p.id));
      const newConnectors = connectors.filter(
        c => !selectedIds.includes(c.from) && !selectedIds.includes(c.to)
      );
      updateHistory(newProducts);
      setConnectors(newConnectors);
      setSelectedIds([]);
      setGroupKey(k => k + 1);
    }
    
    handleCloseContextMenu();
  };

  const handleDuplicateSelected = () => {
    applyGroupTransform();
    const selectedProducts = products.filter(p => selectedIds.includes(p.id));
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
    
    updateHistory([...products, ...newProducts]);
    setConnectors([...connectors, ...newConnectors]);
    setSelectedIds(newProducts.map(p => p.id));
    setGroupKey(k => k + 1);
    handleCloseContextMenu();
  };

  const handleStartConnect = () => {
    if (selectedIds.length > 0) {
      setConnectMode({ fromIds: selectedIds });
    }
    handleCloseContextMenu();
  };

  const handleResetScale = () => {
    applyGroupTransform();
    const newProducts = products.map(product => {
      if (!selectedIds.includes(product.id)) return product;
      return { ...product, scaleX: 1, scaleY: 1 };
    });
    updateHistory(newProducts);
    setGroupKey(k => k + 1);
    handleCloseContextMenu();
  };

  const handleProductAdd = (product) => {
    // Enter placement mode with the selected product
    setPlacementMode({
      template: product,
    });
    setSelectedTool("placement");
    setProductDrawerVisible(false); // Close the drawer
    pendingInsertPosition.current = null;
  };

  const createProductFromTemplate = (template, x, y) => {
    return {
      id: `product-${Date.now()}-${Math.random()}`,
      x,
      y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      color: null,
      name: template.name,
      sku: template.sku,
      brand: template.brand,
      product_type: template.product_type_unigram,
      price: parseFloat(template.price) || 0,
      msrp: parseFloat(template.msrp) || 0,
      imageUrl: template.imageUrl,
      thumbnailUrl: template.thumbnailImageUrl,
      category: template.top_web_category,
      categories: template.category_hierarchy || [],
      description: template.short_description,
      colors: template.item_colours || [],
      inStock: template.ss_in_stock === "1",
      stockQty: parseInt(template.stock_qty) || 0,
      metadata: template,
      quantity: 1,
      notes: "",
      customLabel: "",
    };
  };

  const handleCanvasClick = (e) => {
    if (placementMode && e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = {
        x: (pointerPosition.x - stagePosition.x) / stageScale,
        y: (pointerPosition.y - stagePosition.y) / stageScale,
      };
      
      const newProduct = createProductFromTemplate(placementMode.template, canvasPos.x, canvasPos.y);
      updateHistory([...products, newProduct]);
      // Stay in placement mode so user can place more
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!placementMode) return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      // Convert screen position to canvas position
      const canvasPos = {
        x: (pointerPosition.x - stagePosition.x) / stageScale,
        y: (pointerPosition.y - stagePosition.y) / stageScale,
      };
      setCursorPosition(canvasPos);
    }
  };

  const handleStopPlacement = () => {
    setPlacementMode(null);
    setSelectedTool("select");
  };

  const handleProductClick = (e, productId) => {
    if (isDragging) return;
    setSelectedConnectorId(null);
    
    if (connectMode) {
      if (connectMode.fromIds && !connectMode.fromIds.includes(productId)) {
        const newConnectors = connectMode.fromIds.map(fromId => ({
          id: `connector-${Date.now()}-${fromId}`,
          from: fromId,
          to: productId,
          controlX: null,
          controlY: null,
          color: null,
        }));
        
        setConnectors([...connectors, ...newConnectors]);
        setConnectMode(null);
        return;
      } else {
        setConnectMode(null);
        return;
      }
    }

    const shiftKey = e.evt?.shiftKey;
    const ctrlKey = e.evt?.ctrlKey || e.evt?.metaKey;
    
    if (shiftKey || ctrlKey) {
      if (selectedIds.includes(productId)) {
        applyGroupTransform();
        setSelectedIds(selectedIds.filter(id => id !== productId));
        setGroupKey(k => k + 1);
      } else {
        applyGroupTransform();
        setSelectedIds([...selectedIds, productId]);
        setGroupKey(k => k + 1);
      }
    } else {
      if (!selectedIds.includes(productId)) {
        applyGroupTransform();
        setSelectedIds([productId]);
        setGroupKey(k => k + 1);
      }
    }
  };

  const handleProductDragStart = (e, productId) => {
    setIsDragging(true);
    if (!selectedIds.includes(productId)) {
      const shiftKey = e.evt?.shiftKey;
      const ctrlKey = e.evt?.ctrlKey || e.evt?.metaKey;
      
      if (shiftKey || ctrlKey) {
        setSelectedIds([...selectedIds, productId]);
      } else {
        applyGroupTransform();
        setSelectedIds([productId]);
      }
      setGroupKey(k => k + 1);
    }
  };

  const handleProductDragEnd = (e, productId) => {
    setIsDragging(false);
    const newX = e.target.x();
    const newY = e.target.y();
    
    if (selectedIds.includes(productId) && selectedIds.length > 1) {
      const draggedProduct = products.find(p => p.id === productId);
      const deltaX = newX - draggedProduct.x;
      const deltaY = newY - draggedProduct.y;
      
      const newProducts = products.map(p => {
        if (selectedIds.includes(p.id)) {
          return { ...p, x: p.x + deltaX, y: p.y + deltaY };
        }
        return p;
      });
      updateHistory(newProducts);
    } else {
      const newProducts = products.map(p => {
        if (p.id === productId) {
          return { ...p, x: newX, y: newY };
        }
        return p;
      });
      updateHistory(newProducts);
    }
  };

  const handleGroupDragEnd = () => {
    applyGroupTransform();
    setGroupKey(k => k + 1);
  };

  // Canvas handlers
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleStageDragEnd = (e) => {
    if (e.target === e.target.getStage()) {
      setStagePosition({ x: e.target.x(), y: e.target.y() });
    }
  };

  const checkDeselect = (e) => {
    if (e.evt.button !== 0) return;
    
    // Don't handle clicks in pan mode
    if (selectedTool === "pan") return;
    
    // Handle placement mode clicks
    if (placementMode) {
      handleCanvasClick(e);
      return;
    }
    
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      applyGroupTransform();
      setSelectedIds([]);
      setSelectedConnectorId(null);
      setConnectMode(null);
      setGroupKey(k => k + 1);
    }
  };

  // Toolbar handlers
  const handleZoomIn = () => setStageScale(stageScale * 1.5);
  const handleZoomOut = () => setStageScale(stageScale / 1.5);
  const handleResetView = () => {
    setStageScale(1);
    setStagePosition({ x: canvasWidth / 2, y: canvasHeight / 2 });
  };

  const handleSave = () => {
    applyGroupTransform();
    console.log("Save project", { products, connectors });
  };

  const handleExport = () => {
    applyGroupTransform();
    console.log("Export project", { products, connectors });
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", minHeight: 0 }}>
        <Container maxWidth={false} sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

          <div style={{ height: 4 }} />

          <DesignerToolbarRow
            mainProps={{
              onUploadFloorPlan: handleUploadFloorPlan,
              onSave: handleSave,
              onExport: handleExport,
              onUndo: handleUndo,
              onRedo: handleRedo,
              canUndo: canUndo,
              canRedo: canRedo,
              onMeasure: handleMeasure,
            }}
            viewProps={{
              showGrid: showGrid,
              onToggleGrid: () => setShowGrid(!showGrid),
              showMeasurements: showMeasurements,
              onToggleMeasurements: () => setShowMeasurements(!showMeasurements),
              onZoomIn: handleZoomIn,
              onZoomOut: handleZoomOut,
              onResetView: handleResetView,
              zoomLevel: stageScale,
              rotationSnaps: rotationSnaps,
              onRotationSnapsChange: setRotationSnaps,
            }}
            toolsProps={{
              selectedTool: selectedTool,
              onToolChange: setSelectedTool,
              placementMode: placementMode,
              onStopPlacement: handleStopPlacement,
            }}
          />

          <Box sx={{ mb: 0.75 }}>
            <ProductSelectionDrawer 
              onProductSelect={handleProductAdd}
              visible={productDrawerVisible}
              onOpen={() => setProductDrawerVisible(true)}
              onClose={() => {
                setProductDrawerVisible(false);
                pendingInsertPosition.current = null;
              }}
            />
          </Box>

          <ConnectionModeBanner connectMode={connectMode} />

          <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 }, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Box
                ref={canvasContainerRef}
                sx={{
                  flex: 1,
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden", // prevents scrollbars
                  minHeight: 0,
                }}
              >
                <DesignerCanvas
                  width={canvasWidth}
                  height={canvasHeight}
                  stageScale={stageScale}
                  stagePosition={stagePosition}
                  showGrid={showGrid}
                  onWheel={handleWheel}
                  onDragEnd={handleStageDragEnd}
                  draggable={selectedTool === "pan" && !placementMode}
                  onMouseDown={measureMode ? handleCanvasMeasureClick : checkDeselect}
                  onTouchStart={checkDeselect}
                  onMouseMove={handleCanvasMouseMove}
                  onContextMenu={handleStageContextMenu}
                  selectedCount={selectedIds.length}
                  backgroundImage={backgroundImage}
                  backgroundImageNaturalSize={backgroundImageNaturalSize}
                  scaleFactor={scaleFactor}
                  onPan={handleCanvasPan}
                >
                  <ConnectorsLayer
                    connectors={connectors}
                    products={products}
                    selectedConnectorId={selectedConnectorId}
                    selectedTool={selectedTool}
                    theme={theme}
                    onConnectorSelect={(e) => {
                      e.cancelBubble = true;
                      applyGroupTransform();
                      setSelectedConnectorId(e.target.id());
                      setSelectedIds([]);
                      setGroupKey(k => k + 1);
                    }}
                    onConnectorChange={setConnectors}
                    onConnectorContextMenu={handleConnectorContextMenu}
                  />

                  <ProductsLayer
                    products={products}
                    selectedIds={selectedIds}
                    selectedTool={selectedTool}
                    selectionSnapshot={selectionSnapshot}
                    selectionGroupRef={selectionGroupRef}
                    transformerRef={transformerRef}
                    rotationSnaps={rotationSnaps}
                    theme={theme}
                    groupKey={groupKey}
                    placementMode={placementMode}
                    onProductClick={handleProductClick}
                    onProductDragStart={handleProductDragStart}
                    onProductDragEnd={handleProductDragEnd}
                    onContextMenu={handleContextMenu}
                    onGroupDragEnd={handleGroupDragEnd}
                  />

                  {/* Ghost product preview in placement mode */}
                  {placementMode && (
                    <ProductShape
                      product={{
                        ...createProductFromTemplate(placementMode.template, cursorPosition.x, cursorPosition.y),
                        x: cursorPosition.x,
                        y: cursorPosition.y,
                      }}
                      config={(() => {
                        const productType = placementMode.template.product_type_unigram?.toLowerCase() || "default";
                        return productTypesConfig[productType] || productTypesConfig.default;
                      })()}
                      isSelected={false}
                      draggable={false}
                      customStroke="#2196f3"
                      theme={theme}
                      opacity={0.6}
                      listening={false}
                      onMouseDown={() => {}}
                      onContextMenu={() => {}}
                    />
                  )}
                </DesignerCanvas>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <ContextMenus
        contextMenu={contextMenu}
        onClose={handleCloseContextMenu}
        onDuplicate={handleDuplicateSelected}
        onOpenColorPicker={handleOpenColorPicker}
        onStartConnect={handleStartConnect}
        onResetScale={handleResetScale}
        onDelete={handleDeleteSelected}
        onInsertProduct={handleInsertProductAtPosition}
        onSwapPlacementProduct={handleSwapPlacementProduct}
        onScale={handleOpenScaleDialog}
      />

      <ScaleButton
        open={scaleDialogOpen}
        onScale={handleScaleConfirm}
        onClose={() => setScaleDialogOpen(false)}
        defaultValue={1}
      />

      <ColorPickerPopover
        anchorEl={colorPickerAnchor}
        onClose={() => {
          setColorPickerAnchor(null);
          setColorPickerTarget(null);
        }}
        onColorChange={handleColorChange}
      />
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;