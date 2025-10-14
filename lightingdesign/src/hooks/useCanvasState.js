/**
 * Canvas State Management Hook
 *
 * Manages canvas-related state including:
 * - Stage scale and position
 * - Virtual canvas dimensions (fixed coordinate space)
 * - Viewport dimensions (actual visible area that changes with window size)
 * - View options (grid, layers)
 * - Tool selection
 * 
 * Key Concept: This hook maintains a fixed virtual coordinate space (VIRTUAL_WIDTH x VIRTUAL_HEIGHT)
 * that never changes regardless of window size. The viewport dimensions (viewportWidth/viewportHeight)
 * represent the actual visible area and change with window resizing. This separation ensures that
 * object positions remain stable when the window is resized.
 */

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";

export const useCanvasState = (initialWidth = 4200, initialHeight = 2970) => {
  // Refs
  const canvasContainerRef = useRef();
  const isInitializedRef = useRef(false);

  // Fixed virtual canvas dimensions - this never changes regardless of window size
  // This creates a stable coordinate space for all objects
  const VIRTUAL_WIDTH = 10000;
  const VIRTUAL_HEIGHT = 10000;

  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  // viewportWidth and viewportHeight represent the actual visible area (window size)
  const [viewportWidth, setViewportWidth] = useState(initialWidth);
  const [viewportHeight, setViewportHeight] = useState(initialHeight);
  const [stagePosition, setStagePosition] = useState({
    x: initialWidth / 2,
    y: initialHeight / 2,
  });

  // View options
  const [showGrid, setShowGrid] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [selectedTool, setSelectedTool] = useState("select");
  const [rotationSnaps, setRotationSnaps] = useState(8);

  // Resize handler function
  const handleResize = useCallback(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const oldViewportWidth = viewportWidth;
        const oldViewportHeight = viewportHeight;
        
        setViewportWidth(rect.width);
        setViewportHeight(rect.height);
        
        // Only reset position on initial load
        if (!isInitializedRef.current) {
          setStagePosition({
            x: rect.width / 2,
            y: rect.height / 2,
          });
          isInitializedRef.current = true;
        } else {
          // On window resize, adjust stage position to maintain the same view
          // Calculate the delta in viewport size and adjust position proportionally
          const deltaX = (rect.width - oldViewportWidth) / 2;
          const deltaY = (rect.height - oldViewportHeight) / 2;
          
          setStagePosition((pos) => ({
            x: pos.x + deltaX,
            y: pos.y + deltaY,
          }));
        }
      }
    }
  }, [viewportWidth, viewportHeight]);

  // Canvas interaction handlers
  const handleWheel = useCallback((e) => {
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
  }, []);

  const handleStageDragEnd = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setStagePosition({ x: e.target.x(), y: e.target.y() });
    }
  }, []);

  const handleCanvasPan = useCallback((dx, dy) => {
    setStagePosition((pos) => ({ x: pos.x + dx, y: pos.y + dy }));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setStageScale((scale) => Math.min(scale * 1.5, 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setStageScale((scale) => Math.max(scale / 1.5, 0.01));
  }, []);

  const handleResetView = useCallback(() => {
    setStageScale(1);
    setStagePosition({
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    });
  }, [viewportWidth, viewportHeight]);

  // Handle canvas resize - using useLayoutEffect to run synchronously before paint
  // This is CRITICAL for preventing race conditions on page refresh where layer data
  // might load before canvas dimensions are properly set
  useLayoutEffect(() => {
    // Call immediately to ensure dimensions are set BEFORE any layer loading occurs
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Callback ref to handle initial dimension calculation
  // This ensures dimensions are set as soon as the container is mounted in the DOM
  const setCanvasContainerRef = useCallback(
    (node) => {
      canvasContainerRef.current = node;
      if (node && !isInitializedRef.current) {
        // Force an immediate resize calculation when the ref is first attached
        handleResize();
      }
    },
    [handleResize],
  );

  return {
    // State
    stageScale,
    canvasWidth: VIRTUAL_WIDTH, // Virtual canvas width (fixed coordinate space)
    canvasHeight: VIRTUAL_HEIGHT, // Virtual canvas height (fixed coordinate space)
    viewportWidth, // Actual visible viewport width
    viewportHeight, // Actual visible viewport height
    stagePosition,
    showGrid,
    showLayers,
    selectedTool,
    rotationSnaps,
    canvasContainerRef: setCanvasContainerRef, // Use callback ref instead of regular ref

    // Setters
    setStageScale,
    setStagePosition,
    setShowGrid,
    setShowLayers,
    setSelectedTool,
    setRotationSnaps,

    // Handlers
    handleWheel,
    handleStageDragEnd,
    handleCanvasPan,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  };
};

export default useCanvasState;
