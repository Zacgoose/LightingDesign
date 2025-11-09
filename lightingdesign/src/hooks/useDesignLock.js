import { useState, useEffect, useCallback, useRef } from "react";
import { ApiGetCall, ApiPostCall } from "/src/api/ApiCall";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook to manage design lock state and operations
 * @param {string} jobId - The job ID for the design
 * @returns {Object} Lock state and operations
 */
export const useDesignLock = (jobId) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [lockInfo, setLockInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const refreshIntervalRef = useRef(null);

  // Check lock status
  const lockStatusQuery = ApiGetCall({
    url: "/api/ExecCheckDesignLock",
    data: { jobId },
    queryKey: `DesignLock-${jobId}`,
    waiting: !!jobId,
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Lock design mutation
  const lockDesignMutation = ApiPostCall({});

  // Unlock design mutation
  const unlockDesignMutation = ApiPostCall({});

  // Update lock state when lock status changes
  useEffect(() => {
    if (lockStatusQuery.isSuccess && lockStatusQuery.data) {
      setIsLocked(lockStatusQuery.data.IsLocked || false);
      setIsOwner(lockStatusQuery.data.IsOwner || false);
      setLockInfo(lockStatusQuery.data);
    }
  }, [lockStatusQuery.isSuccess, lockStatusQuery.data]);

  // Lock the design
  const lockDesign = useCallback(async () => {
    if (!jobId) return;

    try {
      const result = await lockDesignMutation.mutateAsync({
        url: "/api/ExecLockDesign",
        data: { jobId },
      });

      if (result?.IsLocked && result?.IsOwner) {
        setIsLocked(true);
        setIsOwner(true);
        setLockInfo(result);
        queryClient.invalidateQueries({ queryKey: [`DesignLock-${jobId}`] });
        
        // Start auto-refresh interval (every 5 minutes)
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        refreshIntervalRef.current = setInterval(() => {
          refreshLock();
        }, 5 * 60 * 1000); // 5 minutes

        return { success: true, data: result };
      } else {
        return { success: false, error: "Failed to acquire lock", data: result };
      }
    } catch (error) {
      console.error("Error locking design:", error);
      return { success: false, error: error.message || "Failed to lock design" };
    }
  }, [jobId, lockDesignMutation, queryClient]);

  // Unlock the design
  const unlockDesign = useCallback(
    async (refreshData = true) => {
      if (!jobId) return;

      try {
        // Clear refresh interval
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }

        const result = await unlockDesignMutation.mutateAsync({
          url: "/api/ExecUnlockDesign",
          data: { jobId },
        });

        setIsLocked(false);
        setIsOwner(false);
        setLockInfo(null);
        queryClient.invalidateQueries({ queryKey: [`DesignLock-${jobId}`] });

        // Refresh design data to ensure we have the latest version
        if (refreshData) {
          queryClient.invalidateQueries({ queryKey: [`Design-${jobId}`] });
        }

        return { success: true, data: result };
      } catch (error) {
        console.error("Error unlocking design:", error);
        return { success: false, error: error.message || "Failed to unlock design" };
      }
    },
    [jobId, unlockDesignMutation, queryClient],
  );

  // Refresh lock to extend timeout
  const refreshLock = useCallback(async () => {
    if (!jobId || !isOwner) return;

    setIsRefreshing(true);
    try {
      const result = await lockDesignMutation.mutateAsync({
        url: "/api/ExecLockDesign",
        data: { jobId },
      });

      if (result?.IsLocked && result?.IsOwner) {
        setLockInfo(result);
        queryClient.invalidateQueries({ queryKey: [`DesignLock-${jobId}`] });
        return { success: true, data: result };
      }
    } catch (error) {
      console.error("Error refreshing lock:", error);
      return { success: false, error: error.message || "Failed to refresh lock" };
    } finally {
      setIsRefreshing(false);
    }
  }, [jobId, isOwner, lockDesignMutation, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    isLocked,
    isOwner,
    lockInfo,
    isRefreshing,
    isLoading: lockStatusQuery.isLoading,
    lockDesign,
    unlockDesign,
    refreshLock,
  };
};
