import { Layer, Image as KonvaImage, Line, Transformer } from "react-konva";
import { useRef, useEffect, useState } from "react";

export const ImageMarkupLayer = ({
  backgroundImage,
  backgroundImageNaturalSize,
  imageScale,
  markupMode,
  drawingColor,
  brushSize,
  onImageUpdate,
  layerRef,
}) => {
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
  const [image, setImage] = useState(null);
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load the background image
  useEffect(() => {
    if (!backgroundImage) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setImage(img);
    };

    img.onerror = (err) => {
      console.error("Failed to load image for markup:", err);
      setImage(null);
    };

    if (typeof backgroundImage === "string") {
      img.src = backgroundImage;
    } else if (backgroundImage instanceof window.Image) {
      setImage(backgroundImage);
    }
  }, [backgroundImage]);

  // Attach transformer when in crop or rotate mode
  useEffect(() => {
    if (!transformerRef.current || !imageRef.current) return;

    if (markupMode === "crop" || markupMode === "rotate") {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();

      // Configure transformer based on mode
      if (markupMode === "crop") {
        transformerRef.current.enabledAnchors([
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ]);
        transformerRef.current.rotateEnabled(false);
      } else if (markupMode === "rotate") {
        transformerRef.current.enabledAnchors([]);
        transformerRef.current.rotateEnabled(true);
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [markupMode]);

  // Handle drawing
  const handleMouseDown = (e) => {
    if (markupMode !== "draw" && markupMode !== "erase") return;

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    const newLine = {
      points: [pos.x, pos.y],
      stroke: markupMode === "erase" ? "white" : drawingColor,
      strokeWidth: brushSize,
      globalCompositeOperation: markupMode === "erase" ? "destination-out" : "source-over",
      lineCap: "round",
      lineJoin: "round",
    };
    setLines([...lines, newLine]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    if (markupMode !== "draw" && markupMode !== "erase") return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // Replace the last line with the updated version
    setLines([...lines.slice(0, -1), lastLine]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Calculate image position and dimensions
  const getImageProps = () => {
    if (!backgroundImageNaturalSize) return {};

    const scaledWidth = backgroundImageNaturalSize.width * imageScale;
    const scaledHeight = backgroundImageNaturalSize.height * imageScale;

    return {
      x: -scaledWidth / 2,
      y: -scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight,
    };
  };

  const imageProps = getImageProps();

  // Get flattened image data (for Apply action)
  const getFlattenedImage = () => {
    if (!layerRef?.current) return null;
    
    // Export layer as data URL
    return layerRef.current.toDataURL({
      pixelRatio: 2, // Higher quality export
    });
  };

  // Expose method to parent via ref callback
  useEffect(() => {
    if (onImageUpdate) {
      onImageUpdate({
        getFlattenedImage,
        getCropData: () => {
          if (!imageRef.current) return null;
          const node = imageRef.current;
          return {
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          };
        },
      });
    }
  }, [onImageUpdate]);

  return (
    <Layer
      ref={layerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Background Image */}
      {image && (
        <KonvaImage
          ref={imageRef}
          image={image}
          {...imageProps}
          draggable={false}
        />
      )}

      {/* Drawing lines */}
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          tension={0.5}
          lineCap={line.lineCap}
          lineJoin={line.lineJoin}
          globalCompositeOperation={line.globalCompositeOperation}
        />
      ))}

      {/* Transformer for crop/rotate */}
      {(markupMode === "crop" || markupMode === "rotate") && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to prevent negative dimensions
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </Layer>
  );
};

export default ImageMarkupLayer;
