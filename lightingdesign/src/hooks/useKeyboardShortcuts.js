import { useEffect, useRef } from "react";

/**
 * Custom hook for handling keyboard shortcuts on the designer canvas.
 * 
 * This hook intercepts keyboard events for copy/paste/delete operations, but respects
 * user text selection. When text is selected in the DOM (e.g., from properties panels),
 * the browser's native copy/paste behavior is preserved.
 * 
 * @param {Object} props - Hook configuration
 * @param {Array} props.products - Array of canvas products
 * @param {Array} props.selectedIds - IDs of selected canvas objects
 * @param {Array} props.selectedConnectorIds - IDs of selected connectors
 * @param {Array} props.connectors - Array of canvas connectors
 * @param {Object} props.clipboard - Ref object containing clipboard data
 * @param {Function} props.onCopy - Callback for copy operation
 * @param {Function} props.onPaste - Callback for paste operation
 * @param {Function} props.onDelete - Callback for delete operation
 * @param {Function} props.onSelectAll - Callback for select all operation
 * @param {Function} props.onEscape - Callback for escape key
 * @param {Function} props.onUndo - Callback for undo operation
 * @param {Function} props.onRedo - Callback for redo operation
 * @param {boolean} props.isEditingDisabled - Whether editing is currently disabled
 */
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
      // Don't intercept keyboard events in input fields or textareas
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      
      // Don't intercept keyboard events in contenteditable elements
      if (e.target.isContentEditable) return;

      // Check if user has text selected in the DOM (e.g., from a properties panel)
      // If they do, let the browser handle copy/paste natively
      const selection = window.getSelection();
      const hasTextSelection = selection && selection.toString().length > 0;

      // Copy - allow even in read-only mode (viewing/copying should be allowed)
      // Only intercept if there's no text selection and canvas objects are selected
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIdsRef.current.length > 0) {
        // If user has text selected, let browser handle it natively (don't preventDefault)
        if (hasTextSelection) return;
        
        e.preventDefault();
        onCopyRef.current();
      }

      // Paste - block in read-only mode
      // Only intercept if there's no text selection (allow pasting into input fields via browser)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "v" &&
        (clipboard.current.products?.length > 0 || clipboard.current.textBoxes?.length > 0)
      ) {
        // If user has an input focused or text selected, let browser handle it
        if (hasTextSelection) return;
        
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
