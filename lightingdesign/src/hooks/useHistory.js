import { useRef, useState } from "react";

export const useHistory = (initialState = []) => {
  const [state, setState] = useState(initialState);
  const history = useRef([initialState]);
  const historyStep = useRef(0);

  const updateHistory = (newState) => {
    history.current = history.current.slice(0, historyStep.current + 1);
    history.current = history.current.concat([newState]);
    historyStep.current += 1;
    setState(newState);
  };

  const undo = () => {
    if (historyStep.current === 0) return false;
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

  const canUndo = historyStep.current > 0;
  const canRedo = historyStep.current < history.current.length - 1;

  return {
    state,
    updateHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
