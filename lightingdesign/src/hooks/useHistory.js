import { useRef, useState } from "react";

/**
 * Generic history hook for undo/redo functionality
 * 
 * Supports tracking any state structure - can be an array, object, or composite state.
 * When tracking composite state (e.g., { products: [...], textBoxes: [...] }),
 * undo/redo operations will restore the entire composite state atomically.
 * 
 * This hook is used to enable undo/redo for canvas operations including both
 * products and text boxes.
 * 
 * @param {*} initialState - Initial state value (array, object, etc.)
 * @returns {Object} History management interface
 */
export const useHistory = (initialState = []) => {
  const [state, setState] = useState(initialState);
  const history = useRef([initialState]);
  const historyStep = useRef(0);
  const minHistoryStep = useRef(0); // Minimum history step that can be undone to

  /**
   * Add a new state to history, discarding any future states (redo history)
   * @param {*} newState - New state to add to history
   */
  const updateHistory = (newState) => {
    // Discard any redo history when making a new change
    history.current = history.current.slice(0, historyStep.current + 1);
    history.current = history.current.concat([newState]);
    historyStep.current += 1;
    setState(newState);
  };

  /**
   * Reset history with a new baseline state that cannot be undone past
   * Useful when loading data from server or switching contexts
   * @param {*} newState - New baseline state
   */
  const resetHistoryBaseline = (newState) => {
    history.current = [newState];
    historyStep.current = 0;
    minHistoryStep.current = 0;
    setState(newState);
  };

  /**
   * Undo to the previous state
   * @returns {boolean} True if undo was successful, false if at minimum history step
   */
  const undo = () => {
    if (historyStep.current <= minHistoryStep.current) return false;
    historyStep.current -= 1;
    const previous = history.current[historyStep.current];
    setState(previous);
    return true;
  };

  /**
   * Redo to the next state
   * @returns {boolean} True if redo was successful, false if at latest history step
   */
  const redo = () => {
    if (historyStep.current === history.current.length - 1) return false;
    historyStep.current += 1;
    const next = history.current[historyStep.current];
    setState(next);
    return true;
  };

  const canUndo = historyStep.current > minHistoryStep.current;
  const canRedo = historyStep.current < history.current.length - 1;

  return {
    state,
    updateHistory,
    resetHistoryBaseline,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
