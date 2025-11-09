import { useRef, useCallback, useMemo } from "react";

/**
 * Creates a timeline tracker that coordinates multiple useHistory hooks.
 * This ensures undo/redo operates on the most recent overall action
 * rather than the most recent action per state type.
 */
export const useUnifiedHistory = () => {
  // Track the timeline of which history was modified
  const timeline = useRef([]);
  const timelineStep = useRef(-1);

  /**
   * Record an action in the unified timeline
   * @param {string} historyKey - Which history was modified ('products', 'textBoxes', or 'connectors')
   */
  const recordAction = useCallback((historyKey) => {
    // Trim future timeline if we're not at the latest step
    timeline.current = timeline.current.slice(0, timelineStep.current + 1);

    // Add new action to timeline
    timeline.current.push(historyKey);
    timelineStep.current += 1;
  }, []);

  /**
   * Reset the timeline when histories are reset
   */
  const resetTimeline = useCallback(() => {
    timeline.current = [];
    timelineStep.current = -1;
  }, []);

  // Return a stable object that won't change between renders
  return useMemo(
    () => ({
      recordAction,
      resetTimeline,
      timeline,
      timelineStep,
    }),
    [recordAction, resetTimeline],
  );
};
