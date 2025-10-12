/**
 * Layer Management System
 * 
 * Provides state management for multiple floor layers and sublayers
 * Each floor layer can contain multiple sublayers for different object types
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Creates a new empty floor layer
 */
export const createEmptyLayer = (id, name) => ({
  id,
  name,
  visible: true,
  locked: false,
  backgroundImage: null,
  backgroundImageNaturalSize: null,
  products: [],
  connectors: [],
  sublayers: [
    { id: `${id}-default`, name: 'Default', visible: true, isDefault: true },
  ],
  defaultSublayerId: `${id}-default`, // Track which sublayer is default for new objects
  scaleFactor: 100, // 100px per meter - each floor can have different scale
});

/**
 * Hook for managing layers
 */
export const useLayerManager = (initialLayers = null) => {
  const [layers, setLayers] = useState(() => {
    if (initialLayers && initialLayers.length > 0) {
      return initialLayers;
    }
    // Create default first layer
    return [createEmptyLayer('layer-1', 'Floor 1')];
  });
  
  const [activeLayerId, setActiveLayerId] = useState(() => {
    return (initialLayers && initialLayers.length > 0) ? initialLayers[0].id : 'layer-1';
  });

  // Get active layer - memoized to prevent unnecessary re-renders
  const activeLayer = useMemo(() => {
    return layers.find(l => l.id === activeLayerId) || layers[0];
  }, [layers, activeLayerId]);

  // Get active layer function (for backwards compatibility if needed)
  const getActiveLayer = useCallback(() => {
    return activeLayer;
  }, [activeLayer]);

  // Add a new layer
  const addLayer = useCallback((name) => {
    const newId = `layer-${Date.now()}`;
    setLayers(prev => {
      const newLayer = createEmptyLayer(newId, name || `Floor ${prev.length + 1}`);
      return [...prev, newLayer];
    });
    setActiveLayerId(newId);
  }, []);

  // Delete a layer
  const deleteLayer = useCallback((layerId) => {
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== layerId);
      // Ensure at least one layer exists
      if (filtered.length === 0) {
        // If all layers are deleted, reset active layer to default
        setActiveLayerId('layer-1');
        return [createEmptyLayer('layer-1', 'Floor 1')];
      }
      // If deleting active layer, switch to first available in filtered
      if (layerId === activeLayerId) {
        setActiveLayerId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeLayerId]);

  // Update layer properties
  const updateLayer = useCallback((layerId, updates) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  // Update active layer
  const updateActiveLayer = useCallback((updates) => {
    updateLayer(activeLayerId, updates);
  }, [activeLayerId, updateLayer]);

  // Toggle sublayer visibility
  const toggleSublayerVisibility = useCallback((layerId, sublayerId) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          sublayers: layer.sublayers.map(sub =>
            sub.id === sublayerId ? { ...sub, visible: !sub.visible } : sub
          ),
        };
      }
      return layer;
    }));
  }, []);

  // Get visible sublayers for a layer
  const getVisibleSublayers = useCallback((layerId) => {
    const layer = layers.find(l => l.id === layerId);
    return layer ? layer.sublayers.filter(sub => sub.visible) : [];
  }, [layers]);

  // Filter products by visible sublayers
  const filterProductsBySublayers = useCallback((products, layerId) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return products;
    
    const visibleSublayerIds = layer.sublayers
      .filter(sub => sub.visible)
      .map(sub => sub.id);
    
    return products.filter(product => {
      // If product doesn't have a sublayer assignment, show it in all visible sublayers
      if (!product.sublayerId) return true;
      return visibleSublayerIds.includes(product.sublayerId);
    });
  }, [layers]);

  // Add a new sublayer to a layer
  const addSublayer = useCallback((layerId, name) => {
    const newSublayerId = `${layerId}-sublayer-${Date.now()}`;
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          sublayers: [
            ...layer.sublayers,
            { id: newSublayerId, name: name || `Layer ${layer.sublayers.length + 1}`, visible: true, isDefault: false }
          ],
        };
      }
      return layer;
    }));
    return newSublayerId;
  }, []);

  // Remove a sublayer from a layer
  const removeSublayer = useCallback((layerId, sublayerId) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const filteredSublayers = layer.sublayers.filter(sub => sub.id !== sublayerId);
        // Ensure at least one sublayer exists
        if (filteredSublayers.length === 0) {
          return {
            ...layer,
            sublayers: [{ id: `${layerId}-default`, name: 'Default', visible: true, isDefault: true }],
            defaultSublayerId: `${layerId}-default`,
          };
        }
        // If removing the default sublayer, set the first remaining as default
        let newDefaultId = layer.defaultSublayerId;
        if (sublayerId === layer.defaultSublayerId) {
          newDefaultId = filteredSublayers[0].id;
        }
        return {
          ...layer,
          sublayers: filteredSublayers.map(sub => ({
            ...sub,
            isDefault: sub.id === newDefaultId
          })),
          defaultSublayerId: newDefaultId,
        };
      }
      return layer;
    }));
  }, []);

  // Rename a sublayer
  const renameSublayer = useCallback((layerId, sublayerId, newName) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          sublayers: layer.sublayers.map(sub =>
            sub.id === sublayerId ? { ...sub, name: newName } : sub
          ),
        };
      }
      return layer;
    }));
  }, []);

  // Set default sublayer for new objects
  const setDefaultSublayer = useCallback((layerId, sublayerId) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          defaultSublayerId: sublayerId,
        };
      }
      return layer;
    }));
  }, []);

  // Assign products to a sublayer
  const assignProductsToSublayer = useCallback((layerId, productIds, sublayerId) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          products: layer.products.map(product =>
            productIds.includes(product.id)
              ? { ...product, sublayerId }
              : product
          ),
        };
      }
      return layer;
    }));
  }, []);

  // Reorder layers
  const reorderLayers = useCallback((startIndex, endIndex) => {
    setLayers(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  // Load layers (replace all layers with new ones)
  const loadLayers = useCallback((newLayers) => {
    if (newLayers && newLayers.length > 0) {
      setLayers(newLayers);
      // Set active layer to first layer if current active doesn't exist in new layers
      const layerIds = newLayers.map(l => l.id);
      if (!layerIds.includes(activeLayerId)) {
        setActiveLayerId(newLayers[0].id);
      }
    }
  }, [activeLayerId]);

  return {
    layers,
    activeLayerId,
    activeLayer,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    updateLayer,
    updateActiveLayer,
    toggleSublayerVisibility,
    getVisibleSublayers,
    filterProductsBySublayers,
    reorderLayers,
    loadLayers,
    addSublayer,
    removeSublayer,
    renameSublayer,
    setDefaultSublayer,
    assignProductsToSublayer,
  };
};

export default useLayerManager;