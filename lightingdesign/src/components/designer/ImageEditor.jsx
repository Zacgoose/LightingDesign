import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Slider,
  Typography,
  Button,
} from "@mui/material";
import {
  Crop,
  FlipToFront,
  Rotate90DegreesCw,
  Edit,
  Clear,
  Check,
  Close,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
} from "@mui/icons-material";
import { Stage, Layer, Image as KonvaImage, Rect, Line, Transformer } from "react-konva";
import Konva from "konva";

/**
 * ImageEditor - A canvas-based image editor component
 * 
 * Features:
 * - Crop: Click "Crop" to enable crop mode, drag/resize the crop box, then "Apply Crop"
 * - Rotate: Click rotate button to rotate image 90° clockwise
 * - Flip: Click flip horizontal or flip vertical buttons
 * - Draw: Select the "Draw" tool to add freehand markup annotations
 * - Clear: Remove all drawings
 * - Zoom: Use mouse wheel to zoom in/out
 * - Pan: In "Select" mode, drag to pan around the image
 * - Undo/Redo: History tracking for all operations
 */
export const ImageEditor = ({ imageUrl, onSave, onCancel, width = 800, height = 600 }) => {
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const cropperRef = useRef(null);
  const transformerRef = useRef(null);
  const layerRef = useRef(null);
  const [image, setImage] = useState(null);
  const [tool, setTool] = useState("select");
  const [scale, setScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(1);
  const [flipY, setFlipY] = useState(1);
  const [cropRect, setCropRect] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);

  // Load image and center it
  useEffect(() => {
    if (!imageUrl) return;

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      setImage(img);

      // Calculate initial scale to fit image in viewport
      const imgAspectRatio = img.width / img.height;
      const containerAspectRatio = width / height;

      let initialScale;
      if (imgAspectRatio > containerAspectRatio) {
        initialScale = (width * 0.85) / img.width;
      } else {
        initialScale = (height * 0.85) / img.height;
      }

      setScale(initialScale);
      
      // Center the image in the viewport
      const scaledWidth = img.width * initialScale;
      const scaledHeight = img.height * initialScale;
      setStagePosition({
        x: (width - scaledWidth) / 2,
        y: (height - scaledHeight) / 2,
      });

      // Save initial state
      const initialState = {
        rotation: 0,
        flipX: 1,
        flipY: 1,
        drawings: [],
        scale: initialScale,
        stagePosition: {
          x: (width - scaledWidth) / 2,
          y: (height - scaledHeight) / 2,
        },
      };
      setHistory([initialState]);
      setHistoryStep(0);
    };
    img.src = imageUrl;
  }, [imageUrl, width, height]);

  // Setup transformer for crop
  useEffect(() => {
    if (isCropping && cropperRef.current && transformerRef.current) {
      transformerRef.current.nodes([cropperRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isCropping]);

  const saveToHistory = useCallback(() => {
    const state = {
      rotation,
      flipX,
      flipY,
      drawings: [...drawings],
      scale,
      stagePosition: { ...stagePosition },
    };

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [rotation, flipX, flipY, drawings, scale, stagePosition, history, historyStep]);

  const undo = () => {
    if (historyStep > 0) {
      const prevState = history[historyStep - 1];
      setRotation(prevState.rotation);
      setFlipX(prevState.flipX);
      setFlipY(prevState.flipY);
      setDrawings(prevState.drawings);
      setScale(prevState.scale);
      setStagePosition(prevState.stagePosition);
      setHistoryStep(historyStep - 1);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextState = history[historyStep + 1];
      setRotation(nextState.rotation);
      setFlipX(nextState.flipX);
      setFlipY(nextState.flipY);
      setDrawings(nextState.drawings);
      setScale(nextState.scale);
      setStagePosition(nextState.stagePosition);
      setHistoryStep(historyStep + 1);
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();

    if (!image) return;

    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();

    // Calculate the point on the image that's under the mouse
    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const boundedScale = Math.max(0.1, Math.min(10, newScale));

    // Calculate new position to keep the mouse point stationary
    const newPos = {
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale,
    };

    setScale(boundedScale);
    setStagePosition(newPos);
  };

  const handleStageDragEnd = (e) => {
    setStagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
    saveToHistory();
  };

  const handleFlipX = () => {
    setFlipX(flipX * -1);
    saveToHistory();
  };

  const handleFlipY = () => {
    setFlipY(flipY * -1);
    saveToHistory();
  };

  const handleStartCrop = () => {
    if (!image) return;

    setIsCropping(true);
    
    // Create crop box in the center of the visible image
    const cropWidth = Math.min(image.width * 0.6, image.width - 20);
    const cropHeight = Math.min(image.height * 0.6, image.height - 20);

    setCropRect({
      x: (image.width - cropWidth) / 2,
      y: (image.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };

  const handleApplyCrop = () => {
    if (!cropRect || !image) return;

    // Create a temporary canvas to crop the image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = cropRect.width;
    canvas.height = cropRect.height;

    // Apply current transformations and draw the cropped portion
    ctx.save();
    
    // Handle rotation and flips
    ctx.translate(cropRect.width / 2, cropRect.height / 2);
    
    if (rotation === 90) {
      ctx.rotate((90 * Math.PI) / 180);
      ctx.scale(flipY, flipX);
      ctx.drawImage(
        image,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        -cropRect.height / 2,
        -cropRect.width / 2,
        cropRect.height,
        cropRect.width
      );
    } else if (rotation === 180) {
      ctx.rotate((180 * Math.PI) / 180);
      ctx.scale(flipX, flipY);
      ctx.drawImage(
        image,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        -cropRect.width / 2,
        -cropRect.height / 2,
        cropRect.width,
        cropRect.height
      );
    } else if (rotation === 270) {
      ctx.rotate((270 * Math.PI) / 180);
      ctx.scale(flipY, flipX);
      ctx.drawImage(
        image,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        -cropRect.height / 2,
        -cropRect.width / 2,
        cropRect.height,
        cropRect.width
      );
    } else {
      // No rotation or 0 degrees
      ctx.scale(flipX, flipY);
      ctx.drawImage(
        image,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        -cropRect.width / 2,
        -cropRect.height / 2,
        cropRect.width,
        cropRect.height
      );
    }
    
    ctx.restore();

    // Load the cropped image
    const croppedImg = new window.Image();
    croppedImg.onload = () => {
      setImage(croppedImg);
      setIsCropping(false);
      setCropRect(null);
      setRotation(0);
      setFlipX(1);
      setFlipY(1);
      
      // Recenter and rescale the cropped image
      const imgAspectRatio = croppedImg.width / croppedImg.height;
      const containerAspectRatio = width / height;
      
      let newScale;
      if (imgAspectRatio > containerAspectRatio) {
        newScale = (width * 0.85) / croppedImg.width;
      } else {
        newScale = (height * 0.85) / croppedImg.height;
      }
      
      const scaledWidth = croppedImg.width * newScale;
      const scaledHeight = croppedImg.height * newScale;
      
      setScale(newScale);
      setStagePosition({
        x: (width - scaledWidth) / 2,
        y: (height - scaledHeight) / 2,
      });
      
      // Clear drawings as they won't align anymore
      setDrawings([]);
      
      saveToHistory();
    };
    croppedImg.src = canvas.toDataURL();
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setCropRect(null);
  };

  const handleMouseDown = (e) => {
    if (tool !== "draw" || !image) return;

    const stage = stageRef.current;
    const pos = stage.getPointerPosition();

    setCurrentLine({
      points: [pos.x, pos.y],
      stroke: "red",
      strokeWidth: 3 / scale, // Adjust stroke width based on scale
    });
  };

  const handleMouseMove = (e) => {
    if (tool !== "draw" || !currentLine) return;

    const stage = stageRef.current;
    const pos = stage.getPointerPosition();

    setCurrentLine({
      ...currentLine,
      points: [...currentLine.points, pos.x, pos.y],
    });
  };

  const handleMouseUp = () => {
    if (tool === "draw" && currentLine) {
      setDrawings([...drawings, currentLine]);
      setCurrentLine(null);
      saveToHistory();
    }
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    saveToHistory();
  };

  const handleSave = async () => {
    if (!stageRef.current || !image) return;

    // Create a new canvas to render the final image with drawings
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size based on current image (after any crops)
    canvas.width = image.width;
    canvas.height = image.height;

    // Apply transformations
    ctx.save();
    ctx.translate(image.width / 2, image.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipX, flipY);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    // Draw all the markup lines
    if (drawings.length > 0) {
      drawings.forEach((line) => {
        ctx.beginPath();
        ctx.strokeStyle = line.stroke;
        ctx.lineWidth = line.strokeWidth * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 0; i < line.points.length; i += 2) {
          const x = (line.points[i] - stagePosition.x) / scale;
          const y = (line.points[i + 1] - stagePosition.y) / scale;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });
    }

    const uri = canvas.toDataURL("image/png");
    onSave(uri);
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 10);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale * 0.8, 0.1);
    setScale(newScale);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <Card sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ p: 1, flexWrap: "wrap", gap: 1 }}>
          <ToggleButtonGroup
            value={tool}
            exclusive
            onChange={(e, value) => value && setTool(value)}
            size="small"
          >
            <ToggleButton value="select">
              <Tooltip title="Select/Pan">
                <FlipToFront />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="draw">
              <Tooltip title="Draw">
                <Edit />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ borderLeft: 1, borderColor: "divider", mx: 1 }} />

          <Tooltip title="Rotate 90°">
            <IconButton size="small" onClick={handleRotate}>
              <Rotate90DegreesCw />
            </IconButton>
          </Tooltip>

          <Tooltip title="Flip Horizontal">
            <IconButton size="small" onClick={handleFlipX}>
              <FlipToFront sx={{ transform: "scaleX(-1)" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Flip Vertical">
            <IconButton size="small" onClick={handleFlipY}>
              <FlipToFront sx={{ transform: "rotate(90deg)" }} />
            </IconButton>
          </Tooltip>

          <Box sx={{ borderLeft: 1, borderColor: "divider", mx: 1 }} />

          {!isCropping ? (
            <Tooltip title="Crop">
              <IconButton size="small" onClick={handleStartCrop}>
                <Crop />
              </IconButton>
            </Tooltip>
          ) : (
            <>
              <Button size="small" variant="contained" onClick={handleApplyCrop}>
                Apply Crop
              </Button>
              <Button size="small" variant="outlined" onClick={handleCancelCrop}>
                Cancel
              </Button>
            </>
          )}

          <Tooltip title="Clear Drawings">
            <IconButton size="small" onClick={handleClearDrawings} disabled={drawings.length === 0}>
              <Clear />
            </IconButton>
          </Tooltip>

          <Box sx={{ borderLeft: 1, borderColor: "divider", mx: 1 }} />

          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomIn />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOut />
            </IconButton>
          </Tooltip>

          <Tooltip title="Undo">
            <IconButton size="small" onClick={undo} disabled={historyStep <= 0}>
              <Undo />
            </IconButton>
          </Tooltip>

          <Tooltip title="Redo">
            <IconButton size="small" onClick={redo} disabled={historyStep >= history.length - 1}>
              <Redo />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleSave}
            startIcon={<Check />}
          >
            Save
          </Button>
          <Button size="small" variant="outlined" onClick={onCancel} startIcon={<Close />}>
            Cancel
          </Button>
        </Stack>
      </Card>

      {/* Canvas */}
      <Box
        sx={{
          flexGrow: 1,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "background.paper",
          position: "relative",
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleWheel}
          draggable={tool === "select" && !isCropping}
          onDragEnd={handleStageDragEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer ref={layerRef}>
            {image && (
              <KonvaImage
                ref={imageRef}
                image={image}
                x={0}
                y={0}
                width={image.width * scale}
                height={image.height * scale}
                rotation={rotation}
                scaleX={flipX}
                scaleY={flipY}
                offsetX={rotation % 180 !== 0 ? image.height / 2 : image.width / 2}
                offsetY={rotation % 180 !== 0 ? image.width / 2 : image.height / 2}
              />
            )}

            {/* Drawings */}
            {drawings.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
              />
            ))}

            {/* Current drawing */}
            {currentLine && (
              <Line
                points={currentLine.points}
                stroke={currentLine.stroke}
                strokeWidth={currentLine.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
              />
            )}

            {/* Crop rectangle */}
            {isCropping && cropRect && image && (
              <>
                <Rect
                  ref={cropperRef}
                  x={cropRect.x * scale}
                  y={cropRect.y * scale}
                  width={cropRect.width * scale}
                  height={cropRect.height * scale}
                  stroke="blue"
                  strokeWidth={2 / scale}
                  dash={[10 / scale, 5 / scale]}
                  draggable
                  onDragEnd={(e) => {
                    setCropRect({
                      ...cropRect,
                      x: e.target.x() / scale,
                      y: e.target.y() / scale,
                    });
                  }}
                  onTransformEnd={(e) => {
                    const node = cropperRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    
                    setCropRect({
                      x: node.x() / scale,
                      y: node.y() / scale,
                      width: (node.width() * scaleX) / scale,
                      height: (node.height() * scaleY) / scale,
                    });
                    
                    // Reset scale
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Prevent crop box from being too small
                    const minSize = 20;
                    if (newBox.width < minSize || newBox.height < minSize) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </>
            )}
          </Layer>
        </Stage>

        {/* Zoom indicator */}
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            bgcolor: "background.paper",
            px: 2,
            py: 1,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="caption">{Math.round(scale * 100)}%</Typography>
        </Box>
      </Box>
    </Box>
  );
};

ImageEditor.propTypes = {
  imageUrl: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
