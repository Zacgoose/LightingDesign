import { useQuery } from "@tanstack/react-query";
import { ApiGetCall } from "/src/api/ApiCall";

/**
 * Get store name from store ID
 * This utility helps convert storeId values to friendly store names in tables
 * 
 * @param {string} storeId - The store ID to lookup
 * @param {Array} stores - Optional array of stores to lookup from (if not provided, will use API call)
 * @returns {string} - The store name or the original storeId if not found
 */
export const getStoreName = (storeId, stores = null) => {
  if (!storeId) {
    return "";
  }

  // If stores array provided, use it for lookup
  if (stores && Array.isArray(stores)) {
    const store = stores.find((s) => s.storeId === storeId);
    return store ? store.storeName : storeId;
  }

  // Otherwise return the storeId (component using this should fetch stores separately)
  return storeId;
};

/**
 * Hook to get store name from store ID with API lookup
 * 
 * @param {string} storeId - The store ID to lookup
 * @returns {object} - { storeName, isLoading, error }
 */
export const useStoreName = (storeId) => {
  const storeList = ApiGetCall({
    url: "/api/ListStores",
    queryKey: "ListStores",
  });

  const storeName = storeId && storeList.data 
    ? getStoreName(storeId, storeList.data)
    : storeId;

  return {
    storeName,
    isLoading: storeList.isLoading,
    error: storeList.error,
  };
};

/**
 * Get group name from group ID
 * This utility helps convert groupId values to friendly group names in tables
 * 
 * @param {string} groupId - The group ID to lookup
 * @param {Array} groups - Optional array of groups to lookup from
 * @returns {string} - The group name or the original groupId if not found
 */
export const getGroupName = (groupId, groups = null) => {
  if (!groupId) {
    return "";
  }

  // If groups array provided, use it for lookup
  if (groups && Array.isArray(groups)) {
    const group = groups.find((g) => g.groupId === groupId);
    return group ? group.groupName : groupId;
  }

  // Otherwise return the groupId
  return groupId;
};
