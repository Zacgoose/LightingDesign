import { Text, Transformer } from "react-konva";
import { useEffect, useRef, memo } from "react";

export const TextBox = memo(
  ({
    textBox,
    isSelected,
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
      if (isSelected && trRef.current && textRef.current) {
        // Attach transformer to text node
        trRef.current.nodes([textRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }, [isSelected]);

    // Parse font style
    const isBold = textBox.fontStyle?.includes("bold") || false;
    const isItalic = textBox.fontStyle?.includes("italic") || false;
    const fontStyle = isItalic ? "italic" : "normal";
    const fontWeight = isBold ? "bold" : "normal";

    return (
      <>
        <Text
          ref={textRef}
          x={textBox.x}
          y={textBox.y}
          text={textBox.text}
          fontSize={textBox.fontSize || 24}
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

            // Reset scale and adjust width instead
            node.scaleX(1);
            node.scaleY(1);

            onChange({
              ...textBox,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              rotation: node.rotation(),
              scaleX: 1,
              scaleY: 1,
            });
          }}
          onContextMenu={onContextMenu}
        />
        {isSelected && (
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
