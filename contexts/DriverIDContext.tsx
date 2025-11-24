import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";

import { DriverID } from "@/types";
import { 
  resolveFileUri, 
  convertToRelativePath, 
  saveToLibrary, 
  deleteFromLibrary 
} from '@/lib/file-storage';

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
        const parsed: DriverID = JSON.parse(stored);
        const resolved = {
           ...parsed,
           frontCardUri: parsed.frontCardUri ? resolveFileUri(parsed.frontCardUri) : undefined,
           backCardUri: parsed.backCardUri ? resolveFileUri(parsed.backCardUri) : undefined,
        };
        setDriverID(resolved);
      }
    } catch (error) {
      console.error("Error loading driver ID:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDriverIDToStorage = async (data: DriverID) => {
     try {
       const toSave = {
         ...data,
         frontCardUri: data.frontCardUri ? convertToRelativePath(data.frontCardUri) : undefined,
         backCardUri: data.backCardUri ? convertToRelativePath(data.backCardUri) : undefined,
       };
       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
     } catch (error) {
       console.error("Error saving driver ID:", error);
       throw error;
     }
  };

  const saveDriverID = useCallback(async (data: Omit<DriverID, "id" | "createdAt">) => {
    try {
      let frontCardUri = data.frontCardUri;
      if (frontCardUri) {
         const relative = await saveToLibrary(frontCardUri);
         frontCardUri = resolveFileUri(relative);
      }
      
      let backCardUri = data.backCardUri;
      if (backCardUri) {
         const relative = await saveToLibrary(backCardUri);
         backCardUri = resolveFileUri(relative);
      }

      const newDriverID: DriverID = {
        id: driverID?.id || Date.now().toString(),
        ...data,
        frontCardUri,
        backCardUri,
        createdAt: driverID?.createdAt || new Date().toISOString(),
      };

      setDriverID(newDriverID);
      await saveDriverIDToStorage(newDriverID);
    } catch (error) {
      console.error("Error saving driver ID:", error);
      throw error;
    }
  }, [driverID]);

  const deleteDriverID = useCallback(async () => {
    try {
      if (driverID) {
         if (driverID.frontCardUri) await deleteFromLibrary(driverID.frontCardUri);
         if (driverID.backCardUri) await deleteFromLibrary(driverID.backCardUri);
      }
      await AsyncStorage.removeItem(STORAGE_KEY);
      setDriverID(null);
    } catch (error) {
      console.error("Error deleting driver ID:", error);
      throw error;
    }
  }, [driverID]);

  return useMemo(() => ({
    driverID,
    isLoading,
    saveDriverID,
    deleteDriverID,
  }), [driverID, isLoading, saveDriverID, deleteDriverID]);
});
