/**
 * Design Loader Hook
 *
 * Optimized design loading with batched state updates
 * to prevent performance issues when loading existing designs
 */

import { useEffect, useRef, useCallback, startTransition } from "react";

export const useDesignLoader = ({
  designData,
  productsData,
  onLoadComplete,
  updateHistory,
  setConnectors,
  setStageScale,
  loadLayers,
  setLastSaved,
  setHasUnsavedChanges,
  setBackgroundImage,
  setBackgroundImageNaturalSize,
  setScaleFactor,
}) => {
  // Ref to track if we've already loaded this design
  const loadedDesignIdRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Helper function to strip unnecessary metadata from products before saving
  const stripProductMetadata = useCallback((product) => {
    // Keep essential data for canvas operations, identification, and properties display
    return {
      id: product.id,
      x: product.x,
      y: product.y,
      rotation: product.rotation,
      scaleX: product.scaleX,
      scaleY: product.scaleY,
      baseScaleX: product.baseScaleX,
      baseScaleY: product.baseScaleY,
      color: product.color,
      strokeColor: product.strokeColor,
      sku: product.sku,
      name: product.name,
      quantity: product.quantity,
      notes: product.notes,
      customLabel: product.customLabel,
      sublayerId: product.sublayerId,
      // Include scaling and dimension properties
      scaleFactor: product.scaleFactor,
      realWorldSize: product.realWorldSize,
      realWorldWidth: product.realWorldWidth,
      realWorldHeight: product.realWorldHeight,
      // Include product details for properties panel
      brand: product.brand,
      product_type: product.product_type,
      msrp: product.msrp,
      price: product.price,
      thumbnailUrl: product.thumbnailUrl,
      imageUrl: product.imageUrl,
      url: product.url,
      description: product.description,
      category: product.category,
      categories: product.categories,
      colors: product.colors,
      inStock: product.inStock,
      stockQty: product.stockQty,
      // For custom objects
      shape: product.shape,
      stroke: product.stroke,
      strokeWidth: product.strokeWidth,
      isCustomObject: product.isCustomObject,
      product_type_unigram: product.product_type_unigram,
    };
  }, []);

  // Helper function to strip unnecessary metadata from layers before saving
  const stripLayersForSave = useCallback(
    (layersToSave) => {
      return layersToSave.map((layer) => ({
        ...layer,
        products: layer.products.map(stripProductMetadata),
        // Connectors are already in the correct format, just ensure they're included
        connectors: layer.connectors || [],
      }));
    },
    [stripProductMetadata],
  );

  // Enrich a single product with API data
  const enrichProduct = useCallback((savedProduct, productsApiData) => {
    const apiProduct = productsApiData?.find((p) => p.sku === savedProduct.sku);
    if (apiProduct) {
      // Merge saved canvas data with fresh API data
      return {
        ...savedProduct,
        brand: apiProduct.brand,
        product_type: apiProduct.product_type_unigram,
        product_type_unigram: apiProduct.product_type_unigram,
        price: parseFloat(apiProduct.price) || 0,
        msrp: parseFloat(apiProduct.msrp) || 0,
        imageUrl: apiProduct.imageUrl,
        thumbnailUrl: apiProduct.thumbnailImageUrl,
        thumbnailImageUrl: apiProduct.thumbnailImageUrl, // Also add this for consistency
        url: apiProduct.url, // Website link
        category: apiProduct.top_web_category,
        categories: apiProduct.category_hierarchy || [],
        description: apiProduct.short_description,
        colors: apiProduct.item_colours || [],
        inStock: apiProduct.ss_in_stock === "1",
        stockQty: parseInt(apiProduct.stock_qty) || 0,
        metadata: apiProduct,
      };
    }
    return savedProduct;
  }, []);

  // Load design data when available - optimized with batched updates
  useEffect(() => {
    // Prevent loading if we're already loading or have loaded this design
    if (isLoadingRef.current || !designData.isSuccess || !designData.data?.designData) {
      return;
    }

    const loadedDesign = designData.data.designData;
    const designId = designData.data.RowKey || designData.data.id;

    // Skip if we've already loaded this exact design
    if (loadedDesignIdRef.current === designId) {
      return;
    }

    // Check if we need to wait for products data
    const hasProductsToEnrich =
      loadedDesign.layers && loadedDesign.layers.some((l) => l.products && l.products.length > 0);

    // If there are products to enrich, wait for products API
    if (hasProductsToEnrich && !productsData.isSuccess) {
      return;
    }

    // Mark as loading
    isLoadingRef.current = true;

    // PERFORMANCE OPTIMIZATION: Use startTransition for non-urgent updates
    // This prevents blocking the UI during heavy state updates
    startTransition(() => {
      try {
        // 1. Load canvas zoom level FIRST (most critical for initial render)
        if (loadedDesign.canvasSettings?.scale !== undefined) {
          setStageScale(loadedDesign.canvasSettings.scale);
        }

        // 2. Load layers with enriched products
        if (loadedDesign.layers && loadedDesign.layers.length > 0) {
          console.log('=== LOAD: Design layers ===');
          loadedDesign.layers.forEach((layer, idx) => {
            console.log(`Layer ${idx} (${layer.id}):`, {
              name: layer.name,
              hasBackground: !!layer.backgroundImage,
              backgroundLength: layer.backgroundImage?.length || 0,
              backgroundImageNaturalSize: layer.backgroundImageNaturalSize
            });
          });

          const enrichedLayers = loadedDesign.layers.map((layer) => ({
            ...layer,
            products: (layer.products || []).map((savedProduct) =>
              enrichProduct(savedProduct, productsData.data),
            ),
            connectors: layer.connectors || [],
          }));

          console.log('=== LOAD: Enriched layers ===');
          enrichedLayers.forEach((layer, idx) => {
            console.log(`Layer ${idx} (${layer.id}):`, {
              name: layer.name,
              hasBackground: !!layer.backgroundImage,
              backgroundLength: layer.backgroundImage?.length || 0,
              backgroundImageNaturalSize: layer.backgroundImageNaturalSize
            });
          });

          // Load all layers at once
          loadLayers(enrichedLayers);
        }

        // 3. Update metadata
        setLastSaved(designData.data.lastModified);
        setHasUnsavedChanges(false);

        // Mark this design as loaded
        loadedDesignIdRef.current = designId;

        // Notify completion
        if (onLoadComplete) {
          onLoadComplete();
        }
      } finally {
        // Clear loading flag after a short delay to ensure all state updates complete
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 100);
      }
    });
  }, [
    designData.isSuccess,
    designData.data,
    productsData.isSuccess,
    productsData.data,
    enrichProduct,
    updateHistory,
    setConnectors,
    setStageScale,
    loadLayers,
    setLastSaved,
    setHasUnsavedChanges,
    onLoadComplete,
  ]);

  // Reset loaded design ID when design data changes
  useEffect(() => {
    if (!designData.isSuccess) {
      loadedDesignIdRef.current = null;
    }
  }, [designData.isSuccess]);

  return {
    stripProductMetadata,
    stripLayersForSave,
    isLoading: isLoadingRef.current,
  };
};

export default useDesignLoader;
