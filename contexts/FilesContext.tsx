import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@/lib/create-context-hook";
import { FileDocument } from "@/types";

const FILES_STORAGE_KEY = "files";

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
