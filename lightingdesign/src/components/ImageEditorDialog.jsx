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

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Load image and initialize canvas
  useEffect(() => {
    if (!open || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      initializeCanvas(img);
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

    // Save initial state to history
    saveToHistory();
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
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



  const handleToolChange = (event, newTool) => {
    if (newTool === selectedTool) {
      setSelectedTool(null);
    } else {
      setSelectedTool(newTool);
    }
  };

  const handleMouseDown = (e) => {
    if (!selectedTool || selectedTool === "crop") return;
    setIsDrawing(true);
    draw(e);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    draw(e);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleRotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    
    saveToHistory();
  };

  const handleFlip = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get current canvas content
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);

    const ctx = canvas.getContext('2d');
    ctx.save();
    
    // Flip horizontally
    ctx.scale(-1, 1);
    ctx.drawImage(tempCanvas, -canvas.width, 0);
    
    ctx.restore();
    
    saveToHistory();
  };

  const handleCropComplete = useCallback(() => {
    if (!completedCrop || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(
      completedCrop.x,
      completedCrop.y,
      completedCrop.width,
      completedCrop.height,
    );

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "80vh",
          maxHeight: "90vh",
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
      <DialogContent>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "500px",
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
                    maxHeight: "500px",
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
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                objectFit: "contain",
                cursor:
                  selectedTool === "draw"
                    ? "crosshair"
                    : selectedTool === "erase"
                      ? "not-allowed"
                      : "default",
              }}
            />
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
