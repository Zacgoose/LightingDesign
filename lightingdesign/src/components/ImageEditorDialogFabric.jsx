import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Canvas, FabricImage, PencilBrush } from "fabric";
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
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
} from "@mui/icons-material";

export const ImageEditorDialogFabric = (props) => {
  const { onClose, onSave, open = false, imageUrl, ...other } = props;
  const [selectedTool, setSelectedTool] = useState("erase");
  const [brushSize, setBrushSize] = useState(10);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const backgroundImageRef = useRef(null);

  // Initialize Fabric.js canvas
  useEffect(() => {
    console.log("[ImageEditor] useEffect triggered - open:", open, "imageUrl:", imageUrl);
    if (!open || !imageUrl) {
      console.log("[ImageEditor] Early return - dialog not ready");
      return;
    }

    // Dialog content may not be rendered yet, use setTimeout to wait for next tick
    const timeoutId = setTimeout(() => {
      // Set canvas element size attributes first
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        console.log("[ImageEditor] Canvas element not found even after timeout");
        return;
      }
      
      console.log("[ImageEditor] Canvas element found, proceeding with initialization");
    
    canvasElement.width = 800;
    canvasElement.height = 600;

    const canvas = new Canvas(canvasElement, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    // Load background image using v6 API
    FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" })
      .then((img) => {
        console.log("Image loaded:", img.width, img.height);
        
        // Calculate scale to fit image in canvas
        const scale = Math.min(
          800 / img.width,
          600 / img.height
        );
        
        console.log("Scale factor:", scale);
        console.log("Scaled dimensions:", img.width * scale, img.height * scale);
        
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: 400, // Center of 800px width
          top: 300,  // Center of 600px height
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });
        
        backgroundImageRef.current = img;
        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
        
        console.log("Canvas objects:", canvas.getObjects().length);
        console.log("Image position:", img.left, img.top);
        console.log("Canvas initialized with image");
        
        // Save initial state to history
        const json = JSON.stringify(canvas.toJSON());
        setHistory([json]);
        setHistoryStep(0);
      })
      .catch((err) => {
        console.error("Error loading image:", err);
      });

    // Set up drawing mode for eraser (default tool)
    canvas.isDrawingMode = true;
    const eraserBrush = new PencilBrush(canvas);
    eraserBrush.width = brushSize;
    eraserBrush.color = "rgba(255, 255, 255, 1)";
    eraserBrush.globalCompositeOperation = "destination-out";
    canvas.freeDrawingBrush = eraserBrush;

    // Save to history after drawing
    canvas.on("path:created", () => {
      const json = JSON.stringify(canvas.toJSON());
      setHistory((prev) => {
        const currentStep = historyStep;
        const newHistory = prev.slice(0, currentStep + 1);
        newHistory.push(json);
        return newHistory;
      });
      setHistoryStep((prev) => prev + 1);
    });
    }, 0); // End of setTimeout

    return () => {
      clearTimeout(timeoutId);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
      fabricCanvasRef.current = null;
      backgroundImageRef.current = null;
    };
  }, [open, imageUrl]);

  // Update tool mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (selectedTool === "draw") {
      canvas.isDrawingMode = true;
      const pencilBrush = new PencilBrush(canvas);
      pencilBrush.width = brushSize;
      pencilBrush.color = "rgba(0, 0, 0, 1)";
      canvas.freeDrawingBrush = pencilBrush;
    } else if (selectedTool === "erase") {
      canvas.isDrawingMode = true;
      // Use PencilBrush with destination-out composite operation for erasing
      const eraserBrush = new PencilBrush(canvas);
      eraserBrush.width = brushSize;
      eraserBrush.color = "rgba(255, 255, 255, 1)"; // Color doesn't matter for destination-out
      eraserBrush.globalCompositeOperation = "destination-out";
      canvas.freeDrawingBrush = eraserBrush;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [selectedTool, brushSize]);

  // Update brush size
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.width = brushSize;
  }, [brushSize]);

  const saveToHistory = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(json);
      return newHistory;
    });
    setHistoryStep((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyStep <= 0) return;
    
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
    });
  };

  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
    });
  };

  const handleRotate = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !backgroundImageRef.current) return;

    const img = backgroundImageRef.current;
    const currentAngle = img.angle || 0;
    img.rotate(currentAngle + 90);
    canvas.renderAll();
    saveToHistory();
  };

  const handleFlip = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !backgroundImageRef.current) return;

    const img = backgroundImageRef.current;
    img.set("flipX", !img.flipX);
    canvas.renderAll();
    saveToHistory();
  };

  const handleZoomIn = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const zoom = canvas.getZoom();
    canvas.setZoom(zoom * 1.1);
  };

  const handleZoomOut = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const zoom = canvas.getZoom();
    canvas.setZoom(zoom * 0.9);
  };

  const handleResetView = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.setZoom(1);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    canvas.renderAll();
  };

  const handleSave = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Export canvas as image
    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
    });

    onSave(dataUrl);
    onClose();
  };

  const handleToolChange = (event, newTool) => {
    if (newTool === selectedTool) {
      setSelectedTool(null);
    } else {
      setSelectedTool(newTool);
    }
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
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={handleRotate} aria-label="rotate" size="small">
                <Rotate90DegreesCcw />
              </IconButton>
              <IconButton onClick={handleFlip} aria-label="flip" size="small">
                <Flip />
              </IconButton>
              <IconButton onClick={handleZoomIn} aria-label="zoom in" size="small">
                <ZoomIn />
              </IconButton>
              <IconButton onClick={handleZoomOut} aria-label="zoom out" size="small">
                <ZoomOut />
              </IconButton>
              <IconButton onClick={handleResetView} aria-label="reset view" size="small">
                <CenterFocusStrong />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(95vh - 200px)",
            backgroundColor: "#e0e0e0",
            p: 2,
          }}
        >
          <canvas 
            ref={canvasRef} 
            style={{ 
              border: "1px solid #ccc",
              display: "block",
            }} 
          />
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

ImageEditorDialogFabric.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  open: PropTypes.bool,
  imageUrl: PropTypes.string,
};

export default ImageEditorDialogFabric;
