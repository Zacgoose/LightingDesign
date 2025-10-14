import { useRouter } from "next/router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Typography,
  TextField,
} from "@mui/material";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { DesignerToolbarRow } from "/src/components/designer/DesignerToolbarRow";
import { DesignerCanvas } from "/src/components/designer/DesignerCanvas";
import { ProductSelectionDrawer } from "/src/components/designer/ProductSelectionDrawer";
import { ContextMenus } from "/src/components/designer/ContextMenus";
import { ColorPickerPopover } from "/src/components/designer/ColorPickerPopover";
import { ProductsLayer, COLOR_PALETTE } from "/src/components/designer/ProductsLayer";
import { ConnectorsLayer } from "/src/components/designer/ConnectorsLayer";
import { ProductShape } from "/src/components/designer/ProductShape";
import { MeasurementLayer } from "/src/components/designer/MeasurementLayer";
import { MeasurementConfirmation } from "/src/components/designer/MeasurementConfirmation";
import { LayerSwitcher } from "/src/components/designer/LayerSwitcher";
import { SubLayerControls } from "/src/components/designer/SubLayerControls";
import { CippComponentDialog } from "/src/components/CippComponents/CippComponentDialog";
import { useHistory } from "/src/hooks/useHistory";
import { useKeyboardShortcuts } from "/src/hooks/useKeyboardShortcuts";
import { useLayerManager } from "/src/hooks/useLayerManager";
import { useCanvasState } from "/src/hooks/useCanvasState";
import { useSelectionState } from "/src/hooks/useSelectionState";
import { useDesignLoader } from "/src/hooks/useDesignLoader";
import { useProductInteraction } from "/src/hooks/useProductInteraction";
import { useContextMenus } from "/src/hooks/useContextMenus";
import productTypesConfig from "/src/data/productTypes.json";
import { ApiGetCall, ApiPostCall } from "/src/api/ApiCall";
import { CippApiResults } from "/src/components/CippComponents/CippApiResults";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const queryClient = useQueryClient();

  // State for tracking save status
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load design data
  const designData = ApiGetCall({
    url: "/api/ExecGetDesign",
    data: { jobId: id },
    queryKey: `Design-${id}`,
    waiting: !!id,
  });

  // Load products catalog for enriching saved designs
  const productsData = ApiGetCall({
    url: "/api/ExecListBeaconProducts",
    queryKey: "Products",
  });

  // Save design mutation
  const saveDesignMutation = ApiPostCall({});

  // Canvas state management using custom hook
  const canvasState = useCanvasState();
  const {
    stageScale,
    canvasWidth,
    canvasHeight,
    stagePosition,
    showGrid,
    showLayers,
    selectedTool,
    rotationSnaps,
    canvasContainerRef,
    setStageScale,
    setShowGrid,
    setShowLayers,
    setSelectedTool,
    setRotationSnaps,
    handleWheel,
    handleStageDragEnd,
    handleCanvasPan,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  } = canvasState;

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
    toggleSublayerVisibility,
    filterProductsBySublayers,
    loadLayers,
    addSublayer,
    removeSublayer,
    renameSublayer,
    setDefaultSublayer,
  } = layerManager;

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
  } = useHistory(activeLayer?.products || []);

  // Ref to track if we're loading data from a layer (vs user editing)
  const isLoadingLayerData = useRef(false);
  const lastLoadedLayerId = useRef(null); // Initialize to null so first layer loads properly
  const lastSyncedBackgroundImage = useRef(null);
  const lastSyncedBackgroundImageNaturalSize = useRef(null);
  const lastSyncedScaleFactor = useRef(null);
  
  // Ref to always have current activeLayerId for sync effects
  // We use a ref instead of putting activeLayerId in dependencies to avoid
  // the sync effects running when switching layers (which would cause race conditions)
  const activeLayerIdRef = useRef(activeLayerId);

  const [connectors, setConnectors] = useState(activeLayer?.connectors || []);

  // Keep activeLayerIdRef in sync with activeLayerId
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);

  // Background and Scale - now derived from active layer
  const [backgroundImage, setBackgroundImage] = useState(activeLayer?.backgroundImage || null);
  const [backgroundImageNaturalSize, setBackgroundImageNaturalSize] = useState(
    activeLayer?.backgroundImageNaturalSize || null,
  );
  const [scaleFactor, setScaleFactor] = useState(activeLayer?.scaleFactor || 100);

  // Selection state management using custom hook
  const selectionState = useSelectionState(products);
  const {
    selectedIds,
    selectedConnectorId,
    groupKey,
    isDragging,
    selectionSnapshot,
    transformerRef,
    selectionGroupRef,
    setSelectedIds,
    setSelectedConnectorId,
    setGroupKey,
    setIsDragging,
    applyGroupTransform,
    clearSelection,
    forceGroupUpdate,
  } = selectionState;

  // Connection sequence for connect tool
  const [connectSequence, setConnectSequence] = useState([]);

  // UI state
  const [productDrawerVisible, setProductDrawerVisible] = useState(false);

  // Refs
  const clipboard = useRef({ products: [], connectors: [] });
  const pendingInsertPosition = useRef(null);
  const subLayerControlsRef = useRef();

  // Measurement state
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDialogOpen, setMeasureDialogOpen] = useState(false);
  const [measureValue, setMeasureValue] = useState(0);

  // Scale dialog state
  const [scaleDialogOpen, setScaleDialogOpen] = useState(false);
  const [scaleValue, setScaleValue] = useState(1);

  // Form hooks
  const scaleForm = useForm({
    mode: "onChange",
    defaultValues: {
      scale: 1,
    },
  });

  // Keep products in sync with active layer (save to layer when products change)
  // Note: activeLayerId is intentionally NOT in dependencies to prevent sync on layer switch
  // The isLoadingLayerData guard prevents syncing during layer load
  // We use activeLayerIdRef.current to always get the current layer, avoiding stale closures
  useEffect(() => {
    if (isLoadingLayerData.current) return;
    updateLayer(activeLayerIdRef.current, { products });
  }, [products, updateLayer]);

  // Keep connectors in sync with active layer
  // Note: activeLayerId is intentionally NOT in dependencies to prevent sync on layer switch
  // We use activeLayerIdRef.current to always get the current layer, avoiding stale closures
  useEffect(() => {
    if (isLoadingLayerData.current) return;
    updateLayer(activeLayerIdRef.current, { connectors });
  }, [connectors, updateLayer]);

  // Keep background image in sync with active layer
  // Note: activeLayerId is intentionally NOT in dependencies to prevent sync on layer switch
  // We use activeLayerIdRef.current to always get the current layer, avoiding stale closures
  useEffect(() => {
    if (isLoadingLayerData.current) {
      console.log('Background sync blocked - loading layer data');
      return;
    }
    if (
      backgroundImage !== lastSyncedBackgroundImage.current ||
      backgroundImageNaturalSize !== lastSyncedBackgroundImageNaturalSize.current
    ) {
      console.log('Syncing background to layer:', activeLayerIdRef.current, {
        hasImage: !!backgroundImage,
        imageLength: backgroundImage?.length || 0
      });
      updateLayer(activeLayerIdRef.current, { backgroundImage, backgroundImageNaturalSize });
      lastSyncedBackgroundImage.current = backgroundImage;
      lastSyncedBackgroundImageNaturalSize.current = backgroundImageNaturalSize;
    }
  }, [backgroundImage, backgroundImageNaturalSize, updateLayer]);

  // Keep scale factor in sync with active layer
  // Note: activeLayerId is intentionally NOT in dependencies to prevent sync on layer switch
  // We use activeLayerIdRef.current to always get the current layer, avoiding stale closures
  useEffect(() => {
    if (isLoadingLayerData.current) return;
    if (scaleFactor !== lastSyncedScaleFactor.current) {
      updateLayer(activeLayerIdRef.current, { scaleFactor });
      lastSyncedScaleFactor.current = scaleFactor;
    }
  }, [scaleFactor, updateLayer]);

  // Design loader hook - optimized for performance
  const designLoader = useDesignLoader({
    designData,
    productsData,
    onLoadComplete: () => {
      // Reset the last loaded layer ID after design loads
      lastLoadedLayerId.current = null;
    },
    updateHistory,
    setConnectors,
    setStageScale,
    loadLayers,
    setLastSaved,
    setHasUnsavedChanges,
    setBackgroundImage,
    setBackgroundImageNaturalSize,
    setScaleFactor,
  });

  const { stripProductMetadata, stripLayersForSave } = designLoader;

  // Track changes to mark as unsaved
  useEffect(() => {
    if (products.length > 0 || connectors.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [products, connectors]);

  // Handle save mutation success
  useEffect(() => {
    if (saveDesignMutation.isSuccess) {
      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);
      setIsSaving(false);
      queryClient.invalidateQueries({ queryKey: [`Design-${id}`] });
    }
  }, [saveDesignMutation.isSuccess, queryClient, id]);

  // Handle save mutation end
  useEffect(() => {
    if (!saveDesignMutation.isPending) {
      setIsSaving(false);
    }
  }, [saveDesignMutation.isPending]);

  const handleSave = useCallback(() => {
    if (!id) {
      console.error("No job ID found. Cannot save design.");
      return;
    }

    const transformed = applyGroupTransform();
    if (transformed) updateHistory(transformed);
    setIsSaving(true);

    // Strip metadata from all layers (products and connectors are already in layers)
    const strippedLayers = stripLayersForSave(layers);

    // Use new format: only save layers (not root products/connectors)
    // Products and connectors are stored within their respective layers
    saveDesignMutation.mutate({
      url: "/api/ExecSaveDesign",
      data: {
        jobId: id,
        designData: {
          layers: strippedLayers,
          canvasSettings: {
            width: canvasWidth,
            height: canvasHeight,
            scale: stageScale,
            position: stagePosition,
          },
        },
      },
    });
  }, [
    id,
    layers,
    canvasWidth,
    canvasHeight,
    stageScale,
    stagePosition,
    applyGroupTransform,
    updateHistory,
    stripLayersForSave,
    saveDesignMutation,
  ]);

  // Auto-save functionality
  useEffect(() => {
    if (!id || !hasUnsavedChanges || isSaving) return;

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        console.log("Auto-saving design...");
        handleSave();
      }
    }, 120000);

    return () => clearInterval(autoSaveInterval);
  }, [id, hasUnsavedChanges, isSaving, handleSave]);

  // Handler for context menu 'Scale...'
  const handleOpenScaleDialog = useCallback(() => {
    setScaleDialogOpen(true);
    contextMenus.handleCloseContextMenu();
  }, []);

  // Handler for applying scale to selected products
  const handleScaleConfirm = useCallback(
    (scaleValue) => {
      scaleValue = Number(scaleValue);
      if (isNaN(scaleValue) || scaleValue <= 0) return;

      const newProducts = products.map((product) => {
        if (!selectedIds.includes(product.id)) return product;

        let updated = { ...product };
        const baseScaleX = product.baseScaleX || 1;
        const baseScaleY = product.baseScaleY || 1;

        if (!product.baseScaleX) {
          updated.baseScaleX = product.scaleX || 1;
          updated.baseScaleY = product.scaleY || 1;
        }

        updated.scaleX = baseScaleX * scaleValue;
        updated.scaleY = baseScaleY * scaleValue;

        return updated;
      });

      updateHistory(newProducts);
      forceGroupUpdate();

      if (transformerRef.current && selectionGroupRef.current) {
        selectionGroupRef.current.scaleX(1);
        selectionGroupRef.current.scaleY(1);
        transformerRef.current.nodes([selectionGroupRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      setScaleDialogOpen(false);
    },
    [products, selectedIds, updateHistory, forceGroupUpdate, transformerRef, selectionGroupRef],
  );

  // Update local state when switching layers
  useEffect(() => {
    if (activeLayerId !== lastLoadedLayerId.current && activeLayer) {
      console.log(`Switching to layer ${activeLayerId}`, {
        hasBackgroundImage: !!activeLayer.backgroundImage,
        backgroundImageLength: activeLayer.backgroundImage?.length || 0,
      });

      lastLoadedLayerId.current = activeLayerId;
      isLoadingLayerData.current = true;
      
      // Update activeLayerIdRef immediately to ensure sync effects use correct layer
      activeLayerIdRef.current = activeLayerId;

      // Load the new layer's data
      updateHistory(activeLayer.products || []);
      setConnectors(activeLayer.connectors || []);
      setBackgroundImage(activeLayer.backgroundImage || null);
      setBackgroundImageNaturalSize(activeLayer.backgroundImageNaturalSize || null);
      setScaleFactor(activeLayer.scaleFactor || 100);

      // Update sync refs to match the new layer's data
      lastSyncedBackgroundImage.current = activeLayer.backgroundImage || null;
      lastSyncedBackgroundImageNaturalSize.current = activeLayer.backgroundImageNaturalSize || null;
      lastSyncedScaleFactor.current = activeLayer.scaleFactor || 100;

      // Re-enable sync after layer data is loaded
      const timer = setTimeout(() => {
        isLoadingLayerData.current = false;
        console.log('Layer switch complete - sync effects re-enabled');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    activeLayerId,
    activeLayer,
    updateHistory,
    setConnectors,
    setBackgroundImage,
    setBackgroundImageNaturalSize,
    setScaleFactor,
  ]);

  // Context menus hook
  const contextMenus = useContextMenus({
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
  });

  // Product interaction hook
  const productInteraction = useProductInteraction({
    products,
    selectedIds,
    selectedTool,
    isDragging,
    setIsDragging,
    setSelectedIds,
    setSelectedConnectorId,
    setGroupKey,
    setConnectors,
    setConnectSequence,
    updateHistory,
    applyGroupTransform,
  });

  const {
    handleProductClick,
    handleProductDragStart,
    handleProductDragEnd,
    handleGroupTransformEnd,
  } = productInteraction;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    products,
    selectedIds,
    selectedConnectorId,
    connectors,
    clipboard,
    onCopy: () => {
      const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
      const selectedConnectors = connectors.filter(
        (c) => selectedIds.includes(c.from) && selectedIds.includes(c.to),
      );
      clipboard.current = {
        products: selectedProducts.map((p) => ({ ...p })),
        connectors: selectedConnectors.map((c) => ({ ...c })),
      };
    },
    onPaste: () => {
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      const idMap = {};
      const newProducts = clipboard.current.products.map((p, index) => {
        const newId = `product-${Date.now()}-${index}`;
        idMap[p.id] = newId;
        return {
          ...p,
          id: newId,
          x: p.x + 20,
          y: p.y + 20,
          sublayerId: activeLayer?.defaultSublayerId || null,
        };
      });

      const newConnectors = (clipboard.current.connectors || []).map((c, index) => ({
        ...c,
        id: `connector-${Date.now()}-${index}`,
        from: idMap[c.from],
        to: idMap[c.to],
      }));

      updateHistory([...products, ...newProducts]);
      setConnectors([...connectors, ...newConnectors]);
      setSelectedIds(newProducts.map((p) => p.id));
      forceGroupUpdate();
    },
    onDelete: () => contextMenus.handleDeleteSelected(),
    onSelectAll: () => {
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      setSelectedIds(products.map((p) => p.id));
      forceGroupUpdate();
    },
    onEscape: () => {
      if (placementMode) {
        setPlacementMode(null);
        setSelectedTool("select");
        return;
      }
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      clearSelection();
    },
    onUndo: () => {
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      handleUndo();
      clearSelection();
    },
    onRedo: () => {
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      handleRedo();
      clearSelection();
    },
  });

  const handleUploadFloorPlan = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
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
  }, [setBackgroundImage, setBackgroundImageNaturalSize]);

  const handleMeasure = useCallback(() => {
    setMeasureMode(true);
    setMeasurePoints([]);
  }, []);

  const handleCanvasMeasureClick = useCallback(
    (e) => {
      if (!measureMode) return;
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = {
        x: (pointerPosition.x - stagePosition.x) / stageScale,
        y: (pointerPosition.y - stagePosition.y) / stageScale,
      };
      setMeasurePoints((points) => {
        if (points.length >= 2) return points;
        const newPoints = [...points, canvasPos];
        if (newPoints.length === 2) {
          setMeasureDialogOpen(true);
        }
        return newPoints;
      });
    },
    [measureMode, stagePosition, stageScale],
  );

  const calculateDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return 0;
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  }, []);

  const handleMeasureConfirm = useCallback(
    (distance) => {
      const realDistance = Number(distance);
      const pixelDistance = calculateDistance(measurePoints[0], measurePoints[1]);
      if (realDistance > 0 && pixelDistance > 0) {
        setScaleFactor(pixelDistance / realDistance);
      }
      setMeasureMode(false);
      setMeasurePoints([]);
      setMeasureDialogOpen(false);
      setMeasureValue(0);
    },
    [measurePoints, calculateDistance, setScaleFactor],
  );

  const handleMeasureCancel = useCallback(() => {
    setMeasureMode(false);
    setMeasurePoints([]);
    setMeasureDialogOpen(false);
    setMeasureValue(0);
  }, []);

  const handleResetScale = useCallback(() => {
    const transformed = applyGroupTransform();
    const baseProducts = transformed || products;
    const newProducts = baseProducts.map((product) => {
      if (!selectedIds.includes(product.id)) return product;
      return { ...product, scaleX: 1, scaleY: 1 };
    });
    updateHistory(newProducts);
    forceGroupUpdate();
    contextMenus.handleCloseContextMenu();
  }, [products, selectedIds, applyGroupTransform, updateHistory, forceGroupUpdate, contextMenus]);

  const handleAssignToSublayer = useCallback(
    (sublayerId) => {
      const transformed = applyGroupTransform();
      const baseProducts = transformed || products;
      const newProducts = baseProducts.map((product) =>
        selectedIds.includes(product.id) ? { ...product, sublayerId } : product,
      );
      updateHistory(newProducts);
      contextMenus.handleCloseContextMenu();
    },
    [products, selectedIds, applyGroupTransform, updateHistory, contextMenus],
  );

  const handleSwapPlacementProduct = useCallback(() => {
    setProductDrawerVisible(true);
    contextMenus.handleCloseContextMenu();
  }, [contextMenus]);

  const handleProductAdd = useCallback((product) => {
    setPlacementMode({
      template: product,
    });
    setSelectedTool("placement");
    setProductDrawerVisible(false);
    pendingInsertPosition.current = null;
  }, []);

  const determineStrokeColorForSku = useCallback(
    (sku) => {
      if (!sku) return null;

      const existingProductsWithSku = products.filter((p) => p.sku === sku);

      if (existingProductsWithSku.length > 0) {
        const existingWithColor = existingProductsWithSku.find((p) => p.strokeColor);
        if (existingWithColor) {
          return existingWithColor.strokeColor;
        }
      }

      const currentSkuList = [...new Set(products.map((p) => p.sku).filter(Boolean))];
      let skuIndex = currentSkuList.indexOf(sku);

      if (skuIndex === -1) {
        skuIndex = currentSkuList.length;
      }

      return COLOR_PALETTE[skuIndex % COLOR_PALETTE.length];
    },
    [products],
  );

  const createProductFromTemplate = useCallback(
    (template, x, y) => {
      const strokeColor = determineStrokeColorForSku(template.sku);

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
        strokeColor: strokeColor,
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
        sublayerId: activeLayer?.defaultSublayerId || null,
      };
    },
    [determineStrokeColorForSku, activeLayer],
  );

  const handleCanvasClick = useCallback(
    (e) => {
      if (placementMode && e.target === e.target.getStage()) {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        const canvasPos = {
          x: (pointerPosition.x - stagePosition.x) / stageScale,
          y: (pointerPosition.y - stagePosition.y) / stageScale,
        };

        const newProduct = createProductFromTemplate(
          placementMode.template,
          canvasPos.x,
          canvasPos.y,
        );
        updateHistory([...products, newProduct]);
      }
    },
    [placementMode, stagePosition, stageScale, createProductFromTemplate, products, updateHistory],
  );

  const handleCanvasMouseMove = useCallback(
    (e) => {
      if (!placementMode && !measureMode) return;

      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const canvasPos = {
          x: (pointerPosition.x - stagePosition.x) / stageScale,
          y: (pointerPosition.y - stagePosition.y) / stageScale,
        };
        setCursorPosition(canvasPos);
      }
    },
    [placementMode, measureMode, stagePosition, stageScale],
  );

  const handleStopPlacement = useCallback(() => {
    setPlacementMode(null);
    setSelectedTool("select");
  }, []);

  const checkDeselect = useCallback(
    (e) => {
      if (e.evt.button !== 0) return;

      if (selectedTool === "pan") return;

      if (placementMode) {
        handleCanvasClick(e);
        return;
      }

      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        const transformed = applyGroupTransform();
        if (transformed) updateHistory(transformed);
        clearSelection();
      }
    },
    [
      selectedTool,
      placementMode,
      applyGroupTransform,
      updateHistory,
      clearSelection,
      handleCanvasClick,
    ],
  );

  const handleDisconnectCable = useCallback(() => setConnectSequence([]), []);

  const handleExport = useCallback(() => {
    const transformed = applyGroupTransform();
    if (transformed) updateHistory(transformed);
    console.log("Export project", { products, connectors });
  }, [applyGroupTransform, updateHistory, products, connectors]);

  return (
    <>
      {/* Loading indicator */}
      {(designData.isLoading || productsData.isLoading) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 80px)",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              {designData.isLoading ? "Loading design..." : "Loading product catalog..."}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Main design interface */}
      {!designData.isLoading && !productsData.isLoading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 80px)",
            minHeight: 0,
          }}
        >
          <Container
            maxWidth={false}
            sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          >
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
                  if (selectedTool === "connect" && tool !== "connect") {
                    setConnectSequence([]);
                  }
                  // Clear selections when changing tools
                  applyGroupTransform();
                  setSelectedIds([]);
                  setSelectedConnectorId(null);
                  setGroupKey((k) => k + 1);
                  setSelectedTool(tool);
                },
                placementMode: placementMode,
                onStopPlacement: handleStopPlacement,
                onDisconnectCable: handleDisconnectCable,
              }}
            />

            <Box sx={{ mb: 0.75 }}>
              {/* Display API response messages */}
              <CippApiResults
                apiObject={saveDesignMutation}
                floating={true}
                autoCloseSeconds={5}
                hideResultsButtons={true}
              />

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
              <CardContent
                sx={{
                  p: 0,
                  "&:last-child": { pb: 0 },
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
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
                    onContextMenu={contextMenus.handleStageContextMenu}
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
                        const transformed = applyGroupTransform();
                        if (transformed) updateHistory(transformed);
                        setSelectedConnectorId(e.target.id());
                        setSelectedIds([]);
                        forceGroupUpdate();
                      }}
                      onConnectorChange={setConnectors}
                      onConnectorContextMenu={contextMenus.handleConnectorContextMenu}
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
                      onContextMenu={contextMenus.handleContextMenu}
                      onGroupTransformEnd={handleGroupTransformEnd}
                    />

                    {/* Ghost product preview in placement mode */}
                    {placementMode && (
                      <ProductShape
                        product={{
                          ...createProductFromTemplate(
                            placementMode.template,
                            cursorPosition.x,
                            cursorPosition.y,
                          ),
                          x: cursorPosition.x,
                          y: cursorPosition.y,
                        }}
                        config={(() => {
                          const productType =
                            placementMode.template.product_type_unigram?.toLowerCase() || "default";
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
                        setMeasurePoints((points) => {
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
                        onLayerAdd={addLayer}
                        onLayerDelete={deleteLayer}
                        onClose={() => setShowLayers(false)}
                        subLayerControlsRef={subLayerControlsRef}
                      />
                      <SubLayerControls
                        ref={subLayerControlsRef}
                        sublayers={activeLayer?.sublayers || []}
                        layerId={activeLayerId}
                        defaultSublayerId={activeLayer?.defaultSublayerId}
                        onSublayerToggle={toggleSublayerVisibility}
                        onSublayerAdd={addSublayer}
                        onSublayerRemove={removeSublayer}
                        onSublayerRename={renameSublayer}
                        onSetDefaultSublayer={setDefaultSublayer}
                        onClose={() => setShowLayers(false)}
                      />
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
      )}

      <ContextMenus
        contextMenu={contextMenus.contextMenu}
        onClose={contextMenus.handleCloseContextMenu}
        onDuplicate={contextMenus.handleDuplicateSelected}
        onOpenColorPicker={contextMenus.handleOpenColorPicker}
        onResetScale={handleResetScale}
        onDelete={contextMenus.handleDeleteSelected}
        onInsertProduct={contextMenus.handleInsertProductAtPosition}
        onSwapPlacementProduct={handleSwapPlacementProduct}
        onScale={handleOpenScaleDialog}
        onAssignToSublayer={handleAssignToSublayer}
        sublayers={activeLayer?.sublayers || []}
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
          form: scaleForm,
        }}
      >
        <TextField
          {...scaleForm.register("scale", {
            onChange: (e) => setScaleValue(Number(e.target.value)),
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
        anchorEl={contextMenus.colorPickerAnchor}
        onClose={() => {
          contextMenus.setColorPickerAnchor(null);
          contextMenus.setColorPickerTarget(null);
        }}
        onColorChange={contextMenus.handleColorChange}
      />
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
