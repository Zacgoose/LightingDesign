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
import { ProductDetailsDrawer } from "/src/components/designer/ProductDetailsDrawer";
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
import { TextLayer } from "/src/components/designer/TextLayer";
import { SelectionRectangle } from "/src/components/designer/SelectionRectangle";
import { TextEntryDialog } from "/src/components/designer/TextEntryDialog";
import { useHistory } from "/src/hooks/useHistory";
import { useKeyboardShortcuts } from "/src/hooks/useKeyboardShortcuts";
import { useLayerManager } from "/src/hooks/useLayerManager";
import { useCanvasState } from "/src/hooks/useCanvasState";
import { useSelectionState } from "/src/hooks/useSelectionState";
import { useDesignLoader } from "/src/hooks/useDesignLoader";
import { useProductInteraction } from "/src/hooks/useProductInteraction";
import { useContextMenus } from "/src/hooks/useContextMenus";
import { useSettings } from "/src/hooks/use-settings";
import productTypesConfig from "/src/data/productTypes.json";
import { ApiGetCall, ApiPostCall } from "/src/api/ApiCall";
import { CippApiResults } from "/src/components/CippComponents/CippApiResults";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const queryClient = useQueryClient();
  const settings = useSettings();

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
    viewportWidth,
    viewportHeight,
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
    layersVersion,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    updateLayer,
    toggleSublayerVisibility,
    filterProductsBySublayers,
    filterConnectorsBySublayers,
    loadLayers,
    addSublayer,
    removeSublayer,
    renameSublayer,
    setDefaultSublayer,
    setDefaultCablingSublayer,
  } = layerManager;

  // Placement mode
  const [placementMode, setPlacementMode] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Products and connectors with history
  const {
    state: products,
    updateHistory,
    resetHistoryBaseline,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  } = useHistory(activeLayer?.products || []);

  // Ref to track if we're loading data from a layer (vs user editing)
  const isLoadingLayerData = useRef(false);
  const lastLoadedLayerId = useRef(null); // Initialize to null so first layer loads properly
  // Initialize sync refs to match the initial active layer values
  // This prevents false positives in sync effects on initial load
  const lastSyncedBackgroundImage = useRef(activeLayer?.backgroundImage || null);
  const lastSyncedBackgroundImageNaturalSize = useRef(
    activeLayer?.backgroundImageNaturalSize || null,
  );
  const lastSyncedScaleFactor = useRef(activeLayer?.scaleFactor || 100);

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

  // Text boxes state
  const [textBoxes, setTextBoxes] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textDialogValue, setTextDialogValue] = useState("");
  const [textDialogFormatting, setTextDialogFormatting] = useState({});
  const [pendingTextBoxId, setPendingTextBoxId] = useState(null);

  // Selection state management using custom hook
  const selectionState = useSelectionState(products, textBoxes);
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

  // Drag-to-select state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const selectionStartRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const DRAG_THRESHOLD = 5; // pixels - minimum movement to consider it a drag

  // UI state
  const [productDrawerVisible, setProductDrawerVisible] = useState(false);
  const [productDetailsDrawerVisible, setProductDetailsDrawerVisible] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [swapMode, setSwapMode] = useState(false);

  // Refs
  const clipboard = useRef({ products: [], connectors: [] });
  const pendingInsertPosition = useRef(null);
  const subLayerControlsRef = useRef();
  const stageRef = useRef();

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

  // Keep text boxes in sync with active layer
  // Note: activeLayerId is intentionally NOT in dependencies to prevent sync on layer switch
  // We use activeLayerIdRef.current to always get the current layer, avoiding stale closures
  useEffect(() => {
    if (isLoadingLayerData.current) return;
    updateLayer(activeLayerIdRef.current, { textBoxes });
  }, [textBoxes, updateLayer]);

  // Keep background image in sync with active layer
  // Note: activeLayerId is intentionally NOT in dependencies to prevent sync on layer switch
  // We use activeLayerIdRef.current to always get the current layer, avoiding stale closures
  useEffect(() => {
    // Check if values have changed from what we last synced
    const hasChanged =
      backgroundImage !== lastSyncedBackgroundImage.current ||
      backgroundImageNaturalSize !== lastSyncedBackgroundImageNaturalSize.current;
    
    if (!hasChanged) {
      return; // No changes to sync
    }
    
    // Don't sync while loading layer data - this prevents writing stale state to new layer
    if (isLoadingLayerData.current) {
      console.log('Background sync skipped - loading layer data');
      return;
    }
    
    console.log('Syncing background to layer:', activeLayerIdRef.current, {
      hasImage: !!backgroundImage,
      imageLength: backgroundImage?.length || 0
    });
    updateLayer(activeLayerIdRef.current, { backgroundImage, backgroundImageNaturalSize });
    lastSyncedBackgroundImage.current = backgroundImage;
    lastSyncedBackgroundImageNaturalSize.current = backgroundImageNaturalSize;
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

    // Force sync of background image if it hasn't been synced yet
    if (
      backgroundImage !== lastSyncedBackgroundImage.current ||
      backgroundImageNaturalSize !== lastSyncedBackgroundImageNaturalSize.current
    ) {
      console.log('Forcing background sync before save');
      updateLayer(activeLayerIdRef.current, { backgroundImage, backgroundImageNaturalSize });
      lastSyncedBackgroundImage.current = backgroundImage;
      lastSyncedBackgroundImageNaturalSize.current = backgroundImageNaturalSize;
    }

    // Log layers before stripping to check for corruption
    console.log('=== SAVE: Layers before stripping ===');
    layers.forEach((layer, idx) => {
      console.log(`Layer ${idx} (${layer.id}):`, {
        name: layer.name,
        hasBackground: !!layer.backgroundImage,
        backgroundLength: layer.backgroundImage?.length || 0,
        backgroundImageNaturalSize: layer.backgroundImageNaturalSize
      });
    });

    // Strip metadata from all layers (products and connectors are already in layers)
    const strippedLayers = stripLayersForSave(layers);

    // Log after stripping
    console.log('=== SAVE: Layers after stripping ===');
    strippedLayers.forEach((layer, idx) => {
      console.log(`Layer ${idx} (${layer.id}):`, {
        name: layer.name,
        hasBackground: !!layer.backgroundImage,
        backgroundLength: layer.backgroundImage?.length || 0,
        backgroundImageNaturalSize: layer.backgroundImageNaturalSize
      });
    });

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
    backgroundImage,
    backgroundImageNaturalSize,
    updateLayer,
  ]);

  // Auto-save functionality
  useEffect(() => {
    if (!id || !hasUnsavedChanges || isSaving) return;

    // Get auto-save interval from user settings (in minutes), default to 2 minutes
    const autoSaveMinutes = parseInt(settings.autoSaveInterval?.value || "2", 10);
    const autoSaveMs = autoSaveMinutes * 60 * 1000;

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        console.log("Auto-saving design...");
        handleSave();
      }
    }, autoSaveMs);

    return () => clearInterval(autoSaveInterval);
  }, [id, hasUnsavedChanges, isSaving, handleSave, settings.autoSaveInterval]);

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

  // Force transformer update when text boxes change dimensions
  useEffect(() => {
    if (transformerRef.current && selectionGroupRef.current) {
      // Force transformer to recalculate its bounding box
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [textBoxes, transformerRef, selectionGroupRef]);

  // Update local state when switching layers OR when layers are loaded
  useEffect(() => {
    // Skip if router query is not ready yet - this prevents loading empty layer data
    // when we're on a page that has an ID in the URL but router.query.id is not yet populated
    if (!router.isReady) {
      console.log('Layer switch effect skipped - router not ready');
      return;
    }

    // Skip initial render if design data is still loading
    // This prevents loading the default empty layer before the actual design data arrives
    if (designData.isLoading) {
      console.log('Layer switch effect skipped - design data still loading');
      return;
    }
    
    // CRITICAL FIX: On page refresh/mount, if we haven't loaded layers yet and there's a design ID,
    // wait for the design to load before initializing the canvas with empty layer data.
    // This prevents the canvas from being initialized with wrong dimensions on refresh.
    // We skip if:
    // 1. We have a design ID (loading existing design, not creating new)
    // 2. layersVersion is 0 (loadLayers() hasn't been called yet)
    // 3. No layer has been loaded yet (lastLoadedLayerId is null)
    if (id && layersVersion === 0 && lastLoadedLayerId.current === null) {
      console.log('Layer switch effect skipped - waiting for initial design data to load', {
        id,
        layersVersion,
        lastLoadedLayerId: lastLoadedLayerId.current,
        isLoading: designData.isLoading,
        isSuccess: designData.isSuccess
      });
      return;
    }
    
    console.log('Layer switch effect triggered', {
      activeLayerId,
      lastLoadedLayerId: lastLoadedLayerId.current,
      hasActiveLayer: !!activeLayer,
      layersVersion,
      condition: activeLayerId !== lastLoadedLayerId.current && activeLayer
    });
    
    if (activeLayerId !== lastLoadedLayerId.current && activeLayer) {
      console.log(`Switching to layer ${activeLayerId}`, {
        hasBackgroundImage: !!activeLayer.backgroundImage,
        backgroundImageLength: activeLayer.backgroundImage?.length || 0,
      });

      lastLoadedLayerId.current = activeLayerId;
      isLoadingLayerData.current = true;
      console.log('isLoadingLayerData set to TRUE');
      
      // Update activeLayerIdRef immediately to ensure sync effects use correct layer
      activeLayerIdRef.current = activeLayerId;

      // Clear selections when switching floors to prevent ghost transformer
      setSelectedIds([]);
      setSelectedTextId(null);

      // Load the new layer's data - use resetHistoryBaseline to prevent undo past loaded state
      resetHistoryBaseline(activeLayer.products || []);
      setConnectors(activeLayer.connectors || []);
      setTextBoxes(activeLayer.textBoxes || []);
      setBackgroundImage(activeLayer.backgroundImage || null);
      setBackgroundImageNaturalSize(activeLayer.backgroundImageNaturalSize || null);
      setScaleFactor(activeLayer.scaleFactor || 100);

      // Update sync refs to match the new layer's data
      lastSyncedBackgroundImage.current = activeLayer.backgroundImage || null;
      lastSyncedBackgroundImageNaturalSize.current = activeLayer.backgroundImageNaturalSize || null;
      lastSyncedScaleFactor.current = activeLayer.scaleFactor || 100;

      // Re-enable sync after layer data is loaded
      console.log('Setting up timeout to re-enable sync in 100ms...');
      const timer = setTimeout(() => {
        isLoadingLayerData.current = false;
        console.log('Layer switch complete - sync effects re-enabled');
      }, 100);

      return () => {
        console.log('Layer switch effect cleanup - clearing timeout');
        clearTimeout(timer);
      };
    }
  }, [
    router.isReady,
    id,
    activeLayerId,
    activeLayer,
    layersVersion,
    designData.isLoading,
    designData.isSuccess,
    designData.data,
    // Note: updateHistory is not memoized in useHistory hook, so it changes every render
    // We don't include it here to prevent infinite re-runs
    // Note: setConnectors, setBackgroundImage, setBackgroundImageNaturalSize, setScaleFactor
    // are stable setState functions and don't need to be in dependencies
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
    selectedTextId,
    textBoxes,
    setTextBoxes,
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
    setSelectedTextId,
    setGroupKey,
    setConnectors,
    setConnectSequence,
    updateHistory,
    applyGroupTransform,
    activeLayer,
  });

  const {
    handleProductClick,
    handleProductDragStart,
    handleProductDragEnd,
    handleGroupTransformEnd,
  } = productInteraction;

  // Unified group transform handler that handles both products and text boxes
  const handleUnifiedGroupTransformEnd = useCallback(() => {
    console.log('[handleUnifiedGroupTransformEnd] Called', {
      hasSelectedIds: !!selectedIds.length,
      hasGroupRef: !!selectionGroupRef.current,
      hasSnapshot: !!selectionSnapshot,
    });

    if (!selectedIds.length || !selectionGroupRef.current || !selectionSnapshot) return;

    const group = selectionGroupRef.current;
    const groupX = group.x();
    const groupY = group.y();
    const groupScaleX = group.scaleX();
    const groupScaleY = group.scaleY();
    const groupRotation = group.rotation();

    // Extract product IDs and text IDs
    const productIds = selectedIds.filter(id => !id.startsWith('text-'));
    const textIds = selectedIds
      .filter(id => id.startsWith('text-'))
      .map(id => id.substring(5)); // Remove 'text-' prefix

    // Helper function for floating-point comparison with tolerance
    const isClose = (a, b, tolerance = 0.0001) => Math.abs(a - b) < tolerance;

    // Check if group has been transformed
    // Use tolerance for floating-point comparisons to avoid precision issues
    const hasTransform = !(
      isClose(groupX, selectionSnapshot.centerX) &&
      isClose(groupY, selectionSnapshot.centerY) &&
      isClose(groupScaleX, 1) &&
      isClose(groupScaleY, 1) &&
      isClose(groupRotation, selectionSnapshot.rotation || 0)
    );

    console.log('[handleUnifiedGroupTransformEnd]', {
      hasTransform,
      groupX,
      groupY,
      centerX: selectionSnapshot.centerX,
      centerY: selectionSnapshot.centerY,
      groupScaleX,
      groupScaleY,
      groupRotation,
      snapshotRotation: selectionSnapshot.rotation || 0,
      productCount: productIds.length,
      textCount: textIds.length,
    });

    if (!hasTransform) {
      console.log('[handleUnifiedGroupTransformEnd] No transform, skipping update');
      setGroupKey((k) => k + 1);
      return;
    }

    console.log('[handleUnifiedGroupTransformEnd] Applying transform to products and text boxes');

    // Calculate the rotation delta (how much we've rotated from the snapshot)
    const rotationDelta = groupRotation - (selectionSnapshot.rotation || 0);
    
    // Check if this is a pure rotation/scale (not dragged)
    // If only rotation/scale changed but not position, treat centerDelta as 0
    const hasRotationChange = !isClose(groupRotation, selectionSnapshot.rotation || 0);
    const hasScaleChange = !isClose(groupScaleX, 1) || !isClose(groupScaleY, 1);
    const hasPositionChange = !isClose(groupX, selectionSnapshot.centerX) || !isClose(groupY, selectionSnapshot.centerY);
    
    // For pure rotation/scale transforms (no drag), ignore the position change
    // Konva moves the group position during rotation, but we don't want to treat that as a drag
    let centerDeltaX = 0;
    let centerDeltaY = 0;
    
    if (hasPositionChange && !hasRotationChange && !hasScaleChange) {
      // Only position changed - this is a real drag
      centerDeltaX = groupX - selectionSnapshot.centerX;
      centerDeltaY = groupY - selectionSnapshot.centerY;
    }

    // Transform products
    if (productIds.length > 0) {
      const transformedProducts = products.map((product) => {
        if (!productIds.includes(product.id)) return product;

        // Get the original product from the snapshot
        const original = selectionSnapshot.products?.find((p) => p.id === product.id);
        if (!original) return product;

        // Start with relative position from snapshot (relative to original center)
        let relX = original.relativeX || 0;
        let relY = original.relativeY || 0;

        // Apply rotation delta to relative positions
        if (rotationDelta !== 0) {
          const angle = (rotationDelta * Math.PI) / 180;
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

        // Add back to ORIGINAL center + any center movement (drag)
        const newX = selectionSnapshot.centerX + relX + centerDeltaX;
        const newY = selectionSnapshot.centerY + relY + centerDeltaY;

        console.log(`[handleUnifiedGroupTransformEnd] Transforming product ${product.id}`, {
          originalPos: { x: product.x, y: product.y },
          newPos: { x: newX, y: newY },
          delta: { x: newX - product.x, y: newY - product.y },
          relativePos: { x: relX, y: relY },
          snapshotRelative: { x: original.relativeX, y: original.relativeY },
          currentRotation: product.rotation,
          originalRelativeRotation: original.rotation,
          rotationDelta: rotationDelta,
          groupRotation: groupRotation,
          snapshotRotation: selectionSnapshot.rotation || 0,
          newRotation: (original.rotation || 0) + (selectionSnapshot.rotation || 0) + rotationDelta,
        });

        return {
          ...product,
          x: newX,
          y: newY,
          rotation: (original.rotation || 0) + (selectionSnapshot.rotation || 0) + rotationDelta,
          scaleX: (original.scaleX || 1) * groupScaleX,
          scaleY: (original.scaleY || 1) * groupScaleY,
        };
      });

      console.log('[handleUnifiedGroupTransformEnd] Calling updateHistory with transformed products', {
        productCount: transformedProducts.filter(p => productIds.includes(p.id)).length,
        firstProductRotation: transformedProducts.find(p => productIds.includes(p.id))?.rotation,
      });

      updateHistory(transformedProducts);
    }

    // Transform text boxes
    if (textIds.length > 0) {
      const transformedTextBoxes = textBoxes.map((textBox) => {
        if (!textIds.includes(textBox.id)) return textBox;

        // Get the original text box from the snapshot
        const original = selectionSnapshot.textBoxes?.find((t) => t.id === textBox.id);
        if (!original) return textBox;

        // Start with relative position from snapshot (relative to original center)
        let relX = original.relativeX || 0;
        let relY = original.relativeY || 0;

        // Apply rotation delta to relative positions
        if (rotationDelta !== 0) {
          const angle = (rotationDelta * Math.PI) / 180;
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

        // Add back to ORIGINAL center + any center movement (drag)
        const newX = selectionSnapshot.centerX + relX + centerDeltaX;
        const newY = selectionSnapshot.centerY + relY + centerDeltaY;

        console.log(`[handleUnifiedGroupTransformEnd] Transforming text box ${textBox.id}`, {
          originalPos: { x: textBox.x, y: textBox.y },
          newPos: { x: newX, y: newY },
          delta: { x: newX - textBox.x, y: newY - textBox.y },
          relativePos: { x: relX, y: relY },
          snapshotRelative: { x: original.relativeX, y: original.relativeY },
        });

        // Detect if this is a corner resize (proportional) or side/top resize
        const scaleDiff = Math.abs(groupScaleX - groupScaleY);
        const isCornerResize = scaleDiff < 0.1; // Small difference means corner anchor (proportional)
        
        let newFontSize = original.fontSize || 24;
        let newWidth = original.width || 200;

        if (isCornerResize) {
          // Corner resize: scale font size proportionally (keep ratio)
          const averageScale = (groupScaleX + groupScaleY) / 2;
          newFontSize = Math.max(8, Math.round(newFontSize * averageScale));
          newWidth = Math.max(20, newWidth * averageScale);
        } else {
          // Side/top resize: adjust width only, keep font size constant for text wrapping
          newWidth = Math.max(20, newWidth * groupScaleX);
          // Font size stays the same, text will wrap
        }

        return {
          ...textBox,
          x: newX,
          y: newY,
          rotation: (original.rotation || 0) + (selectionSnapshot.rotation || 0) + rotationDelta,
          fontSize: newFontSize,
          width: newWidth,
          scaleX: 1, // Reset scale after applying to fontSize and width
          scaleY: 1,
        };
      });

      setTextBoxes(transformedTextBoxes);
    }

    console.log('[handleUnifiedGroupTransformEnd] Transform complete, incrementing groupKey');

    // Force update transformer
    if (transformerRef.current) {
      transformerRef.current.forceUpdate();
    }
    
    // Force update
    setGroupKey((k) => k + 1);
  }, [
    selectedIds,
    selectionSnapshot,
    selectionGroupRef,
    transformerRef,
    products,
    textBoxes,
    updateHistory,
    setTextBoxes,
    setGroupKey,
  ]);

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
      // Include selected text boxes in copy (extract text IDs from text- prefixed IDs)
      const textIds = selectedIds
        .filter(id => id.startsWith('text-'))
        .map(id => id.substring(5)); // Remove 'text-' prefix
      const selectedTextBoxes = textBoxes.filter((t) => textIds.includes(t.id));
      clipboard.current = {
        products: selectedProducts.map((p) => ({ ...p })),
        connectors: selectedConnectors.map((c) => ({ ...c })),
        textBoxes: selectedTextBoxes.map((t) => ({ ...t })),
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

      // Paste text boxes with offset
      const newTextBoxes = (clipboard.current.textBoxes || []).map((t, index) => ({
        ...t,
        id: crypto.randomUUID(),
        x: t.x + 20,
        y: t.y + 20,
        sublayerId: activeLayer?.defaultSublayerId || null,
      }));

      updateHistory([...products, ...newProducts]);
      setConnectors([...connectors, ...newConnectors]);
      setTextBoxes([...textBoxes, ...newTextBoxes]);
      
      // Select pasted products and text boxes
      const allNewIds = [
        ...newProducts.map((p) => p.id),
        ...newTextBoxes.map((t) => `text-${t.id}`)
      ];
      setSelectedIds(allNewIds);
      
      // Set selectedTextId for single text box operations
      if (newTextBoxes.length === 1 && newProducts.length === 0) {
        setSelectedTextId(newTextBoxes[0].id);
      } else if (newTextBoxes.length === 0) {
        setSelectedTextId(null);
      }
      forceGroupUpdate();
    },
    onDelete: () => {
      // Delete selected text boxes (from text- prefixed IDs in selectedIds)
      const textIds = selectedIds
        .filter(id => id.startsWith('text-'))
        .map(id => id.substring(5));
      if (textIds.length > 0) {
        setTextBoxes(textBoxes.filter((t) => !textIds.includes(t.id)));
        setSelectedTextId(null);
      }
      // Also delete selected products/connectors
      if (selectedIds.length > 0 || selectedConnectorId) {
        contextMenus.handleDeleteSelected();
      }
    },
    onSelectAll: () => {
      const transformed = applyGroupTransform();
      if (transformed) updateHistory(transformed);
      // Select all products and text boxes
      const allIds = [
        ...products.map((p) => p.id),
        ...textBoxes.map((t) => `text-${t.id}`)
      ];
      setSelectedIds(allIds);
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
      setSelectedTextId(null);
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
      // Handle connector assignment
      if (selectedConnectorId) {
        const newConnectors = connectors.map((connector) =>
          connector.id === selectedConnectorId ? { ...connector, sublayerId } : connector,
        );
        setConnectors(newConnectors);
        contextMenus.handleCloseContextMenu();
        return;
      }
      
      // Handle product assignment
      const transformed = applyGroupTransform();
      const baseProducts = transformed || products;
      const newProducts = baseProducts.map((product) =>
        selectedIds.includes(product.id) ? { ...product, sublayerId } : product,
      );
      updateHistory(newProducts);
      contextMenus.handleCloseContextMenu();
    },
    [products, selectedIds, selectedConnectorId, connectors, applyGroupTransform, updateHistory, contextMenus, setConnectors],
  );

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

  const handleSwapPlacementProduct = useCallback(() => {
    setProductDrawerVisible(true);
    contextMenus.handleCloseContextMenu();
  }, [contextMenus]);

  const handleSwapSelectedProducts = useCallback(() => {
    setSwapMode(true);
    setProductDrawerVisible(true);
    contextMenus.handleCloseContextMenu();
  }, [contextMenus]);

  const handleProductAdd = useCallback((product) => {
    // Handle swap mode - replace selected products with new product
    if (swapMode && selectedIds.length > 0) {
      const transformed = applyGroupTransform();
      const baseProducts = transformed || products;
      
      // Get product type configuration for real-world dimensions
      const productType = product.product_type_unigram?.toLowerCase() || "default";
      const config = productTypesConfig[productType] || productTypesConfig.default;
      
      // Replace each selected product with the new product template
      const newProducts = baseProducts.map((p) => {
        if (selectedIds.includes(p.id)) {
          // Create new product from template but preserve position, rotation, scale, etc.
          const strokeColor = determineStrokeColorForSku(product.sku);
          return {
            ...p,
            name: product.name,
            sku: product.sku,
            brand: product.brand,
            product_type: product.product_type_unigram,
            product_type_unigram: product.product_type_unigram,
            price: parseFloat(product.price) || 0,
            msrp: parseFloat(product.msrp) || 0,
            imageUrl: product.imageUrl,
            thumbnailUrl: product.thumbnailImageUrl,
            thumbnailImageUrl: product.thumbnailImageUrl,
            url: product.url, // Website link
            category: product.top_web_category,
            categories: product.category_hierarchy || [],
            description: product.short_description,
            colors: product.item_colours || [],
            inStock: product.ss_in_stock === "1",
            stockQty: parseInt(product.stock_qty) || 0,
            metadata: product,
            strokeColor: strokeColor,
            // Update real-world dimensions for the new product type
            realWorldSize: config.realWorldSize,
            realWorldWidth: config.realWorldWidth,
            realWorldHeight: config.realWorldHeight,
            // Preserve the scaleFactor from the original product (or use current layer scale)
            scaleFactor: p.scaleFactor || scaleFactor,
          };
        }
        return p;
      });
      
      updateHistory(newProducts);
      setSwapMode(false);
      setProductDrawerVisible(false);
      setGroupKey(k => k + 1);
      return;
    }
    
    // Normal add mode - enter placement mode with the selected product
    setPlacementMode({
      template: product,
    });
    setSelectedTool("placement");
    setProductDrawerVisible(false);
    pendingInsertPosition.current = null;
    setSwapMode(false);
  }, [swapMode, selectedIds, products, applyGroupTransform, updateHistory, determineStrokeColorForSku, setGroupKey, scaleFactor]);

  const createProductFromTemplate = useCallback(
    (template, x, y) => {
      const strokeColor = determineStrokeColorForSku(template.sku);
      
      // Get product type configuration for real-world dimensions
      const productType = template.product_type_unigram?.toLowerCase() || "default";
      const config = productTypesConfig[productType] || productTypesConfig.default;

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
        product_type_unigram: template.product_type_unigram,
        price: parseFloat(template.price) || 0,
        msrp: parseFloat(template.msrp) || 0,
        imageUrl: template.imageUrl,
        thumbnailUrl: template.thumbnailImageUrl,
        thumbnailImageUrl: template.thumbnailImageUrl,
        url: template.url, // Website link
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
        // Store scaleFactor and real-world dimensions at creation time
        // This ensures products maintain their size even if layer scale changes
        scaleFactor: scaleFactor,
        realWorldSize: config.realWorldSize,
        realWorldWidth: config.realWorldWidth,
        realWorldHeight: config.realWorldHeight,
      };
    },
    [determineStrokeColorForSku, activeLayer, scaleFactor],
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

  const handleSelectionMove = useCallback(
    (e) => {
      if (!selectionStartRef.current) return;

      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = {
        x: (pointerPosition.x - stagePosition.x) / stageScale,
        y: (pointerPosition.y - stagePosition.y) / stageScale,
      };

      // Check if we've moved beyond the threshold
      const dx = Math.abs(canvasPos.x - selectionStartRef.current.x);
      const dy = Math.abs(canvasPos.y - selectionStartRef.current.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!hasDraggedRef.current && distance > DRAG_THRESHOLD / stageScale) {
        // Start selection - we've moved beyond threshold
        hasDraggedRef.current = true;
        setIsSelecting(true);
      }

      if (hasDraggedRef.current) {
        setSelectionRect({
          x1: selectionStartRef.current.x,
          y1: selectionStartRef.current.y,
          x2: canvasPos.x,
          y2: canvasPos.y,
        });
      }
    },
    [stagePosition, stageScale, DRAG_THRESHOLD]
  );

  const handleCanvasMouseMove = useCallback(
    (e) => {
      // Handle drag-to-select - call handleSelectionMove if we have a selection start point
      if (selectionStartRef.current) {
        handleSelectionMove(e);
        return;
      }

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
    [placementMode, measureMode, handleSelectionMove, stagePosition, stageScale],
  );

  const handleStopPlacement = useCallback(() => {
    setPlacementMode(null);
    setSelectedTool("select");
  }, []);

  // Text box handlers
  const handleTextClick = useCallback(
    (e) => {
      if (selectedTool === "text" && e.target === e.target.getStage()) {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        const canvasPos = {
          x: (pointerPosition.x - stagePosition.x) / stageScale,
          y: (pointerPosition.y - stagePosition.y) / stageScale,
        };

        const newTextBox = {
          id: crypto.randomUUID(),
          x: canvasPos.x,
          y: canvasPos.y,
          text: "",
          fontSize: 32,
          fontFamily: "Arial",
          fontStyle: "normal", // Can be "normal", "bold", "italic", "bold italic"
          textDecoration: "", // Can be "", "underline", "line-through", or "underline line-through"
          color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
          width: 100, // Initial placeholder width, will be auto-sized when text is entered
          sublayerId: activeLayer?.defaultSublayerId || null,
          scaleFactor: scaleFactor, // Store scaleFactor at creation time, similar to products
        };
        
        // Add the text box and open the dialog immediately
        setTextBoxes([...textBoxes, newTextBox]);
        setPendingTextBoxId(newTextBox.id);
        setSelectedTextId(newTextBox.id);
        setTextDialogValue("");
        setTextDialogFormatting({
          fontSize: newTextBox.fontSize,
          fontFamily: newTextBox.fontFamily,
          fontStyle: newTextBox.fontStyle,
          textDecoration: newTextBox.textDecoration,
          color: newTextBox.color,
        });
        setTextDialogOpen(true);
        setSelectedIds([]);
        setSelectedConnectorId(null);
      }
    },
    [selectedTool, textBoxes, stagePosition, stageScale, theme, setSelectedIds, setSelectedConnectorId]
  );

  const handleTextDoubleClick = useCallback((e, textId) => {
    const textBox = textBoxes.find((t) => t.id === textId);
    if (textBox) {
      setPendingTextBoxId(textId);
      setTextDialogValue(textBox.text);
      setTextDialogFormatting({
        fontSize: textBox.fontSize || 24,
        fontFamily: textBox.fontFamily || "Arial",
        fontStyle: textBox.fontStyle || "normal",
        textDecoration: textBox.textDecoration || "",
        color: textBox.color || "#000000",
      });
      setTextDialogOpen(true);
    }
  }, [textBoxes]);

  const handleTextDialogConfirm = useCallback(
    (formattingData) => {
      if (pendingTextBoxId) {
        const newText = formattingData.text || "";
        if (newText.trim()) {
          // Use canvas measureText API to calculate exact text dimensions
          // as recommended by Konva documentation for accurate sizing
          const fontSize = formattingData.fontSize;
          const fontFamily = formattingData.fontFamily;
          const isBold = formattingData.fontStyle?.includes("bold");
          const isItalic = formattingData.fontStyle?.includes("italic");
          const fontStyle = isItalic ? "italic" : "normal";
          const fontWeight = isBold ? "bold" : "normal";
          
          // Create an offscreen canvas for measuring
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Match the Konva.Text style exactly
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          
          // Split into lines and measure each to get the widest line
          const lines = newText.split('\n');
          const maxWidth = lines.reduce((max, line) => {
            const w = ctx.measureText(line).width;
            return w > max ? w : max;
          }, 0);
          
          // Measure height using the full text metrics
          const metrics = ctx.measureText(newText);
          const lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
          
          // Add padding to prevent text cutoff
          const padding = 10;
          const width = maxWidth + padding;
          const height = (lineHeight * lines.length) + padding;
          
          // User confirmed with text - update the text box with text, formatting, and auto-sized dimensions
          setTextBoxes((boxes) =>
            boxes.map((box) => 
              box.id === pendingTextBoxId 
                ? { 
                    ...box, 
                    text: newText,
                    fontSize: formattingData.fontSize,
                    fontFamily: formattingData.fontFamily,
                    fontStyle: formattingData.fontStyle,
                    textDecoration: formattingData.textDecoration,
                    color: formattingData.color,
                    width: width, // Use canvas measureText width
                    height: height, // Use canvas measureText height
                  } 
                : box
            )
          );
        } else {
          // User confirmed with empty text - remove the text box
          setTextBoxes((boxes) => boxes.filter((box) => box.id !== pendingTextBoxId));
          setSelectedTextId(null);
        }
        setPendingTextBoxId(null);
      }
      setTextDialogOpen(false);
    },
    [pendingTextBoxId]
  );

  const handleTextDialogClose = useCallback(() => {
    setTextDialogOpen(false);
    // If we were creating a new text box and dialog was cancelled, remove it
    if (pendingTextBoxId) {
      const textBox = textBoxes.find((t) => t.id === pendingTextBoxId);
      if (textBox && !textBox.text) {
        setTextBoxes((boxes) => boxes.filter((box) => box.id !== pendingTextBoxId));
        setSelectedTextId(null);
      }
    }
    setPendingTextBoxId(null);
  }, [pendingTextBoxId, textBoxes]);

  const handleTextChange = useCallback((updatedTextBox) => {
    setTextBoxes((boxes) =>
      boxes.map((box) => (box.id === updatedTextBox.id ? updatedTextBox : box))
    );
  }, []);

  const handleTextSelect = useCallback((textId) => {
    // Clear product selections and set only this text
    setSelectedTextId(textId);
    setSelectedIds([`text-${textId}`]);
    setSelectedConnectorId(null);
    forceGroupUpdate();
  }, [setSelectedIds, setSelectedConnectorId, forceGroupUpdate]);

  const handleTextContextMenu = useCallback((e, textId) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    
    setSelectedTextId(textId);
    setSelectedIds([`text-${textId}`]); // Keep text in selection for visual feedback
    setSelectedConnectorId(null);
    
    // Use screen coordinates (clientX/Y) like product context menu
    contextMenus.setContextMenu({
      type: "text",
      x: e.evt.clientX,
      y: e.evt.clientY,
      textId: textId,
    });
  }, [setSelectedIds, setSelectedConnectorId, contextMenus]);

  const handleTextEdit = useCallback(() => {
    if (selectedTextId) {
      const textBox = textBoxes.find((t) => t.id === selectedTextId);
      if (textBox) {
        setPendingTextBoxId(selectedTextId);
        setTextDialogValue(textBox.text);
        setTextDialogFormatting({
          fontSize: textBox.fontSize || 32,
          fontFamily: textBox.fontFamily || "Arial",
          fontStyle: textBox.fontStyle || "normal",
          textDecoration: textBox.textDecoration || "",
          color: textBox.color || "#000000",
        });
        setTextDialogOpen(true);
      }
    }
    contextMenus.handleCloseContextMenu();
  }, [selectedTextId, textBoxes, contextMenus]);

  const handleTextFormatBold = useCallback(() => {
    if (selectedTextId) {
      setTextBoxes((boxes) =>
        boxes.map((box) => {
          if (box.id !== selectedTextId) return box;
          const currentStyle = box.fontStyle || "normal";
          const isBold = currentStyle.includes("bold");
          const isItalic = currentStyle.includes("italic");
          
          let newStyle;
          if (isBold && isItalic) {
            newStyle = "italic";
          } else if (isBold) {
            newStyle = "normal";
          } else if (isItalic) {
            newStyle = "bold italic";
          } else {
            newStyle = "bold";
          }
          
          return { ...box, fontStyle: newStyle };
        })
      );
    }
    contextMenus.handleCloseContextMenu();
  }, [selectedTextId, contextMenus]);

  const handleTextFormatItalic = useCallback(() => {
    if (selectedTextId) {
      setTextBoxes((boxes) =>
        boxes.map((box) => {
          if (box.id !== selectedTextId) return box;
          const currentStyle = box.fontStyle || "normal";
          const isBold = currentStyle.includes("bold");
          const isItalic = currentStyle.includes("italic");
          
          let newStyle;
          if (isBold && isItalic) {
            newStyle = "bold";
          } else if (isItalic) {
            newStyle = "normal";
          } else if (isBold) {
            newStyle = "bold italic";
          } else {
            newStyle = "italic";
          }
          
          return { ...box, fontStyle: newStyle };
        })
      );
    }
    contextMenus.handleCloseContextMenu();
  }, [selectedTextId, contextMenus]);

  const handleTextFormatUnderline = useCallback(() => {
    if (selectedTextId) {
      setTextBoxes((boxes) =>
        boxes.map((box) => {
          if (box.id !== selectedTextId) return box;
          const currentDecoration = box.textDecoration || "";
          const hasUnderline = currentDecoration.includes("underline");
          
          let newDecoration;
          if (hasUnderline) {
            // Remove underline
            newDecoration = currentDecoration.replace("underline", "").trim();
          } else {
            // Add underline
            newDecoration = currentDecoration ? `${currentDecoration} underline` : "underline";
          }
          
          return { ...box, textDecoration: newDecoration };
        })
      );
    }
    contextMenus.handleCloseContextMenu();
  }, [selectedTextId, contextMenus]);

  const handleTextFontSize = useCallback((fontSize) => {
    if (selectedTextId) {
      setTextBoxes((boxes) =>
        boxes.map((box) => (box.id === selectedTextId ? { ...box, fontSize } : box))
      );
    }
    contextMenus.handleCloseContextMenu();
  }, [selectedTextId, contextMenus]);

  const handleTextColorChange = useCallback((color) => {
    if (selectedTextId) {
      setTextBoxes((boxes) =>
        boxes.map((box) => (box.id === selectedTextId ? { ...box, color } : box))
      );
    }
  }, [selectedTextId]);

  // Drag-to-select handlers
  const handleSelectionStart = useCallback(
    (e) => {
      if (selectedTool !== "select" || e.evt.button !== 0) return;
      
      const clickedOnEmpty = e.target === e.target.getStage();
      if (!clickedOnEmpty) return;

      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const canvasPos = {
        x: (pointerPosition.x - stagePosition.x) / stageScale,
        y: (pointerPosition.y - stagePosition.y) / stageScale,
      };

      selectionStartRef.current = canvasPos;
      hasDraggedRef.current = false;
      // Don't set isSelecting yet - wait for actual movement
    },
    [selectedTool, stagePosition, stageScale]
  );

  const handleSelectionEnd = useCallback(() => {
    // If we didn't actually drag (just clicked), don't do selection
    if (!hasDraggedRef.current || !selectionRect) {
      setIsSelecting(false);
      setSelectionRect(null);
      selectionStartRef.current = null;
      hasDraggedRef.current = false;
      return;
    }

    // Calculate selection bounds
    const x1 = Math.min(selectionRect.x1, selectionRect.x2);
    const y1 = Math.min(selectionRect.y1, selectionRect.y2);
    const x2 = Math.max(selectionRect.x1, selectionRect.x2);
    const y2 = Math.max(selectionRect.y1, selectionRect.y2);

    // Find products within or partially overlapping the selection rectangle
    const selectedProducts = products.filter((product) => {
      const productType = product.product_type?.toLowerCase() || "default";
      const config = productTypesConfig[productType] || productTypesConfig.default;
      
      // Calculate product bounds using its real-world size
      const productScaleFactor = product.scaleFactor || scaleFactor;
      const pixelWidth = ((config.realWorldWidth || config.realWorldSize) / productScaleFactor) * (product.scaleX || 1);
      const pixelHeight = ((config.realWorldHeight || config.realWorldSize) / productScaleFactor) * (product.scaleY || 1);
      
      // Calculate product bounding box (considering it's centered)
      const productX1 = product.x - pixelWidth / 2;
      const productY1 = product.y - pixelHeight / 2;
      const productX2 = product.x + pixelWidth / 2;
      const productY2 = product.y + pixelHeight / 2;

      // Check if rectangles overlap (partial or full)
      return !(productX2 < x1 || productX1 > x2 || productY2 < y1 || productY1 > y2);
    });

    // Find text boxes within or partially overlapping the selection rectangle
    const selectedTexts = textBoxes.filter((textBox) => {
      // Calculate actual rendered dimensions
      const textScaleFactor = textBox.scaleFactor || scaleFactor;
      const baseFontSize = textBox.fontSize || 24;
      const renderedFontSize = baseFontSize * (textScaleFactor / 100);
      
      // Account for text box scale transforms
      const textWidth = (textBox.width || 200) * (textBox.scaleX || 1);
      const textHeight = renderedFontSize * 1.2 * (textBox.scaleY || 1); // Approximate height with line height multiplier
      
      const textX1 = textBox.x;
      const textY1 = textBox.y;
      const textX2 = textBox.x + textWidth;
      const textY2 = textBox.y + textHeight;

      return !(textX2 < x1 || textX1 > x2 || textY2 < y1 || textY1 > y2);
    });

    // Select both products and text boxes (support mixed selection)
    if (selectedProducts.length > 0 || selectedTexts.length > 0) {
      // Combine product IDs and text box IDs (with text- prefix)
      const allSelectedIds = [
        ...selectedProducts.map((p) => p.id),
        ...selectedTexts.map((t) => `text-${t.id}`)
      ];
      setSelectedIds(allSelectedIds);
      // Also set selectedTextId for single text box operations
      if (selectedTexts.length === 1) {
        setSelectedTextId(selectedTexts[0].id);
      } else if (selectedTexts.length === 0) {
        setSelectedTextId(null);
      }
      setGroupKey((k) => k + 1);
    }

    setIsSelecting(false);
    setSelectionRect(null);
    selectionStartRef.current = null;
    hasDraggedRef.current = false;
  }, [selectionRect, products, textBoxes, scaleFactor, setSelectedIds, setGroupKey]);

  const handleStageMouseUp = useCallback(
    (e) => {
      // Store drag state before handleSelectionEnd clears it
      const wasDragging = hasDraggedRef.current;
      const hadSelectionStart = selectionStartRef.current !== null;
      
      // Handle selection end (this will clear the refs)
      handleSelectionEnd();

      // If we're in select mode and clicked on empty canvas without dragging, clear selection
      if (selectedTool === "select" && !wasDragging && hadSelectionStart) {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          const transformed = applyGroupTransform();
          if (transformed) updateHistory(transformed);
          clearSelection();
          setSelectedTextId(null);
        }
      }

      // Clean up refs (redundant but safe)
      selectionStartRef.current = null;
      hasDraggedRef.current = false;
    },
    [selectedTool, handleSelectionEnd, applyGroupTransform, updateHistory, clearSelection]
  );

  const checkDeselect = useCallback(
    (e) => {
      if (e.evt.button !== 0) return;

      if (selectedTool === "pan") return;

      // Handle text tool
      if (selectedTool === "text") {
        handleTextClick(e);
        return;
      }

      // Handle drag-to-select (just record start position)
      if (selectedTool === "select") {
        handleSelectionStart(e);
        // Don't clear selection yet - wait to see if it's a drag or click
        return;
      }

      if (placementMode) {
        handleCanvasClick(e);
        return;
      }

      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        const transformed = applyGroupTransform();
        if (transformed) updateHistory(transformed);
        clearSelection();
        setSelectedTextId(null);
      }
    },
    [
      selectedTool,
      placementMode,
      applyGroupTransform,
      updateHistory,
      clearSelection,
      handleCanvasClick,
      handleTextClick,
      handleSelectionStart,
    ],
  );

  const handleDisconnectCable = useCallback(() => setConnectSequence([]), []);

  const handleShowProperties = useCallback(() => {
    if (selectedIds.length === 1) {
      const product = products.find((p) => p.id === selectedIds[0]);
      if (product) {
        setSelectedProductForDetails(product);
        setProductDetailsDrawerVisible(true);
      }
    }
    contextMenus.handleCloseContextMenu();
  }, [selectedIds, products, contextMenus]);

  const handleInsertCustomObject = useCallback(
    (shapeName) => {
      if (contextMenus.contextMenu?.canvasX !== undefined) {
        const x = contextMenus.contextMenu.canvasX;
        const y = contextMenus.contextMenu.canvasY;

        // Get configuration from productTypes.json
        const shapeConfig = productTypesConfig[shapeName] || productTypesConfig.default;
        
        // Extract size attributes from the config
        const sizeAttrs = {};
        if (shapeConfig.realWorldSize !== undefined) {
          sizeAttrs.realWorldSize = shapeConfig.realWorldSize;
        }
        if (shapeConfig.realWorldWidth !== undefined) {
          sizeAttrs.realWorldWidth = shapeConfig.realWorldWidth;
        }
        if (shapeConfig.realWorldHeight !== undefined) {
          sizeAttrs.realWorldHeight = shapeConfig.realWorldHeight;
        }

        const newProduct = {
          id: `custom-${crypto.randomUUID()}`,
          x,
          y,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          color: shapeConfig.fill || "#666666",
          stroke: shapeConfig.stroke || "#424242",
          strokeWidth: shapeConfig.strokeWidth || 2,
          shape: shapeConfig.shapeType || shapeName,
          name: `Custom ${shapeName.charAt(0).toUpperCase() + shapeName.slice(1)}`,
          product_type_unigram: shapeName,
          isCustomObject: true,
          // Add scaleFactor to ensure proper rendering and resizing
          scaleFactor: scaleFactor || 100,
          ...sizeAttrs,
        };

        const transformed = applyGroupTransform();
        const baseProducts = transformed || products;
        updateHistory([...baseProducts, newProduct]);
        setSelectedIds([newProduct.id]);
        setGroupKey((k) => k + 1);
      }
      contextMenus.handleCloseContextMenu();
    },
    [contextMenus, products, applyGroupTransform, updateHistory, setSelectedIds, setGroupKey, scaleFactor],
  );

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
                  setSelectedTextId(null);
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
                  setSwapMode(false);
                  pendingInsertPosition.current = null;
                }}
              />

              <ProductDetailsDrawer
                product={selectedProductForDetails}
                visible={productDetailsDrawerVisible}
                onClose={() => {
                  setProductDetailsDrawerVisible(false);
                  setSelectedProductForDetails(null);
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
                    ref={stageRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    viewportWidth={viewportWidth}
                    viewportHeight={viewportHeight}
                    stageScale={stageScale}
                    stagePosition={stagePosition}
                    showGrid={showGrid}
                    onWheel={handleWheel}
                    onDragEnd={handleStageDragEnd}
                    draggable={selectedTool === "pan" && !placementMode}
                    onMouseDown={measureMode ? handleCanvasMeasureClick : checkDeselect}
                    onMouseUp={handleStageMouseUp}
                    onTouchStart={checkDeselect}
                    onMouseMove={handleCanvasMouseMove}
                    onContextMenu={contextMenus.handleStageContextMenu}
                    selectedCount={selectedIds.length}
                    backgroundImage={backgroundImage}
                    backgroundImageNaturalSize={backgroundImageNaturalSize}
                    scaleFactor={scaleFactor}
                    onPan={handleCanvasPan}
                    gridOpacity={settings.gridOpacity}
                    backgroundOpacity={settings.backgroundOpacity}
                  >
                    <ConnectorsLayer
                      connectors={filterConnectorsBySublayers(connectors, activeLayerId)}
                      products={products}
                      selectedConnectorId={selectedConnectorId}
                      selectedTool={selectedTool}
                      theme={theme}
                      onConnectorSelect={(e, connectorId) => {
                        e.cancelBubble = true;
                        const transformed = applyGroupTransform();
                        if (transformed) updateHistory(transformed);
                        setSelectedConnectorId(connectorId);
                        setSelectedIds([]);
                        forceGroupUpdate();
                      }}
                      onConnectorChange={setConnectors}
                      onConnectorContextMenu={contextMenus.handleConnectorContextMenu}
                    />

                    <ProductsLayer
                      products={filterProductsBySublayers(products, activeLayerId)}
                      textBoxes={textBoxes}
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
                      onTextContextMenu={handleTextContextMenu}
                      onGroupTransformEnd={handleUnifiedGroupTransformEnd}
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

                    {/* Text boxes layer */}
                    <TextLayer
                      textBoxes={textBoxes}
                      selectedTextId={selectedTextId}
                      selectedIds={selectedIds}
                      onTextSelect={handleTextSelect}
                      onTextChange={handleTextChange}
                      onTextDoubleClick={handleTextDoubleClick}
                      onTextContextMenu={handleTextContextMenu}
                      draggable={selectedTool === "select" || selectedTool === "text"}
                    />

                    {/* Selection rectangle for drag-to-select */}
                    <SelectionRectangle selectionRect={selectionRect} />
                  </DesignerCanvas>

                  {/* Text entry dialog */}
                  <TextEntryDialog
                    open={textDialogOpen}
                    onClose={handleTextDialogClose}
                    onConfirm={handleTextDialogConfirm}
                    title="Enter Text"
                    defaultValue={textDialogValue}
                    defaultFormatting={textDialogFormatting}
                  />

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
                        defaultCablingSublayerId={activeLayer?.defaultCablingSublayerId}
                        onSublayerToggle={toggleSublayerVisibility}
                        onSublayerAdd={addSublayer}
                        onSublayerRemove={removeSublayer}
                        onSublayerRename={renameSublayer}
                        onSetDefaultSublayer={setDefaultSublayer}
                        onSetDefaultCablingSublayer={setDefaultCablingSublayer}
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
        onSwapProduct={handleSwapSelectedProducts}
        onScale={handleOpenScaleDialog}
        onAssignToSublayer={handleAssignToSublayer}
        onShowProperties={handleShowProperties}
        onInsertCustomObject={handleInsertCustomObject}
        sublayers={activeLayer?.sublayers || []}
        selectedProductsCount={selectedIds.length}
        onTextEdit={handleTextEdit}
        onTextFormatBold={handleTextFormatBold}
        onTextFormatItalic={handleTextFormatItalic}
        onTextFormatUnderline={handleTextFormatUnderline}
        onTextFontSize={handleTextFontSize}
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
