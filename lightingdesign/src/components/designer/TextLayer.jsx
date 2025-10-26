import { TextBox } from "./TextBox";
import { memo, useCallback } from "react";

const TextLayerComponent = ({
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
  
  // Named render function for text boxes
  const renderTextBox = useCallback((textBox) => {
    // Named event handlers
    const handleSelect = (e) => {
      e.cancelBubble = true;
      onTextSelect(textBox.id);
    };

    const handleDragStart = (e) => {
      if (onTextDragStart) {
        onTextDragStart(e, textBox.id);
      }
    };

    const handleDragEnd = (e) => {
      if (onTextDragEnd) {
        onTextDragEnd(e, textBox.id);
      }
    };

    const handleDoubleClick = (e) => {
      if (onTextDoubleClick) {
        onTextDoubleClick(e, textBox.id);
      }
    };

    const handleContextMenu = (e) => {
      if (onTextContextMenu) {
        onTextContextMenu(e, textBox.id);
      }
    };

    return (
      <TextBox
        key={textBox.id}
        textBox={textBox}
        isSelected={textBox.id === selectedTextId}
        isInGroup={isInGroup}
        onSelect={handleSelect}
        onChange={onTextChange}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        draggable={draggable}
      />
    );
  }, [selectedTextId, isInGroup, onTextSelect, onTextChange, onTextDragStart, onTextDragEnd, onTextDoubleClick, onTextContextMenu, draggable]);
  
  return (
    <>
      {/* Only render text boxes that are NOT in the selection group */}
      {textBoxes
        .filter((textBox) => !selectedTextIds.includes(textBox.id))
        .map(renderTextBox)}
    </>
  );
};

export const TextLayer = memo(TextLayerComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.textBoxes === nextProps.textBoxes &&
    prevProps.selectedTextId === nextProps.selectedTextId &&
    prevProps.selectedIds === nextProps.selectedIds &&
    prevProps.draggable === nextProps.draggable &&
    prevProps.onTextSelect === nextProps.onTextSelect &&
    prevProps.onTextChange === nextProps.onTextChange &&
    prevProps.onTextDragStart === nextProps.onTextDragStart &&
    prevProps.onTextDragEnd === nextProps.onTextDragEnd &&
    prevProps.onTextDoubleClick === nextProps.onTextDoubleClick &&
    prevProps.onTextContextMenu === nextProps.onTextContextMenu
  );
});

TextLayer.displayName = "TextLayer";

export default TextLayer;
