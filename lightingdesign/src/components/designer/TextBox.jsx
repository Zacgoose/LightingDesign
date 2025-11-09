import { Text, Transformer, Group, Rect } from "react-konva";
import React, { useEffect, useRef, memo } from "react";

export const TextBox = memo(
  ({
    textBox,
    isSelected,
    isInGroup = false,
    listening = true,
    onSelect,
    onChange,
    onDragStart,
    onDragEnd,
    draggable = true,
    onDoubleClick,
    onContextMenu,
  }) => {
    const groupRef = useRef();
    const textRef = useRef();
    // Removed separate transformer - using unified transformer from ProductsLayer

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

    // Calculate center offset for rotation
    // Text width is measured dynamically, height is approximately fontSize * 1.2 for single line
    const textWidth = textBox.width || 100;
    const textHeight = renderedFontSize * 1.2;

    // Dynamically measure text width and height using textWidth/textHeight
    useEffect(() => {
      if (textRef.current) {
        const node = textRef.current;

        const measuredWidth = node.textWidth;
        const lineCount = node.textArr?.length || textBox.text.split(/\r?\n/).length;

        // Per-line height (approx renderedFontSize * 1.2)
        const singleLineHeight = renderedFontSize * 1.15;

        // If you want to explicitly base height on lines × per-line height:
        const computedHeight = lineCount * singleLineHeight;

        // Update only if changed to avoid render loops
        const needsUpdate =
          Math.abs((textBox.width || 0) - measuredWidth) > 1 ||
          Math.abs((textBox.height || 0) - computedHeight) > 1;

        if (needsUpdate) {
          onChange({
            ...textBox,
            width: measuredWidth,
            height: computedHeight,
          });
        }
      }
    }, [textBox.text, renderedFontSize, textBox.fontFamily, textBox.fontStyle, textBox.fontWeight]);

    return (
      <>
        <Group
          ref={groupRef}
          x={textBox.x}
          y={textBox.y}
          rotation={textBox.rotation || 0}
          scaleX={textBox.scaleX || 1}
          scaleY={textBox.scaleY || 1}
          draggable={draggable}
          listening={listening}
          hitFunc={(ctx, shape) => {
            // Custom hit detection for text boxes:
            // Always make text area clickable (filled)
            
            ctx.beginPath();
            
            // Always include text area with small padding
            const textPadding = 5;
            ctx.rect(
              -textWidth / 2 - textPadding,
              -textHeight / 2 - textPadding,
              textWidth + textPadding * 2,
              (textBox.height || textHeight) + textPadding * 2
            );
            
            ctx.closePath();
            ctx.fillShape(shape); // Fill the text area
          }}
          onMouseDown={(e) => {
            // Filter out middle mouse clicks (button === 1) to prevent selection during panning
            // Don't stop propagation - let it bubble to Stage for middle mouse panning
            if (e.evt.button === 1) {
              return;
            }
            if (onSelect) {
              onSelect(e);
            }
          }}
          onTap={onSelect}
          onDblClick={(e) => {
            // Only allow left mouse button double-click to edit
            if (e.evt.button !== 0) {
              return;
            }
            if (onDoubleClick) {
              onDoubleClick(e);
            }
          }}
          onDblTap={onDoubleClick}
          onDragStart={(e) => {
            // Prevent dragging on middle mouse button
            if (e.evt.button === 1) {
              e.target.stopDrag();
              e.cancelBubble = true;
              e.evt.preventDefault();
              e.evt.stopPropagation();
              return false;
            }
            if (onDragStart) {
              onDragStart(e);
            }
          }}
          onDragEnd={(e) => {
            onChange({
              ...textBox,
              x: e.target.x(),
              y: e.target.y(),
            });
            if (onDragEnd) onDragEnd(e);
          }}
          onTransform={(e) => {
            // Real-time updates during transformation
            const node = groupRef.current;
            if (!node) return;

            // Note: This won't work without transformer ref, but we keep it for when text is in group
            // The ProductsLayer handles transformations for selected text
          }}
          onTransformEnd={(e) => {
            // This only applies to unselected text boxes (selected ones use ProductsLayer transformer)
            const node = groupRef.current;
            if (!node) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // Simple scaling behavior for unselected text
            const averageScale = (scaleX + scaleY) / 2;
            const currentBaseFontSize = textBox.fontSize || 24;
            const newBaseFontSize = Math.max(8, Math.round(currentBaseFontSize * averageScale));

            node.scaleX(1);
            node.scaleY(1);

            onChange({
              ...textBox,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, textBox.width * scaleX),
              fontSize: newBaseFontSize,
              rotation: node.rotation(),
              scaleX: 1,
              scaleY: 1,
            });
          }}
          onContextMenu={onContextMenu}
        >
          <Text
            ref={textRef}
            x={-textWidth / 2}
            y={-textHeight / 2}
            text={textBox.text}
            fontSize={renderedFontSize}
            fontFamily={textBox.fontFamily || "Arial"}
            fontStyle={fontStyle}
            fontVariant={fontWeight}
            textDecoration={textBox.textDecoration || ""}
            fill={textBox.color || "#000000"}
            width={textBox.max}
            wrap="none"
            draggable={false}
            listening={false}
          />
        </Group>
      </>
    );
  },
);

export default TextBox;
