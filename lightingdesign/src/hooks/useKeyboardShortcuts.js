import { useEffect, useRef } from 'react';

export const useKeyboardShortcuts = ({
  products,
  selectedIds,
  selectedConnectorId,
  connectors,
  clipboard,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  onEscape,
  onUndo,
  onRedo,
}) => {
  // Use refs to access latest values without re-registering event listeners
  const selectedIdsRef = useRef(selectedIds);
  const selectedConnectorIdRef = useRef(selectedConnectorId);
  const clipboardRef = useRef(clipboard);
  const onCopyRef = useRef(onCopy);
  const onPasteRef = useRef(onPaste);
  const onDeleteRef = useRef(onDelete);
  const onSelectAllRef = useRef(onSelectAll);
  const onEscapeRef = useRef(onEscape);
  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);

  // Update refs when values change
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
    selectedConnectorIdRef.current = selectedConnectorId;
    clipboardRef.current = clipboard;
    onCopyRef.current = onCopy;
    onPasteRef.current = onPaste;
    onDeleteRef.current = onDelete;
    onSelectAllRef.current = onSelectAll;
    onEscapeRef.current = onEscape;
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIdsRef.current.length > 0) {
        e.preventDefault();
        onCopyRef.current();
      }
      
      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current.products?.length > 0) {
        e.preventDefault();
        onPasteRef.current();
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedIdsRef.current.length > 0 || selectedConnectorIdRef.current)) {
        e.preventDefault();
        onDeleteRef.current();
      }

      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        onSelectAllRef.current();
      }

      // Escape
      if (e.key === 'Escape') {
        onEscapeRef.current();
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndoRef.current();
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        onRedoRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array - only register once
};