import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Box, Container, Card, CardContent, useTheme, Menu, MenuItem, ListItemIcon, ListItemText, Popover, Button } from "@mui/material";
import { Delete, ContentCopy, Link as LinkIcon, SettingsBackupRestore, Add } from "@mui/icons-material";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { Shape, Text, Group, Transformer } from "react-konva";
import { DesignerMainToolbar } from "/src/components/designer/DesignerMainToolbar";
import { DesignerViewToolbar } from "/src/components/designer/DesignerViewToolbar";
import { DesignerToolsToolbar } from "/src/components/designer/DesignerToolsToolbar";
import { DesignerCanvas } from "/src/components/designer/DesignerCanvas";
import { ProductSelectionDrawer } from "/src/components/designer/ProductSelectionDrawer";
import { ConnectorLine } from "/src/components/designer/ConnectorLine";
import { getShapeFunction } from "/src/components/designer/productShapes";
import productTypesConfig from "/src/data/productTypes.json";

const COLOR_PALETTE = [
  '#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2',
  '#0097a7', '#c2185b', '#5d4037', '#455a64', '#00796b',
];

const getSnappedRotation = (rotation, snapPoints = 8, snapThreshold = 5) => {
  if (snapPoints <= 0) return rotation;
  const angleStep = 360 / snapPoints;
  const normalizedRotation = rotation % 360;
  const nearestSnapAngle = Math.round(normalizedRotation / angleStep) * angleStep;
  const difference = Math.abs(normalizedRotation - nearestSnapAngle);
  if (difference <= snapThreshold) return nearestSnapAngle;
  return rotation;
};

