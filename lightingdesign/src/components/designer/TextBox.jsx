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
    // Text width and height from textBox properties (measured/calculated values)
    const textWidth = textBox.width || 100;
    const textHeight = textBox.height || (renderedFontSize * 1.2);

    // Note: Removed auto-sizing useEffect to prevent double history entries
    // Width and height are now explicitly calculated when text/fontSize changes
    // in the handlers (handleTextDialogConfirm, handleTextFontSize, etc.)

    // Rectangle padding
    const rectPadding = 10;

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
          onMouseDown={(e) => {
            // Filter out middle mouse clicks (button === 1) to prevent selection during panning
            if (e.evt.button === 1) {
              e.cancelBubble = true;
              e.evt.stopPropagation();
              e.evt.preventDefault();
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
          {/* Render rectangle border if enabled */}
          {textBox.showBorder && (
            <Rect
              x={-textWidth / 2 - rectPadding}
              y={-textHeight / 2 - rectPadding}
              width={textWidth + rectPadding * 2}
              height={textHeight + rectPadding * 2}
              stroke={textBox.borderColor || "#000000"}
              strokeWidth={8}
              fill="transparent"
              listening={false}
            />
          )}
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
            listening={true}
          />
        </Group>
      </>
    );
  },
);

export default TextBox;
