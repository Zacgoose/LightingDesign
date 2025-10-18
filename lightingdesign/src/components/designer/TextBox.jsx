import { Text, Transformer } from "react-konva";
import { useEffect, useRef, memo } from "react";

export const TextBox = memo(
  ({
    textBox,
    isSelected,
    isInGroup = false,
    onSelect,
    onChange,
    onDragStart,
    onDragEnd,
    draggable = true,
    onDoubleClick,
    onContextMenu,
  }) => {
    const textRef = useRef();
    const trRef = useRef();

    useEffect(() => {
      // Only attach transformer if selected and NOT in a group selection
      if (isSelected && !isInGroup && trRef.current && textRef.current) {
        // Attach transformer to text node
        trRef.current.nodes([textRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }, [isSelected, isInGroup]);

    // Parse font style
    const isBold = textBox.fontStyle?.includes("bold") || false;
    const isItalic = textBox.fontStyle?.includes("italic") || false;
    const fontStyle = isItalic ? "italic" : "normal";
    const fontWeight = isBold ? "bold" : "normal";

    // Calculate rendered font size based on scaleFactor
    // The fontSize stored is the "base" size at scaleFactor=100
    // For a larger floorplan (smaller scaleFactor), we want text to scale proportionally
    const baseFontSize = textBox.fontSize || 24;
    const scaleFactor = textBox.scaleFactor || 100;
    // Render font size as: baseFontSize * (scaleFactor / 100)
    // This way, if scaleFactor is 50 (large floorplan), a baseFontSize of 120 renders as 60 pixels
    // And if scaleFactor is 200 (small floorplan), a baseFontSize of 24 renders as 48 pixels
    const renderedFontSize = baseFontSize * (scaleFactor / 100);

    return (
      <>
        <Text
          ref={textRef}
          x={textBox.x}
          y={textBox.y}
          text={textBox.text}
          fontSize={renderedFontSize}
          fontFamily={textBox.fontFamily || "Arial"}
          fontStyle={fontStyle}
          fontVariant={fontWeight}
          textDecoration={textBox.textDecoration || ""}
          fill={textBox.color || "#000000"}
          rotation={textBox.rotation || 0}
          scaleX={textBox.scaleX || 1}
          scaleY={textBox.scaleY || 1}
          width={textBox.width}
          draggable={draggable}
          onClick={onSelect}
          onTap={onSelect}
          onDblClick={onDoubleClick}
          onDblTap={onDoubleClick}
          onDragStart={onDragStart}
          onDragEnd={(e) => {
            onChange({
              ...textBox,
              x: e.target.x(),
              y: e.target.y(),
            });
            if (onDragEnd) onDragEnd(e);
          }}
          onTransformEnd={(e) => {
            const node = textRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // Calculate new base font size based on scale
            // We're scaling the rendered size, so we need to adjust the base size
            const averageScale = (scaleX + scaleY) / 2;
            const currentBaseFontSize = textBox.fontSize || 24;
            const newBaseFontSize = Math.max(8, Math.round(currentBaseFontSize * averageScale));

            // Reset scale and adjust width and base font size
            node.scaleX(1);
            node.scaleY(1);

            onChange({
              ...textBox,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              fontSize: newBaseFontSize, // Update base fontSize
              rotation: node.rotation(),
              scaleX: 1,
              scaleY: 1,
            });
          }}
          onContextMenu={onContextMenu}
        />
        {isSelected && !isInGroup && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
            ]}
          />
        )}
      </>
    );
  }
);

export default TextBox;
