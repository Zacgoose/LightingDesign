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
  const [image, setImage] = useState(null);
  const [tool, setTool] = useState("select");
  const [scale, setScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(1);
  const [flipY, setFlipY] = useState(1);
  const [cropRect, setCropRect] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);

  // Load image
  useEffect(() => {
    if (!imageUrl) return;

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      setImage(img);

      // Center the image
      const imgAspectRatio = img.width / img.height;
      const containerAspectRatio = width / height;

      let initialScale;
      if (imgAspectRatio > containerAspectRatio) {
        initialScale = (width * 0.9) / img.width;
      } else {
        initialScale = (height * 0.9) / img.height;
      }

      setScale(initialScale);
      setImagePosition({
        x: width / 2 - (img.width * initialScale) / 2,
        y: height / 2 - (img.height * initialScale) / 2,
      });

      // Save initial state
      saveToHistory();
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
      imagePosition: { ...imagePosition },
      scale,
    };

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [rotation, flipX, flipY, drawings, imagePosition, scale, history, historyStep]);

  const undo = () => {
    if (historyStep > 0) {
      const prevState = history[historyStep - 1];
      setRotation(prevState.rotation);
      setFlipX(prevState.flipX);
      setFlipY(prevState.flipY);
      setDrawings(prevState.drawings);
      setImagePosition(prevState.imagePosition);
      setScale(prevState.scale);
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
      setImagePosition(nextState.imagePosition);
      setScale(nextState.scale);
      setHistoryStep(historyStep + 1);
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const boundedScale = Math.max(0.1, Math.min(10, newScale));

    setStagePosition({
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale,
    });
    setScale(boundedScale);
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
    const cropWidth = image.width * 0.6;
    const cropHeight = image.height * 0.6;

    setCropRect({
      x: image.width * 0.2,
      y: image.height * 0.2,
      width: cropWidth,
      height: cropHeight,
    });
  };

  const handleApplyCrop = () => {
    if (!cropRect || !imageRef.current) return;

    // Create a temporary canvas to crop the image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = cropRect.width;
    canvas.height = cropRect.height;

    // Draw the cropped portion
    ctx.drawImage(
      image,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height,
    );

    // Load the cropped image
    const croppedImg = new window.Image();
    croppedImg.onload = () => {
      setImage(croppedImg);
      setIsCropping(false);
      setCropRect(null);
      setRotation(0);
      setFlipX(1);
      setFlipY(1);
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
      strokeWidth: 3,
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
    if (!stageRef.current) return;

    const uri = stageRef.current.toDataURL({
      pixelRatio: 2,
    });

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
          scaleX={scale}
          scaleY={scale}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleWheel}
          draggable={tool === "select"}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {image && (
              <KonvaImage
                ref={imageRef}
                image={image}
                x={imagePosition.x}
                y={imagePosition.y}
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
              />
            )}

            {/* Crop rectangle */}
            {isCropping && cropRect && image && (
              <>
                <Rect
                  ref={cropperRef}
                  x={imagePosition.x + cropRect.x}
                  y={imagePosition.y + cropRect.y}
                  width={cropRect.width}
                  height={cropRect.height}
                  stroke="blue"
                  strokeWidth={2}
                  dash={[10, 5]}
                  draggable
                  onDragEnd={(e) => {
                    setCropRect({
                      ...cropRect,
                      x: e.target.x() - imagePosition.x,
                      y: e.target.y() - imagePosition.y,
                    });
                  }}
                  onTransformEnd={(e) => {
                    const node = cropperRef.current;
                    setCropRect({
                      x: node.x() - imagePosition.x,
                      y: node.y() - imagePosition.y,
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 20 || newBox.height < 20) {
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