// Individual Product Shape (NOT draggable or transformable individually)
const ProductShape = ({ 
  product, 
  config, 
  isSelected, 
  onMouseDown,
  onContextMenu,
  onDragStart,
  onDragEnd,
  customStroke,
  theme,
  draggable = false,
}) => {
  const shapeFunction = getShapeFunction(config.shapeType);
  const maxDimension = Math.max(config.width || 30, config.height || 30);
  const textYOffset = maxDimension / 2 + 10;
  const skuYOffset = -(maxDimension / 2 + 20);

  return (
    <Group
      x={product.x}
      y={product.y}
      rotation={product.rotation || 0}
      scaleX={product.scaleX || 1}
      scaleY={product.scaleY || 1}
      draggable={draggable}
      onDragStart={onDragStart}
      onMouseDown={onMouseDown}
      onTap={onMouseDown}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
    >
      <Shape
        sceneFunc={(context, shape) => shapeFunction(context, shape)}
        fill={product.color || config.fill}
        stroke={customStroke}
        strokeWidth={config.strokeWidth + 1}
        width={config.width}
        height={config.height}
      />
      
      {product.sku && (
        <Text
          text={product.sku}
          fontSize={11}
          fill={theme.palette.text.primary}
          fontStyle="bold"
          align="center"
          y={skuYOffset}
          x={-60}
          width={120}
        />
      )}
      
      <Text
        text={product.customLabel || product.name}
        fontSize={10}
        fill={theme.palette.text.secondary}
        align="center"
        y={textYOffset}
        x={-60}
        width={120}
      />
      
      {product.quantity > 1 && (
        <>
          <Shape
            sceneFunc={(context, shape) => {
              context.beginPath();
              context.arc(maxDimension * 0.6, -maxDimension * 0.4, 12, 0, Math.PI * 2);
              context.fillStrokeShape(shape);
            }}
            fill={theme.palette.error.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
          />
          <Text
            text={`${product.quantity}`}
            fontSize={10}
            fill={theme.palette.error.contrastText}
            fontStyle="bold"
            align="center"
            x={maxDimension * 0.6 - 6}
            y={-maxDimension * 0.4 - 5}
            width={12}
          />
        </>
      )}
    </Group>
  );
};

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();

  const [stageScale, setStageScale] = useState(1);
  const canvasWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
  const canvasHeight = typeof window !== 'undefined' ? window.innerHeight - 300 : 700;
  const [stagePosition, setStagePosition] = useState({ 
    x: canvasWidth / 2, 
    y: canvasHeight / 2 
  });
  const [showGrid, setShowGrid] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [selectedTool, setSelectedTool] = useState("select");
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);
  const [rotationSnaps, setRotationSnaps] = useState(8);
  const [connectors, setConnectors] = useState([]);
  const [connectMode, setConnectMode] = useState(null);
  const [groupKey, setGroupKey] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);

  const history = useRef([[]]);
  const historyStep = useRef(0);
  const clipboard = useRef({ products: [], connectors: [] });
  const transformerRef = useRef();
  const selectionGroupRef = useRef();

  const [productDrawerVisible, setProductDrawerVisible] = useState(false);
  const pendingInsertPosition = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);

  const PRESET_COLORS = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000000',
  ];

  // Replace with useMemo for synchronous calculation:
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

  // Keep a separate useEffect just for attaching the transformer:
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

  const handleIndividualProductDragEnd = (e, productId) => {
    const newProducts = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return p;
    });
    updateHistory(newProducts);
  };

  // Apply group transform to actual product data
  const applyGroupTransform = () => {
    if (!selectedIds.length || !selectionGroupRef.current || !selectionSnapshot.products?.length) return;

    const group = selectionGroupRef.current;
    
    // Get the group's transform
    const groupX = group.x();
    const groupY = group.y();
    const groupScaleX = group.scaleX();
    const groupScaleY = group.scaleY();
    const groupRotation = group.rotation();
    
    const { products: snapshotProducts } = selectionSnapshot;
    
    // Apply transform to each product based on the snapshot
    const newProducts = products.map((product) => {
      if (!selectedIds.includes(product.id)) return product;
      
      // Find the original state from snapshot
      const original = snapshotProducts.find(p => p.id === product.id);
      if (!original) return product;
      
      // Start with relative position from snapshot
      let relX = original.relativeX;
      let relY = original.relativeY;
      
      // Apply rotation around (0,0) since items are relative to center
      if (groupRotation !== 0) {
        const angle = (groupRotation * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedX = relX * cos - relY * sin;
        const rotatedY = relX * sin + relY * cos;
        relX = rotatedX;
        relY = rotatedY;
      }
      
      // Apply scale
      relX *= groupScaleX;
      relY *= groupScaleY;
      
      // Transform to absolute position (just group position + relative)
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

  const updateHistory = (newProducts) => {
    history.current = history.current.slice(0, historyStep.current + 1);
    history.current = history.current.concat([newProducts]);
    historyStep.current += 1;
    setProducts(newProducts);
  };

  const handleUndo = () => {
    if (historyStep.current === 0) return;
    applyGroupTransform();
    historyStep.current -= 1;
    const previous = history.current[historyStep.current];
    setProducts(previous);
    setSelectedIds([]);
    setGroupKey(k => k + 1);
  };

  const handleRedo = () => {
    if (historyStep.current === history.current.length - 1) return;
    applyGroupTransform();
    historyStep.current += 1;
    const next = history.current[historyStep.current];
    setProducts(next);
    setSelectedIds([]);
    setGroupKey(k => k + 1);
  };

  const canUndo = historyStep.current > 0;
  const canRedo = historyStep.current < history.current.length - 1;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.length > 0) {
        e.preventDefault();
        const selectedProducts = products.filter(p => selectedIds.includes(p.id));
        
        // Also copy connectors where both ends are selected
        const selectedConnectors = connectors.filter(c => 
          selectedIds.includes(c.from) && selectedIds.includes(c.to)
        );
        
        clipboard.current = {
          products: selectedProducts.map(p => ({ ...p })),
          connectors: selectedConnectors.map(c => ({ ...c })),
        };
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.current.products?.length > 0) {
        e.preventDefault();
        applyGroupTransform();
        
        // Create ID mapping for pasted products
        const idMap = {};
        const newProducts = clipboard.current.products.map((p, index) => {
          const newId = `product-${Date.now()}-${index}`;
          idMap[p.id] = newId;
          return {
            ...p,
            id: newId,
            x: p.x + 20,
            y: p.y + 20,
          };
        });
        
        // Create new connectors with mapped IDs
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
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedIds.length > 0 || selectedConnectorId)) {
        e.preventDefault();
        handleDeleteSelected();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        applyGroupTransform();
        setSelectedIds(products.map(p => p.id));
        setGroupKey(k => k + 1);
      }

      if (e.key === 'Escape') {
        applyGroupTransform();
        setSelectedIds([]);
        setSelectedConnectorId(null);
        setConnectMode(null);
        setGroupKey(k => k + 1);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, selectedIds, selectedConnectorId, connectors]);

  const getProductStrokeColor = (product, defaultColor) => {
    const sku = product.sku;
    if (!sku) return defaultColor;
    const skuProducts = products.filter(p => p.sku === sku);
    if (skuProducts.length <= 1) return defaultColor;
    const skuList = [...new Set(products.map(p => p.sku).filter(Boolean))];
    const skuIndex = skuList.indexOf(sku);
    return COLOR_PALETTE[skuIndex % COLOR_PALETTE.length];
  };

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
    
    // If products are selected, show product context menu
    if (selectedIds.length > 0) {
      setContextMenu({
        x: e.evt.clientX,
        y: e.evt.clientY,
        type: 'product',
      });
      return;
    }
    
    // If a connector is selected, show connector context menu
    if (selectedConnectorId) {
      setContextMenu({
        x: e.evt.clientX,
        y: e.evt.clientY,
        type: 'connector',
      });
      return;
    }
    
    // Otherwise, show canvas context menu (only if clicking on stage itself)
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      
      // Store both screen position (for menu) and canvas position (for adding objects)
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
    
    // Use clientX/clientY for screen position
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      type: 'product',
    });
  };

  const handleConnectorContextMenu = (e, connectorId) => {
    e.evt.preventDefault();
    setSelectedConnectorId(connectorId);
    applyGroupTransform();
    setSelectedIds([]);
    setGroupKey(k => k + 1);
    
    // Use clientX/clientY for screen position
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      type: 'connector',
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
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
    
    // Create ID mapping for new products
    const idMap = {};
    const newProducts = selectedProducts.map((p, index) => {
      const newId = `product-${Date.now()}-${index}`;
      idMap[p.id] = newId;
      return {
        ...p,
        id: newId,
        x: p.x + 30,
        y: p.y + 30,
      };
    });
    
    // Copy connectors where both ends are selected
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
      setConnectMode({ fromIds: selectedIds });  // Store all selected IDs
    }
    handleCloseContextMenu();
  };

  const handleResetScale = () => {
    applyGroupTransform();
    const newProducts = products.map(product => {
      if (!selectedIds.includes(product.id)) return product;
      return {
        ...product,
        scaleX: 1,
        scaleY: 1,
      };
    });
    updateHistory(newProducts);
    setGroupKey(k => k + 1);
    handleCloseContextMenu();
  };

  const handleUploadFloorPlan = () => {
    console.log("Upload floor plan");
  };

  const handleSave = () => {
    applyGroupTransform();
    console.log("Save project", { products, connectors });
  };

  const handleExport = () => {
    applyGroupTransform();
    console.log("Export project", { products, connectors });
  };

  const handleZoomIn = () => setStageScale(stageScale * 1.2);
  const handleZoomOut = () => setStageScale(stageScale / 1.2);
  const handleResetView = () => {
    setStageScale(1);
    setStagePosition({ x: canvasWidth / 2, y: canvasHeight / 2 });
  };

  const handleProductAdd = (product) => {
    const position = pendingInsertPosition.current || {
      x: products.length * 20,
      y: products.length * 20,
    };
    
    const newProduct = {
      id: `product-${Date.now()}`,
      x: position.x,
      y: position.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      color: null,
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      product_type: product.product_type_unigram,
      price: parseFloat(product.price) || 0,
      msrp: parseFloat(product.msrp) || 0,
      imageUrl: product.imageUrl,
      thumbnailUrl: product.thumbnailImageUrl,
      category: product.top_web_category,
      categories: product.category_hierarchy || [],
      description: product.short_description,
      colors: product.item_colours || [],
      inStock: product.ss_in_stock === "1",
      stockQty: parseInt(product.stock_qty) || 0,
      metadata: product,
      quantity: 1,
      notes: "",
      customLabel: "",
    };
    
    pendingInsertPosition.current = null; // Clear the pending position
    
    applyGroupTransform();
    updateHistory([...products, newProduct]);
    setSelectedIds([newProduct.id]);
    setGroupKey(k => k + 1);
  };

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
      setStagePosition({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  const checkDeselect = (e) => {
    // Only deselect on left-click (button 0), not right-click (button 2)
    if (e.evt.button !== 0) return;
    
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      applyGroupTransform();
      setSelectedIds([]);
      setSelectedConnectorId(null);
      setConnectMode(null);
      setGroupKey(k => k + 1);
    }
  };

  const handleProductDragStart = (e, productId) => {
    setIsDragging(true);
    
    // Select the item if not already selected
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
    
    // If multiple selected and this is one of them, move all together
    if (selectedIds.includes(productId) && selectedIds.length > 1) {
      const draggedProduct = products.find(p => p.id === productId);
      const deltaX = newX - draggedProduct.x;
      const deltaY = newY - draggedProduct.y;
      
      const newProducts = products.map(p => {
        if (selectedIds.includes(p.id)) {
          return {
            ...p,
            x: p.x + deltaX,
            y: p.y + deltaY,
          };
        }
        return p;
      });
      updateHistory(newProducts);
    } else {
      // Single product drag
      const newProducts = products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            x: newX,
            y: newY,
          };
        }
        return p;
      });
      updateHistory(newProducts);
    }
  };

  const handleProductClick = (e, productId) => {
    // Skip if we're in the middle of dragging
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
          color: null, // Add color property
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

  const handleGroupDragEnd = (e) => {
    applyGroupTransform();
    setGroupKey(k => k + 1);
  };

  return (
    <>
      <Head>
        <title>Designer - Job {id} - Lighting Design</title>
      </Head>
      <Box sx={{ flexGrow: 1, py: 2 }}>
        <Container maxWidth={false}>
          <DesignerMainToolbar
            onUploadFloorPlan={handleUploadFloorPlan}
            onSave={handleSave}
            onExport={handleExport}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />

          <DesignerViewToolbar
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showMeasurements={showMeasurements}
            onToggleMeasurements={() => setShowMeasurements(!showMeasurements)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            zoomLevel={stageScale}
            rotationSnaps={rotationSnaps}
            onRotationSnapsChange={setRotationSnaps}
          />

          <DesignerToolsToolbar
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
          />

          <Box sx={{ mb: 2 }}>
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

          {connectMode && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
              Connection mode active. Click on another object to connect{' '}
              <strong>
                {connectMode.fromIds?.length || 0} item{connectMode.fromIds?.length !== 1 ? 's' : ''}
              </strong>
              {' '}to it, or press ESC to cancel.
            </Box>
          )}

          <Card>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <DesignerCanvas
                width={canvasWidth}
                height={canvasHeight}
                stageScale={stageScale}
                stagePosition={stagePosition}
                showGrid={showGrid}
                onWheel={handleWheel}
                onDragEnd={handleStageDragEnd}
                draggable={selectedTool === "pan"}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                onContextMenu={handleStageContextMenu}
                selectedCount={selectedIds.length}
              >
                {/* Connectors - always at the back */}
                {connectors.map((connector) => {
                  const fromProduct = products.find(p => p.id === connector.from);
                  const toProduct = products.find(p => p.id === connector.to);
                  if (!fromProduct || !toProduct) return null;
                  
                  return (
                    <ConnectorLine
                      key={connector.id}
                      connector={connector}
                      fromProduct={fromProduct}
                      toProduct={toProduct}
                      isSelected={selectedConnectorId === connector.id}
                      onSelect={(e) => {
                        e.cancelBubble = true;
                        applyGroupTransform();
                        setSelectedConnectorId(connector.id);
                        setSelectedIds([]);
                        setGroupKey(k => k + 1);
                      }}
                      onChange={(updatedConnector) => {
                        const newConnectors = connectors.map(c =>
                          c.id === connector.id ? updatedConnector : c
                        );
                        setConnectors(newConnectors);
                      }}
                      onContextMenu={(e) => handleConnectorContextMenu(e, connector.id)}
                      theme={theme}
                      selectedTool={selectedTool}
                    />
                  );
                })}

                {/* Unselected products - individually draggable */}
                {products
                  .filter(p => !selectedIds.includes(p.id))
                  .map((product) => {
                    const productType = product.product_type?.toLowerCase() || "default";
                    const config = productTypesConfig[productType] || productTypesConfig.default;
                    const customStroke = getProductStrokeColor(product, config.stroke);
                    
                    return (
                      <ProductShape
                        key={product.id}
                        product={product}
                        config={config}
                        isSelected={false}
                        draggable={selectedTool === "select"}
                        onDragStart={(e) => handleProductDragStart(e, product.id)}
                        onMouseDown={(e) => handleProductClick(e, product.id)}
                        onDragEnd={(e) => handleProductDragEnd(e, product.id)}
                        onContextMenu={(e) => handleContextMenu(e, product.id)}
                        customStroke={customStroke}
                        theme={theme}
                      />
                    );
                  })}

                {/* Selected products in a draggable group */}
                {selectedIds.length > 0 && selectedTool === "select" && (
                  <Group
                    key={groupKey}
                    ref={selectionGroupRef}
                    x={selectionSnapshot.centerX || 0}
                    y={selectionSnapshot.centerY || 0}
                    draggable
                    onDragEnd={handleGroupDragEnd}
                  >
                    {(selectionSnapshot.products?.length > 0 
                      ? selectionSnapshot.products 
                      : products
                          .filter(p => selectedIds.includes(p.id))
                          .map(p => {
                            const centerX = products
                              .filter(prod => selectedIds.includes(prod.id))
                              .reduce((sum, prod) => sum + prod.x, 0) / selectedIds.length;
                            const centerY = products
                              .filter(prod => selectedIds.includes(prod.id))
                              .reduce((sum, prod) => sum + prod.y, 0) / selectedIds.length;
                            return {
                              ...p,
                              relativeX: p.x - centerX,
                              relativeY: p.y - centerY,
                            };
                          })
                    ).map((product) => {
                        const productType = product.product_type?.toLowerCase() || "default";
                        const config = productTypesConfig[productType] || productTypesConfig.default;
                        const customStroke = getProductStrokeColor(product, config.stroke);
                        
                        const relativeProduct = {
                          ...product,
                          x: product.relativeX || 0,
                          y: product.relativeY || 0,
                        };
                        
                        return (
                          <ProductShape
                            key={product.id}
                            product={relativeProduct}
                            config={config}
                            isSelected={true}
                            draggable={false}
                            onMouseDown={(e) => handleProductClick(e, product.id)}
                            onContextMenu={(e) => handleContextMenu(e, product.id)}
                            customStroke={customStroke}
                            theme={theme}
                          />
                        );
                      })}
                  </Group>
                )}

                {/* Transformer for selected group */}
                {selectedTool === "select" && (
                  <Transformer
                    ref={transformerRef}
                    rotationSnaps={rotationSnaps > 0 ? Array.from(
                      { length: rotationSnaps }, 
                      (_, i) => (360 / rotationSnaps) * i
                    ) : undefined}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                )}
              </DesignerCanvas>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.y, left: contextMenu.x }
            : undefined
        }
      >
        {contextMenu?.type === 'product' && (
          <>
            <MenuItem onClick={handleDuplicateSelected}>
              <ListItemIcon>
                <ContentCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleOpenColorPicker}>
              <ListItemIcon>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', border: '1px solid', borderColor: 'divider' }} />
              </ListItemIcon>
              <ListItemText>Change Color...</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleStartConnect}>
              <ListItemIcon>
                <LinkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Connect to...</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleResetScale}>
              <ListItemIcon>
                <SettingsBackupRestore fontSize="small" />
              </ListItemIcon>
              <ListItemText>Reset Scale</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteSelected}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
        
        {contextMenu?.type === 'connector' && (
          <>
            <MenuItem onClick={handleOpenColorPicker}>
              <ListItemIcon>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', border: '1px solid', borderColor: 'divider' }} />
              </ListItemIcon>
              <ListItemText>Change Color...</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteSelected}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Connection</ListItemText>
            </MenuItem>
          </>
        )}

        {contextMenu?.type === 'canvas' && (
          <MenuItem onClick={handleInsertProductAtPosition}>
            <ListItemIcon>
              <Add fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Product...</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={() => {
          setColorPickerAnchor(null);
          setColorPickerTarget(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 1 }}>
            {PRESET_COLORS.map(color => (
              <Box
                key={color}
                onClick={() => handleColorChange(color)}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: color,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                  }
                }}
              />
            ))}
          </Box>
          <Button
            fullWidth
            size="small"
            onClick={() => handleColorChange(null)}
          >
            Reset to Default
          </Button>
        </Box>
      </Popover>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;