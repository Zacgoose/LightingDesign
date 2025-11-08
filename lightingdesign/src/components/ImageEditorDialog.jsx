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
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const canvasRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const drawingCanvasRef = useRef(null);

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      updateDisplay();
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

  const updateDisplay = () => {
    const sourceCanvas = canvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!sourceCanvas || !displayCanvas) return;

    const ctx = displayCanvas.getContext("2d");
    const { width, height } = sourceCanvas;

    // Apply rotation and flip transformations
    if (rotation !== 0 || flipH) {
      const radians = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      displayCanvas.width = width * cos + height * sin;
      displayCanvas.height = width * sin + height * cos;

      ctx.save();
      ctx.translate(displayCanvas.width / 2, displayCanvas.height / 2);
      ctx.rotate(radians);
      if (flipH) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(sourceCanvas, -width / 2, -height / 2);
      ctx.restore();
    } else {
      displayCanvas.width = width;
      displayCanvas.height = height;
      ctx.drawImage(sourceCanvas, 0, 0);
    }
  };

  useEffect(() => {
    updateDisplay();
  }, [rotation, flipH]);

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

    updateDisplay();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    setFlipH((prev) => !prev);
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
    updateDisplay();
  }, [completedCrop]);

  const handleSave = () => {
    // Apply rotation and flip if any
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) return;

    let finalCanvas = sourceCanvas;

    if (rotation !== 0 || flipH) {
      finalCanvas = displayCanvasRef.current;
    }

    const dataURL = finalCanvas.toDataURL("image/png");
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
                  ref={displayCanvasRef}
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
            <Box sx={{ position: "relative" }}>
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
                  display: rotation === 0 && !flipH ? "block" : "none",
                }}
              />
              <canvas
                ref={displayCanvasRef}
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                  objectFit: "contain",
                  display: rotation !== 0 || flipH ? "block" : "none",
                }}
              />
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
