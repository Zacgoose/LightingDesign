import { useEffect } from 'react';

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
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.length > 0) {
        e.preventDefault();
        onCopy();
      }
      
      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.current.products?.length > 0) {
        e.preventDefault();
        onPaste();
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedIds.length > 0 || selectedConnectorId)) {
        e.preventDefault();
        onDelete();
      }

      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        onSelectAll();
      }

      // Escape
      if (e.key === 'Escape') {
        onEscape();
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, selectedIds, selectedConnectorId, connectors, clipboard, onCopy, onPaste, onDelete, onSelectAll, onEscape, onUndo, onRedo]);
};