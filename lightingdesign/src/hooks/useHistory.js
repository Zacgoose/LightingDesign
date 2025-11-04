import { useRef, useState, useCallback } from "react";

export const useHistory = (initialState, timelineTracker, historyKey) => {
  const [state, setState] = useState(initialState);
  const history = useRef([initialState]);
  const historyStep = useRef(0);
  const minHistoryStep = useRef(0); // Minimum history step that can be undone to

  const updateHistory = useCallback((newState) => {
    history.current = history.current.slice(0, historyStep.current + 1);
    history.current = history.current.concat([newState]);
    historyStep.current += 1;
    setState(newState);
    
    // Record action in unified timeline
    timelineTracker.recordAction(historyKey);
  }, [timelineTracker, historyKey]);

  const updateCurrentState = useCallback((newState) => {
    // Update the current state without adding to history
    // This is useful for non-user-action updates like dimension recalculations
    history.current[historyStep.current] = newState;
    setState(newState);
  }, []);

  const resetHistoryBaseline = useCallback((newState) => {
    // Reset history with a new baseline that cannot be undone past
    history.current = [newState];
    historyStep.current = 0;
    minHistoryStep.current = 0;
    setState(newState);
    
    // Reset unified timeline
    timelineTracker.resetTimeline();
  }, [timelineTracker]);

  const undo = useCallback(() => {
    if (historyStep.current <= minHistoryStep.current) return false;
    historyStep.current -= 1;
    const previous = history.current[historyStep.current];
    setState(previous);
    return true;
  }, []);

  const redo = useCallback(() => {
    if (historyStep.current === history.current.length - 1) return false;
    historyStep.current += 1;
    const next = history.current[historyStep.current];
    setState(next);
    return true;
  }, []);

  const canUndo = historyStep.current > minHistoryStep.current;
  const canRedo = historyStep.current < history.current.length - 1;

  return {
    state,
    updateHistory,
    updateCurrentState,
    resetHistoryBaseline,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
