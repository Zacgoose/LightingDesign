/**
 * Canvas State Management Hook
 *
 * Manages canvas-related state including:
 * - Stage scale and position
 * - Canvas dimensions
 * - View options (grid, layers)
 * - Tool selection
 */

import { useState, useCallback, useEffect, useRef } from "react";

export const useCanvasState = (initialWidth = 4200, initialHeight = 2970) => {
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

  // Refs
  const canvasContainerRef = useRef();

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

  // Handle canvas resize
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
    canvasContainerRef,

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
