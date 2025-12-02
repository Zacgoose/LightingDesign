import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tab,
  Tabs,
  Slider,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
} from "@mui/material";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Crop,
  Rotate90DegreesCcw,
  Brush,
  HighlightOff,
  Undo,
  Redo,
} from "@mui/icons-material";

export const ImageEditorDialog = ({ open, onClose, imageData, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [drawingMode, setDrawingMode] = useState(null); // 'draw' | 'erase' | null
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("black");
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1);
      return [...newHistory, dataUrl];
    });
    setHistoryStep((prev) => prev + 1);
  }, [historyStep]);

  // Load image when dialog opens
  useEffect(() => {
    if (open && imageData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        imageRef.current = img;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Save initial state to history
        saveToHistory();
      };

      img.src = imageData;
    }
  }, [open, imageData, saveToHistory]);

  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      
      img.src = history[historyStep - 1];
      setHistoryStep((prev) => prev - 1);
    }
  }, [history, historyStep]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      
      img.src = history[historyStep + 1];
      setHistoryStep((prev) => prev + 1);
    }
  }, [history, historyStep]);

  const handleRotate = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const currentRotation = rotation;
    const newRotation = (rotation + 90) % 360;

    // Determine if we need to swap dimensions based on the transition
    const needsSwap = (currentRotation === 0 || currentRotation === 180) && 
                      (newRotation === 90 || newRotation === 270);
    
    if (needsSwap) {
      const temp = canvas.width;
      canvas.width = canvas.height;
      canvas.height = temp;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((newRotation * Math.PI) / 180);
    
    // Draw the original image, not the current canvas content
    const img = imageRef.current;
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    setRotation(newRotation);
    saveToHistory();
  }, [rotation, saveToHistory]);

  const handleMouseDown = useCallback((e) => {
    if (!drawingMode) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = drawingMode === "erase" ? "white" : brushColor;
    ctx.globalCompositeOperation = drawingMode === "erase" ? "destination-out" : "source-over";
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [drawingMode, brushSize, brushColor]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !drawingMode) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, drawingMode]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  }, [isDrawing, saveToHistory]);

  const handleSave = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const editedImageData = canvas.toDataURL("image/png");
    onSave(editedImageData);
    onClose();
  }, [onSave, onClose]);

  const handleCancel = useCallback(() => {
    setActiveTab(0);
    setRotation(0);
    setDrawingMode(null);
    setHistory([]);
    setHistoryStep(-1);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Image</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Crop & Rotate" icon={<Crop />} iconPosition="start" />
            <Tab label="Draw & Erase" icon={<Brush />} iconPosition="start" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Rotate90DegreesCcw />}
                onClick={handleRotate}
              >
                Rotate 90°
              </Button>
              <Typography variant="body2" sx={{ alignSelf: "center" }}>
                Current Rotation: {rotation}°
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
              <ToggleButtonGroup
                value={drawingMode}
                exclusive
                onChange={(e, value) => setDrawingMode(value)}
                size="small"
              >
                <ToggleButton value="draw">
                  <Brush fontSize="small" />
                  <Typography sx={{ ml: 1 }}>Draw</Typography>
                </ToggleButton>
                <ToggleButton value="erase">
                  <HighlightOff fontSize="small" />
                  <Typography sx={{ ml: 1 }}>Erase</Typography>
                </ToggleButton>
              </ToggleButtonGroup>

              {drawingMode === "draw" && (
                <ToggleButtonGroup
                  value={brushColor}
                  exclusive
                  onChange={(e, value) => value && setBrushColor(value)}
                  size="small"
                >
                  <ToggleButton value="black">Black</ToggleButton>
                  <ToggleButton value="white">White</ToggleButton>
                </ToggleButtonGroup>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 200 }}>
                <Typography variant="caption">Size:</Typography>
                <Slider
                  value={brushSize}
                  onChange={(e, value) => setBrushSize(value)}
                  min={1}
                  max={20}
                  step={1}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption">{brushSize}</Typography>
              </Box>

              <IconButton onClick={handleUndo} disabled={historyStep <= 0}>
                <Undo />
              </IconButton>
              <IconButton onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                <Redo />
              </IconButton>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "auto",
            maxHeight: "60vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "background.paper",
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: drawingMode ? "crosshair" : "default",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="error">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageEditorDialog;
