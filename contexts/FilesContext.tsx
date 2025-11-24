import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@/lib/create-context-hook";
import { FileDocument } from "@/types";
import { 
  resolveFileUri, 
  convertToRelativePath, 
  saveToLibrary, 
  deleteFromLibrary 
} from "@/lib/file-storage";

const FILES_STORAGE_KEY = "files";

/*
 * DATA PERSISTENCE:
 * All file data (including text notes and image URIs) is stored locally using AsyncStorage.
 * Images are saved to the persistent document directory and their relative paths are stored in AsyncStorage.
 * This ensures data survives app updates (including Ad Hoc builds with same bundle ID).
 */

export const [FilesContext, useFiles] = createContextHook(() => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFiles = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FILES_STORAGE_KEY);
      if (stored) {
        const parsedFiles: FileDocument[] = JSON.parse(stored);
        
        // Resolve all image paths to full URIs for use in the app
        const resolvedFiles = parsedFiles.map(file => ({
          ...file,
          scanImages: file.scanImages ? file.scanImages.map(resolveFileUri) : []
        }));
        
        setFiles(resolvedFiles);
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
      // Convert all image paths to relative paths before saving to storage
      const filesToSave = updatedFiles.map(file => ({
        ...file,
        scanImages: file.scanImages ? file.scanImages.map(convertToRelativePath) : []
      }));
      
      await AsyncStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(filesToSave));
      setFiles(updatedFiles);
    } catch (error) {
      console.error("Error saving files:", error);
    }
  }, []);

  const addFile = useCallback(async (file: Omit<FileDocument, "id" | "createdAt">) => {
    // Process images: save to library and get full resolved path for state
    const processedImages = await Promise.all(
      (file.scanImages || []).map(async (uri) => {
        const relativePath = await saveToLibrary(uri);
        return resolveFileUri(relativePath);
      })
    );

    const newFile: FileDocument = {
      ...file,
      scanImages: processedImages,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    const updatedFiles = [...files, newFile];
    await saveFiles(updatedFiles);
    return newFile;
  }, [files, saveFiles]);

  const updateFile = useCallback(async (id: string, updates: Partial<FileDocument>) => {
    let processedUpdates = { ...updates };

    // If images are being updated, we need to ensure new ones are saved to library
    if (updates.scanImages) {
      const processedImages = await Promise.all(
        updates.scanImages.map(async (uri) => {
          // If it's already a resolved path from our library, saveToLibrary handles it (returns filename)
          // If it's a new temp URI, saveToLibrary saves it and returns filename
          const relativePath = await saveToLibrary(uri);
          return resolveFileUri(relativePath);
        })
      );
      processedUpdates.scanImages = processedImages;
    }

    const updatedFiles = files.map((file) =>
      file.id === id ? { ...file, ...processedUpdates } : file
    );
    await saveFiles(updatedFiles);
  }, [files, saveFiles]);

  const deleteFile = useCallback(async (id: string) => {
    const fileToDelete = files.find((file) => file.id === id);
    if (fileToDelete && fileToDelete.scanImages) {
      for (const imageUri of fileToDelete.scanImages) {
        try {
          await deleteFromLibrary(imageUri);
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
