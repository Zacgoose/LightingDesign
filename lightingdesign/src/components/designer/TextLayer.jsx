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
    
    // Extract text IDs that are in the selection group
    const selectedTextIds = selectedIds
      .filter(id => id.startsWith('text-'))
      .map(id => id.substring(5)); // Remove 'text-' prefix
    
    return (
      <>
        {/* Only render text boxes that are NOT in the selection group */}
        {textBoxes
          .filter((textBox) => !selectedTextIds.includes(textBox.id))
          .map((textBox) => (
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

TextLayer.displayName = "TextLayer";

export default TextLayer;
