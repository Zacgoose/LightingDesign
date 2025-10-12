/**
 * Layer Management System
 * 
 * Provides state management for multiple floor layers and sublayers
 * Each floor layer can contain multiple sublayers for different object types
 */

import { useState, useCallback } from 'react';

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
    { id: `${id}-lights`, name: 'Lights', visible: true, type: 'light' },
    { id: `${id}-power`, name: 'Power Points', visible: true, type: 'power' },
    { id: `${id}-switches`, name: 'Switches', visible: true, type: 'switch' },
    { id: `${id}-other`, name: 'Other', visible: true, type: 'other' },
  ],
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

  // Get active layer
  const getActiveLayer = useCallback(() => {
    return layers.find(l => l.id === activeLayerId) || layers[0];
  }, [layers, activeLayerId]);

  // Add a new layer
  const addLayer = useCallback((name) => {
    const newId = `layer-${Date.now()}`;
    const newLayer = createEmptyLayer(newId, name || `Floor ${layers.length + 1}`);
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newId);
    return newLayer;
  }, [layers.length]);

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
    const visibleSublayers = getVisibleSublayers(layerId);
    const visibleTypes = visibleSublayers.map(sub => sub.type);
    
    return products.filter(product => {
      const productType = product.product_type?.toLowerCase();
      // Map product types to sublayer types
      if (productType?.includes('light')) return visibleTypes.includes('light');
      if (productType?.includes('power') || productType?.includes('outlet')) return visibleTypes.includes('power');
      if (productType?.includes('switch')) return visibleTypes.includes('switch');
      return visibleTypes.includes('other');
    });
  }, [getVisibleSublayers]);

  // Reorder layers
  const reorderLayers = useCallback((startIndex, endIndex) => {
    setLayers(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    layers,
    activeLayerId,
    activeLayer: getActiveLayer(),
    setActiveLayerId,
    addLayer,
    deleteLayer,
    updateLayer,
    updateActiveLayer,
    toggleSublayerVisibility,
    getVisibleSublayers,
    filterProductsBySublayers,
    reorderLayers,
  };
};

export default useLayerManager;
