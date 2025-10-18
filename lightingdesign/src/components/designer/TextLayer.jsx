import { Layer } from "react-konva";
import { TextBox } from "./TextBox";
import { memo } from "react";

export const TextLayer = memo(
  ({
    textBoxes,
    selectedTextId,
    onTextSelect,
    onTextChange,
    onTextDragStart,
    onTextDragEnd,
    onTextDoubleClick,
    draggable = true,
  }) => {
    return (
      <Layer>
        {textBoxes.map((textBox) => (
          <TextBox
            key={textBox.id}
            textBox={textBox}
            isSelected={textBox.id === selectedTextId}
            onSelect={(e) => {
              e.cancelBubble = true;
              onTextSelect(textBox.id);
            }}
            onChange={onTextChange}
            onDragStart={(e) => onTextDragStart && onTextDragStart(e, textBox.id)}
            onDragEnd={(e) => onTextDragEnd && onTextDragEnd(e, textBox.id)}
            onDoubleClick={(e) => onTextDoubleClick && onTextDoubleClick(e, textBox.id)}
            draggable={draggable}
          />
        ))}
      </Layer>
    );
  }
);

export default TextLayer;
