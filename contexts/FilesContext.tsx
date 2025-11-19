import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@/lib/create-context-hook";
import { FileDocument } from "@/types";

const FILES_STORAGE_KEY = "files";

/*
 * DATA PERSISTENCE:
 * All file data (including text notes and image URIs) is stored locally using AsyncStorage.
 * AsyncStorage persists data across app restarts and survives Ad Hoc builds with the same bundle identifier.
 * No cloud services or external servers are used for data storage.
 */

export const [FilesContext, useFiles] = createContextHook(() => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFiles = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FILES_STORAGE_KEY);
      if (stored) {
        setFiles(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const saveFiles = useCallback(async (updatedFiles: FileDocument[]) => {
    try {
      await AsyncStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(updatedFiles));
      setFiles(updatedFiles);
    } catch (error) {
      console.error("Error saving files:", error);
    }
  }, []);

  const addFile = useCallback(async (file: Omit<FileDocument, "id" | "createdAt">) => {
    const newFile: FileDocument = {
      ...file,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedFiles = [...files, newFile];
    await saveFiles(updatedFiles);
    return newFile;
  }, [files, saveFiles]);

  const updateFile = useCallback(async (id: string, updates: Partial<FileDocument>) => {
    const updatedFiles = files.map((file) =>
      file.id === id ? { ...file, ...updates } : file
    );
    await saveFiles(updatedFiles);
  }, [files, saveFiles]);

  const deleteFile = useCallback(async (id: string) => {
    const fileToDelete = files.find((file) => file.id === id);
    if (fileToDelete && fileToDelete.scanImages) {
      for (const imageUri of fileToDelete.scanImages) {
        try {
          await AsyncStorage.removeItem(imageUri);
        } catch (error) {
          console.error("Error deleting image from storage:", error);
        }
      }
    }
    const updatedFiles = files.filter((file) => file.id !== id);
    await saveFiles(updatedFiles);
  }, [files, saveFiles]);

  return {
    files,
    isLoading,
    addFile,
    updateFile,
    deleteFile,
    refreshFiles: loadFiles,
  };
});
