import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Stack,
  Slider,
  Paper,
} from "@mui/material";
import {
  Brush,
  Delete as EraseIcon,
  Crop,
  Rotate90DegreesCcw,
  Flip,
  Undo,
  Redo,
} from "@mui/icons-material";

export const ImageEditorDialog = (props) => {
  const { onClose, onSave, open = false, imageUrl, ...other } = props;
  const [selectedTool, setSelectedTool] = useState(null);
  const [brushSize, setBrushSize] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const canvasDataRef = useRef(null); // Store canvas data between re-renders

  // Load image and initialize canvas
  useEffect(() => {
    if (!open || !imageUrl) {
      // Reset state when dialog closes
      if (!open) {
        setHistory([]);
        setHistoryStep(-1);
        setSelectedTool(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        canvasDataRef.current = null;
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      initializeCanvas(img);
      // Set eraser as default tool when opening
      setSelectedTool("erase");
    };
    img.src = imageUrl;
  }, [open, imageUrl]);

  const initializeCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Save initial state to history and cache
    const imageData = canvas.toDataURL();
    canvasDataRef.current = imageData;
    
    setHistory([imageData]);
    setHistoryStep(0);
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    canvasDataRef.current = imageData; // Keep ref in sync
    
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(imageData);
      return newHistory;
    });
    setHistoryStep((prev) => prev + 1);
  };

  const restoreFromHistory = (step) => {
    if (step < 0 || step >= history.length) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Update cached data
      canvasDataRef.current = history[step];
    };
    img.src = history[step];
    setHistoryStep(step);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      restoreFromHistory(historyStep - 1);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      restoreFromHistory(historyStep + 1);
    }
  };



  // Restore canvas content when canvas ref changes or when switching tools
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasDataRef.current) return;

    console.log('[ImageEditor] Restoring canvas from cached data');
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = canvasDataRef.current;
  }, [selectedTool]);

  const handleToolChange = (event, newTool) => {
    // Save current canvas state before switching tools
    const canvas = canvasRef.current;
    if (canvas) {
      canvasDataRef.current = canvas.toDataURL();
      console.log('[ImageEditor] Saved canvas data before tool change');
    }
    
    if (newTool === selectedTool) {
      setSelectedTool(null);
    } else {
      setSelectedTool(newTool);
    }
  };

  const handleMouseDown = (e) => {
    console.log('[ImageEditor] Mouse down', { selectedTool, hasCanvas: !!canvasRef.current });
    
    // Handle panning with middle mouse button or space + left click
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
      return;
    }
    
    if (!selectedTool || selectedTool === "crop") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Start a new path for this stroke
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.moveTo(x, y);
    
    setIsDrawing(true);
    draw(e);
  };

  const handleMouseMove = (e) => {
    // Handle panning
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }
    
    // Update cursor position for preview
    if (selectedTool === "draw" || selectedTool === "erase") {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setCursorPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
    
    if (!isDrawing) return;
    draw(e);
  };

  const handleMouseEnter = () => {
    if (selectedTool === "draw" || selectedTool === "erase") {
      setShowCursor(true);
    }
  };

  const handleMouseLeaveCanvas = () => {
    setShowCursor(false);
    setIsPanning(false);
    if (isDrawing) {
      console.log('[ImageEditor] Drawing complete (mouse left canvas), saving to history');
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5);
    
    setZoom(newZoom);
    
    // Reset pan offset when zooming to keep image centered
    if (newZoom === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing) {
      console.log('[ImageEditor] Drawing complete, saving to history');
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[ImageEditor] Canvas ref is null in draw()');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (selectedTool === "draw") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#000000";
    } else if (selectedTool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleRotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[ImageEditor] Canvas ref is null in handleRotate()');
      return;
    }

    console.log('[ImageEditor] Rotating image', { 
      beforeWidth: canvas.width, 
      beforeHeight: canvas.height 
    });

    // Get current canvas content
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    // Swap dimensions for 90 degree rotation
    canvas.width = tempCanvas.height;
    canvas.height = tempCanvas.width;

    const ctx = canvas.getContext('2d');
    ctx.save();
    
    // Rotate 90 degrees counter-clockwise
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
    
    ctx.restore();
    
    console.log('[ImageEditor] After rotation', { 
      afterWidth: canvas.width, 
      afterHeight: canvas.height 
    });
    
    saveToHistory();
  };

  const handleFlip = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[ImageEditor] Canvas ref is null in handleFlip()');
      return;
    }

    console.log('[ImageEditor] Flipping image horizontally');

    // Get current canvas content
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Flip horizontally
    ctx.scale(-1, 1);
    ctx.drawImage(tempCanvas, -canvas.width, 0);
    
    ctx.restore();
    
    saveToHistory();
  };

  const handleCropComplete = useCallback(() => {
    if (!completedCrop || !canvasRef.current) {
      console.log('[ImageEditor] Crop complete called but missing data', { 
        hasCompletedCrop: !!completedCrop, 
        hasCanvas: !!canvasRef.current 
      });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    console.log('[ImageEditor] Cropping with coordinates', {
      crop: completedCrop,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });
    
    // ReactCrop returns pixel coordinates, but we need to ensure they're within bounds
    const x = Math.max(0, Math.min(Math.floor(completedCrop.x), canvas.width - 1));
    const y = Math.max(0, Math.min(Math.floor(completedCrop.y), canvas.height - 1));
    const width = Math.max(1, Math.min(Math.floor(completedCrop.width), canvas.width - x));
    const height = Math.max(1, Math.min(Math.floor(completedCrop.height), canvas.height - y));
    
    console.log('[ImageEditor] Adjusted crop coordinates', { x, y, width, height });
    
    const imageData = ctx.getImageData(x, y, width, height);

    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(imageData, 0, 0);

    setCrop(undefined);
    setCompletedCrop(undefined);
    setSelectedTool(null);
    saveToHistory();
  }, [completedCrop]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL("image/png");
    onSave?.(dataURL);
    onClose?.();
  };

  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "95vh",
          maxHeight: "95vh",
          m: 1,
        },
      }}
      {...other}
    >
      <DialogTitle>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Edit Background Image</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={handleUndo}
                disabled={historyStep <= 0}
                aria-label="undo"
                size="small"
              >
                <Undo />
              </IconButton>
              <IconButton
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                aria-label="redo"
                size="small"
              >
                <Redo />
              </IconButton>
            </Stack>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <ToggleButtonGroup
              value={selectedTool}
              exclusive
              onChange={handleToolChange}
              size="small"
              aria-label="image editing tools"
            >
              <ToggleButton value="draw" aria-label="draw">
                <Brush fontSize="small" />
              </ToggleButton>
              <ToggleButton value="erase" aria-label="erase">
                <EraseIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="crop" aria-label="crop">
                <Crop fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            {(selectedTool === "draw" || selectedTool === "erase") && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 200 }}>
                <Typography variant="caption">Brush Size:</Typography>
                <Slider
                  value={brushSize}
                  onChange={(e, value) => setBrushSize(value)}
                  min={1}
                  max={50}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
            )}
            <Stack direction="row" spacing={1}>
              <IconButton onClick={handleRotate} aria-label="rotate" size="small">
                <Rotate90DegreesCcw />
              </IconButton>
              <IconButton onClick={handleFlip} aria-label="flip" size="small">
                <Flip />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent onWheel={handleWheel}>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(95vh - 200px)",
            backgroundColor: "#f5f5f5",
            p: 2,
            position: "relative",
          }}
        >
          {selectedTool === "crop" ? (
            <Box>
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "calc(95vh - 250px)",
                    objectFit: "contain",
                  }}
                />
              </ReactCrop>
              {completedCrop && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCropComplete}
                  sx={{ mt: 1 }}
                >
                  Apply Crop
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ position: "relative", overflow: "hidden" }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeaveCanvas}
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(95vh - 250px)",
                  objectFit: "contain",
                  cursor: isPanning ? "grabbing" : "none",
                  transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                  transformOrigin: "center center",
                  transition: isPanning ? "none" : "transform 0.1s ease-out",
                }}
              />
              {/* Custom cursor preview for brush/eraser */}
              {showCursor && (selectedTool === "draw" || selectedTool === "erase") && (
                <Box
                  sx={{
                    position: "absolute",
                    left: cursorPosition.x,
                    top: cursorPosition.y,
                    width: `${brushSize * zoom}px`,
                    height: `${brushSize * zoom}px`,
                    backgroundColor: selectedTool === "draw" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 0, 0, 0.3)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                    transform: "translate(-50%, -50%)",
                    zIndex: 1000,
                  }}
                />
              )}
            </Box>
          )}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ImageEditorDialog.propTypes = {
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  open: PropTypes.bool,
  imageUrl: PropTypes.string,
};
