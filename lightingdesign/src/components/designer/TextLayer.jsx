import { TextBox } from "./TextBox";
import { memo } from "react";

export const TextLayer = memo(
  ({
    textBoxes,
    selectedTextId,
    selectedIds = [],
    onTextSelect,
    onTextChange,
    onTextDragStart,
    onTextDragEnd,
    onTextDoubleClick,
    onTextContextMenu,
    draggable = true,
  }) => {
    // Check if text is in a multi-selection (mixed with products or multiple texts)
    const isInGroup = selectedIds.length > 1;
    
    return (
      <>
        {textBoxes.map((textBox) => (
          <TextBox
            key={textBox.id}
            textBox={textBox}
            isSelected={textBox.id === selectedTextId}
            isInGroup={isInGroup}
            onSelect={(e) => {
              e.cancelBubble = true;
              onTextSelect(textBox.id);
            }}
            onChange={onTextChange}
            onDragStart={(e) => onTextDragStart && onTextDragStart(e, textBox.id)}
            onDragEnd={(e) => onTextDragEnd && onTextDragEnd(e, textBox.id)}
            onDoubleClick={(e) => onTextDoubleClick && onTextDoubleClick(e, textBox.id)}
            onContextMenu={(e) => onTextContextMenu && onTextContextMenu(e, textBox.id)}
            draggable={draggable}
          />
        ))}
      </>
    );
  }
);

export default TextLayer;
