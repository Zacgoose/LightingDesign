import { useEffect, useRef } from "react";

export const useKeyboardShortcuts = ({
  products,
  selectedIds,
  selectedConnectorIds,
  connectors,
  clipboard,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  onEscape,
  onUndo,
  onRedo,
  isEditingDisabled = false,
}) => {
  // Use refs to access latest values without re-registering event listeners
  const selectedIdsRef = useRef(selectedIds);
  const selectedConnectorIdsRef = useRef(selectedConnectorIds);
  const onCopyRef = useRef(onCopy);
  const onPasteRef = useRef(onPaste);
  const onDeleteRef = useRef(onDelete);
  const onSelectAllRef = useRef(onSelectAll);
  const onEscapeRef = useRef(onEscape);
  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);
  const isEditingDisabledRef = useRef(isEditingDisabled);

  // Update refs when values change
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
    selectedConnectorIdsRef.current = selectedConnectorIds;
    onCopyRef.current = onCopy;
    onPasteRef.current = onPaste;
    onDeleteRef.current = onDelete;
    onSelectAllRef.current = onSelectAll;
    onEscapeRef.current = onEscape;
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
    isEditingDisabledRef.current = isEditingDisabled;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      // Copy - allow even in read-only mode (viewing/copying should be allowed)
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIdsRef.current.length > 0) {
        e.preventDefault();
        onCopyRef.current();
      }

      // Paste - block in read-only mode
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "v" &&
        (clipboard.current.products?.length > 0 || clipboard.current.textBoxes?.length > 0)
      ) {
        e.preventDefault();
        if (!isEditingDisabledRef.current) {
          onPasteRef.current();
        }
      }

      // Delete - block in read-only mode
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        (selectedIdsRef.current.length > 0 || selectedConnectorIdsRef.current.length > 0)
      ) {
        e.preventDefault();
        if (!isEditingDisabledRef.current) {
          onDeleteRef.current();
        }
      }

      // Select all - block in read-only mode
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (!isEditingDisabledRef.current) {
          onSelectAllRef.current();
        }
      }

      // Escape
      if (e.key === "Escape") {
        onEscapeRef.current();
      }

      // Undo - block in read-only mode
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (!isEditingDisabledRef.current) {
          onUndoRef.current();
        }
      }

      // Redo (Ctrl+Shift+Z or Ctrl+Y) - block in read-only mode
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !e.shiftKey)
      ) {
        e.preventDefault();
        if (!isEditingDisabledRef.current) {
          onRedoRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Empty dependency array - only register once
};
