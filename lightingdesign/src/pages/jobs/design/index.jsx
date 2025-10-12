import { useRouter } from "next/router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Box, Container, Card, CardContent, useTheme } from "@mui/material";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { useForm } from "react-hook-form";
import { DesignerToolbarRow } from "/src/components/designer/DesignerToolbarRow";
import { DesignerCanvas } from "/src/components/designer/DesignerCanvas";
import { ProductSelectionDrawer } from "/src/components/designer/ProductSelectionDrawer";
import { ContextMenus } from "/src/components/designer/ContextMenus";
import { ColorPickerPopover } from "/src/components/designer/ColorPickerPopover";
import { ProductsLayer } from "/src/components/designer/ProductsLayer";
import { ConnectorsLayer } from "/src/components/designer/ConnectorsLayer";
import { ProductShape } from "/src/components/designer/ProductShape";
import { MeasurementLayer } from "/src/components/designer/MeasurementLayer";
import { MeasurementConfirmation } from "/src/components/designer/MeasurementConfirmation";
import { LayerSwitcher } from "/src/components/designer/LayerSwitcher";
import { SubLayerControls } from "/src/components/designer/SubLayerControls";
import { CippComponentDialog } from "/src/components/CippComponents/CippComponentDialog";
import { TextField } from "@mui/material";
import { useHistory } from "/src/hooks/useHistory";
import { useKeyboardShortcuts } from "/src/hooks/useKeyboardShortcuts";
import { useLayerManager } from "/src/hooks/useLayerManager";
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
  const [showLayers, setShowLayers] = useState(false);
  const [selectedTool, setSelectedTool] = useState("select");
  const [rotationSnaps, setRotationSnaps] = useState(8);
  
  // Layer management
  const layerManager = useLayerManager();
  const {
    layers,
    activeLayerId,
    activeLayer,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    updateLayer,
    updateActiveLayer,
    toggleSublayerVisibility,
    filterProductsBySublayers,
  } = layerManager;
  
  // Placement mode
  const [placementMode, setPlacementMode] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Products and connectors with history - now synced with active layer
  const {
    state: products,
    updateHistory,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  } = useHistory(activeLayer?.products || []);

  // Keep products in sync with active layer
  useEffect(() => {
    if (activeLayer) {
      updateActiveLayer({ products });
    }
  }, [products]);

  const [connectors, setConnectors] = useState(activeLayer?.connectors || []);

  // Keep connectors in sync with active layer
  useEffect(() => {
    if (activeLayer) {
      updateActiveLayer({ connectors });
    }
  }, [connectors]);

  // Update local state when switching layers
  useEffect(() => {
    if (activeLayer) {
      updateHistory(activeLayer.products || []);
      setConnectors(activeLayer.connectors || []);
      setBackgroundImage(activeLayer.backgroundImage);
      setBackgroundImageNaturalSize(activeLayer.backgroundImageNaturalSize);
    }
  }, [activeLayerId]);

  // Form hooks
  const scaleForm = useForm({
    mode: "onChange",
    defaultValues: {
      scale: 1
    }
  });

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
    scaleValue = Number(scaleValue);
    if (isNaN(scaleValue) || scaleValue <= 0) return;

    // For each selected product, set only the correct real-world size property based on config
    const newProducts = products.map(product => {
      if (!selectedIds.includes(product.id)) return product;
      
      let updated = { ...product };
      // Ensure base scales exist
      const baseScaleX = product.baseScaleX || 1;
      const baseScaleY = product.baseScaleY || 1;
      
      // Store current scale as base if not set
      if (!product.baseScaleX) {
        updated.baseScaleX = product.scaleX || 1;
        updated.baseScaleY = product.scaleY || 1;
      }
      
      // Apply scale relative to base scale
      updated.scaleX = baseScaleX * scaleValue;
      updated.scaleY = baseScaleY * scaleValue;
      
      return updated;
    });

    updateHistory(newProducts);
    
    // Force transformer update
    setGroupKey(k => k + 1);
    if (transformerRef.current && selectionGroupRef.current) {
      selectionGroupRef.current.scaleX(1);
      selectionGroupRef.current.scaleY(1);
      transformerRef.current.nodes([selectionGroupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
    setScaleDialogOpen(false);
  };

  // Connection sequence for connect tool
  const [connectSequence, setConnectSequence] = useState([]);

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
  const [measureDialogOpen, setMeasureDialogOpen] = useState(false);
  const [measureValue, setMeasureValue] = useState(0);
  const [backgroundImageNaturalSize, setBackgroundImageNaturalSize] = useState(null);

  // Selection snapshot for group transformations
  const selectionSnapshot = useMemo(() => {
    if (selectedIds.length === 0) {
      return { centerX: 0, centerY: 0, products: [], rotation: 0 };
    }

    const snapshot = products
      .filter(p => selectedIds.includes(p.id))
      .map(p => ({ ...p }));
    
    if (snapshot.length === 0) {
      return { centerX: 0, centerY: 0, products: [], rotation: 0 };
    }

    // Calculate average rotation of selected products first
    const totalRotation = snapshot.reduce((sum, p) => sum + (p.rotation || 0), 0);
    const avgRotation = totalRotation / snapshot.length;
    
    // Calculate center considering rotation
    let sumX = 0;
    let sumY = 0;
    
    snapshot.forEach(p => {
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
      products: snapshot.map(p => {
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
          rotation: (p.rotation || 0) - avgRotation // Store relative rotation
        };
      })
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
    
    // Check if the group has actually been transformed
    // If all values are at their defaults, skip the update
    if (groupX === selectionSnapshot.centerX && 
        groupY === selectionSnapshot.centerY && 
        groupScaleX === 1 && 
        groupScaleY === 1 && 
        groupRotation === 0) {
      return;
    }
    
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
      if (points.length >= 2) return points;
      const newPoints = [...points, canvasPos];
      if (newPoints.length === 2) {
        setMeasureDialogOpen(true);
      }
      return newPoints;
    });
  };

  const calculateDistance = (point1, point2) => {
    if (!point1 || !point2) return 0;
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
      Math.pow(point2.y - point1.y, 2)
    );
  };

  const handleMeasureConfirm = (distance) => {
    const realDistance = Number(distance);
    const pixelDistance = calculateDistance(measurePoints[0], measurePoints[1]);
    if (realDistance > 0 && pixelDistance > 0) {
      setScaleFactor(pixelDistance / realDistance);
    }
    setMeasureMode(false);
    setMeasurePoints([]);
    setMeasureDialogOpen(false);
    setMeasureValue(0);
  };

  const handleMeasureCancel = () => {
    setMeasureMode(false);
    setMeasurePoints([]);
    setMeasureDialogOpen(false);
    setMeasureValue(0);
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
    
    // In connect mode, don't show context menu
    if (selectedTool === 'connect') {
      return;
    }
    
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
      baseScaleX: 1,
      baseScaleY: 1,
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
    if (!placementMode && !measureMode) return;
    
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

    // Connect mode logic
    if (selectedTool === 'connect') {
      // Right-click splits the sequence
      if (e.evt?.button === 2) {
        setConnectSequence([]);
        return;
      }
      // Add to sequence if not already last
      setConnectSequence(seq => {
        if (seq.length > 0 && seq[seq.length - 1] === productId) return seq;
        const newSeq = [...seq, productId];
        // If at least two, create connector
        if (newSeq.length >= 2) {
          const prevId = newSeq[newSeq.length - 2];
          setConnectors(conns => [
            ...conns,
            {
              id: `connector-${Date.now()}-${Math.random()}`,
              from: prevId,
              to: productId,
              controlX: null,
              controlY: null,
              color: null,
            }
          ]);
        }
        return newSeq;
      });
      return;
    }

    // Normal selection logic
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

  const handleGroupTransformEnd = () => {
    // Apply transforms to products
    if (!selectedIds.length || !selectionGroupRef.current) return;

    applyGroupTransform();

    // Find any connectors connected to transformed products
    const connectedConnectors = connectors.filter(connector =>
      selectedIds.includes(connector.from) || selectedIds.includes(connector.to)
    );

    // Update connected connectors control points to maintain their relative positions
    if (connectedConnectors.length > 0) {
      const newConnectors = connectors.map(connector => {
        if (!selectedIds.includes(connector.from) && !selectedIds.includes(connector.to)) {
          return connector;
        }

        // If control points are set to the default, let them auto-update
        if (connector.controlX === null || connector.controlY === null) {
          return connector;
        }

        // Otherwise, apply the same transform to the control point
        const group = selectionGroupRef.current;
        const fromProduct = products.find(p => p.id === connector.from);
        const toProduct = products.find(p => p.id === connector.to);

        // Calculate center of affected products for transform origin
        let centerX, centerY;
        if (selectedIds.includes(connector.from) && selectedIds.includes(connector.to)) {
          centerX = (fromProduct.x + toProduct.x) / 2;
          centerY = (fromProduct.y + toProduct.y) / 2;
        } else if (selectedIds.includes(connector.from)) {
          centerX = fromProduct.x;
          centerY = fromProduct.y;
        } else {
          centerX = toProduct.x;
          centerY = toProduct.y;
        }

        let relX = connector.controlX - centerX;
        let relY = connector.controlY - centerY;

        // Apply rotation
        if (group.rotation() !== 0) {
          const angle = (group.rotation() * Math.PI) / 180;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rotatedX = relX * cos - relY * sin;
          const rotatedY = relX * sin + relY * cos;
          relX = rotatedX;
          relY = rotatedY;
        }

        // Apply scale
        relX *= group.scaleX();
        relY *= group.scaleY();

        return {
          ...connector,
          controlX: centerX + relX,
          controlY: centerY + relY,
        };
      });

      setConnectors(newConnectors);
    }
    
    // Force transformer and connections to update
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

    // Ensure scale stays within reasonable bounds (0.01 to 100)
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.min(Math.max(newScale, 0.01), 100);

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
      setGroupKey(k => k + 1);
    }
  };

  // Toolbar handlers
  const handleZoomIn = () => {
    const newScale = Math.min(stageScale * 1.5, 100);
    setStageScale(newScale);
  };
  
  const handleZoomOut = () => {
    const newScale = Math.max(stageScale / 1.5, 0.01);
    setStageScale(newScale);
  };
  
  const handleResetView = () => {
    setStageScale(1);
    setStagePosition({ 
      x: canvasWidth / 2, 
      y: canvasHeight / 2 
    });
  };

  // Disconnect cable handler for connect mode
  const handleDisconnectCable = () => setConnectSequence([]);

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
              showLayers: showLayers,
              onToggleLayers: () => setShowLayers(!showLayers),
              onZoomIn: handleZoomIn,
              onZoomOut: handleZoomOut,
              onResetView: handleResetView,
              zoomLevel: stageScale,
              rotationSnaps: rotationSnaps,
              onRotationSnapsChange: setRotationSnaps,
            }}
            toolsProps={{
              selectedTool: selectedTool,
              onToolChange: (tool) => {
                // If leaving connect mode, clear connectSequence
                if (selectedTool === 'connect' && tool !== 'connect') {
                  setConnectSequence([]);
                }
                // Clear selections when changing tools
                applyGroupTransform();
                setSelectedIds([]);
                setSelectedConnectorId(null);
                setGroupKey(k => k + 1);
                setSelectedTool(tool);
              },
              placementMode: placementMode,
              onStopPlacement: handleStopPlacement,
              onDisconnectCable: handleDisconnectCable,
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
                    products={filterProductsBySublayers(products, activeLayerId)}
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
                    onGroupTransformEnd={handleGroupTransformEnd}
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

                  <MeasurementLayer
                    measureMode={measureMode}
                    measurePoints={measurePoints}
                    cursorPosition={cursorPosition}
                    theme={theme}
                    stagePosition={stagePosition}
                    stageScale={stageScale}
                    onMeasurePointAdd={(point) => {
                      setMeasurePoints(points => {
                        if (points.length >= 2) return points;
                        const newPoints = [...points, point];
                        if (newPoints.length === 2) {
                          setMeasureDialogOpen(true);
                        }
                        return newPoints;
                      });
                    }}
                  />
                </DesignerCanvas>
                
                {/* Inline measurement confirmation */}
                <MeasurementConfirmation
                  open={measureDialogOpen}
                  measurePoints={measurePoints}
                  stagePosition={stagePosition}
                  stageScale={stageScale}
                  onConfirm={handleMeasureConfirm}
                  onCancel={handleMeasureCancel}
                  calculateDistance={calculateDistance}
                  scaleFactor={scaleFactor}
                />

                {/* Layer management panels */}
                {showLayers && (
                  <>
                    <LayerSwitcher
                      layers={layers}
                      activeLayerId={activeLayerId}
                      onLayerSelect={setActiveLayerId}
                      onLayerAdd={() => {
                        const name = prompt('Enter layer name:', `Floor ${layers.length + 1}`);
                        if (name) addLayer(name);
                      }}
                      onLayerDelete={deleteLayer}
                      onLayerToggleVisibility={(layerId) => {
                        const layer = layers.find(l => l.id === layerId);
                        updateLayer(layerId, { visible: !layer.visible });
                      }}
                      onLayerToggleLock={(layerId) => {
                        const layer = layers.find(l => l.id === layerId);
                        updateLayer(layerId, { locked: !layer.locked });
                      }}
                    />
                    <SubLayerControls
                      sublayers={activeLayer?.sublayers || []}
                      layerId={activeLayerId}
                      onSublayerToggle={toggleSublayerVisibility}
                    />
                  </>
                )}
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
        onResetScale={handleResetScale}
        onDelete={handleDeleteSelected}
        onInsertProduct={handleInsertProductAtPosition}
        onSwapPlacementProduct={handleSwapPlacementProduct}
        onScale={handleOpenScaleDialog}
      />

      <CippComponentDialog
        open={scaleDialogOpen}
        title="Set Scale"
        createDialog={{
          open: scaleDialogOpen,
          handleClose: () => setScaleDialogOpen(false),
          handleSubmit: (data) => {
            handleScaleConfirm(data.scale);
            setScaleValue(data.scale);
          },
          form: scaleForm
        }}
      >
        <TextField
          {...scaleForm.register('scale', {
            onChange: (e) => setScaleValue(Number(e.target.value))
          })}
          label="Scale"
          type="number"
          defaultValue={scaleValue}
          fullWidth
          inputProps={{ min: 0.001, step: 0.001 }}
          autoFocus
        />
      </CippComponentDialog>

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