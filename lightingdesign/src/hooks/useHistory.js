import { useRef, useState } from "react";

export const useHistory = (initialState = []) => {
  const [state, setState] = useState(initialState);
  const history = useRef([initialState]);
  const historyStep = useRef(0);
  const minHistoryStep = useRef(0); // Minimum history step that can be undone to

  const updateHistory = (newState) => {
    history.current = history.current.slice(0, historyStep.current + 1);
    history.current = history.current.concat([newState]);
    historyStep.current += 1;
    setState(newState);
  };

  const resetHistoryBaseline = (newState) => {
    // Reset history with a new baseline that cannot be undone past
    history.current = [newState];
    historyStep.current = 0;
    minHistoryStep.current = 0;
    setState(newState);
  };

  const undo = () => {
    if (historyStep.current <= minHistoryStep.current) return false;
    historyStep.current -= 1;
    const previous = history.current[historyStep.current];
    setState(previous);
    return true;
  };

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
