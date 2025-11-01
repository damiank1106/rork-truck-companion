import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@/lib/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";

import { DriverID } from "@/types";

const STORAGE_KEY = "@trucker_companion_driver_id";

export const [DriverIDContext, useDriverID] = createContextHook(() => {
  const [driverID, setDriverID] = useState<DriverID | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDriverID();
  }, []);

  const loadDriverID = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDriverID(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading driver ID:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDriverID = useCallback(async (data: Omit<DriverID, "id" | "createdAt">) => {
    try {
      const newDriverID: DriverID = {
        id: driverID?.id || Date.now().toString(),
        ...data,
        createdAt: driverID?.createdAt || new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDriverID));
      setDriverID(newDriverID);
    } catch (error) {
      console.error("Error saving driver ID:", error);
      throw error;
    }
  }, [driverID]);

  const deleteDriverID = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setDriverID(null);
    } catch (error) {
      console.error("Error deleting driver ID:", error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    driverID,
    isLoading,
    saveDriverID,
    deleteDriverID,
  }), [driverID, isLoading, saveDriverID, deleteDriverID]);
});
