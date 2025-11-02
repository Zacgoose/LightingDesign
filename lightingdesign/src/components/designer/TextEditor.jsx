import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export const TextEditor = ({ textBox, stageScale, stagePosition, stageBox, onSave, onCancel }) => {
  const textareaRef = useRef(null);

  // Calculate position in screen coordinates
  const areaPosition = {
    x: stageBox.left + textBox.x * stageScale + stagePosition.x,
    y: stageBox.top + textBox.y * stageScale + stagePosition.y,
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSave(textareaRef.current.value);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [onSave, onCancel],
  );

  const handleClickOutside = useCallback(
    (e) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target)) {
        onSave(textareaRef.current.value);
      }
    },
    [onSave],
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }

    // Delay adding the click listener to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const textareaStyle = {
    position: "absolute",
    top: areaPosition.y + "px",
    left: areaPosition.x + "px",
    width: textBox.width * stageScale + "px",
    fontSize: (textBox.fontSize || 24) * stageScale + "px",
    fontFamily: textBox.fontFamily || "Arial",
    border: "2px solid #2196f3",
    padding: "4px",
    margin: "0px",
    overflow: "hidden",
    background: "white",
    outline: "none",
    resize: "none",
    lineHeight: "1.2",
    transformOrigin: "left top",
    color: textBox.color || "#000000",
    zIndex: 9999,
  };

  return createPortal(
    <textarea
      ref={textareaRef}
      defaultValue={textBox.text}
      style={textareaStyle}
      onKeyDown={handleKeyDown}
    />,
    document.body,
  );
};

export default TextEditor;
