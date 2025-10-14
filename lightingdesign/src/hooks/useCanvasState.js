/**
 * Canvas State Management Hook
 *
 * Manages canvas-related state including:
 * - Stage scale and position
 * - Canvas dimensions
 * - View options (grid, layers)
 * - Tool selection
 */

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";

export const useCanvasState = (initialWidth = 4200, initialHeight = 2970) => {
  // Refs
  const canvasContainerRef = useRef();
  const isInitializedRef = useRef(false);
  const referenceCanvasSizeRef = useRef({ width: initialWidth, height: initialHeight });

  // Canvas state
  const [stageScale, setStageScale] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(initialWidth);
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
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
        // Only reset position on initial load
        // This prevents resetting position when loading layer data or on window resize
        if (!isInitializedRef.current) {
          setCanvasWidth(rect.width);
          setCanvasHeight(rect.height);
          setStagePosition({
            x: rect.width / 2,
            y: rect.height / 2,
          });
          // Store reference size for scale calculations
          referenceCanvasSizeRef.current = { width: rect.width, height: rect.height };
          isInitializedRef.current = true;
        } else {
          // On window resize, adjust position proportionally to maintain viewport position
          // This prevents objects from appearing to move when the window is resized
          setCanvasWidth((prevWidth) => {
            setCanvasHeight((prevHeight) => {
              setStagePosition((prevPosition) => {
                // Calculate the proportional change in dimensions
                const widthRatio = rect.width / prevWidth;
                const heightRatio = rect.height / prevHeight;
                
                // Adjust position proportionally to maintain viewport position
                return {
                  x: prevPosition.x * widthRatio,
                  y: prevPosition.y * heightRatio,
                };
              });
              return rect.height;
            });
            return rect.width;
          });
        }
      }
    }
  }, []);

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
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    });
  }, [canvasWidth, canvasHeight]);

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

  // Calculate canvas scale adjustment based on current size vs reference size
  // This allows grid and objects to scale proportionally with canvas/window size
  const canvasScaleAdjustment = Math.min(
    canvasWidth / referenceCanvasSizeRef.current.width,
    canvasHeight / referenceCanvasSizeRef.current.height
  );

  return {
    // State
    stageScale,
    canvasWidth,
    canvasHeight,
    stagePosition,
    showGrid,
    showLayers,
    selectedTool,
    rotationSnaps,
    canvasContainerRef: setCanvasContainerRef, // Use callback ref instead of regular ref
    canvasScaleAdjustment, // Scale adjustment for grid and objects

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
