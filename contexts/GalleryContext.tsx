import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GalleryPhoto } from '@/types';
import { 
  resolveFileUri, 
  convertToRelativePath, 
  saveToLibrary, 
  deleteFromLibrary 
} from '@/lib/file-storage';

const GALLERY_STORAGE_KEY = '@trucker_app:gallery';

export const [GalleryProvider, useGallery] = createContextHook(() => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadPhotos = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
        try {
          if (!stored.startsWith('[') && !stored.startsWith('{')) {
            console.warn('Invalid JSON format in gallery, clearing storage');
            await AsyncStorage.removeItem(GALLERY_STORAGE_KEY);
            setPhotos([]);
            return;
          }
          const parsed: GalleryPhoto[] = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Resolve URIs
            const resolvedPhotos = parsed.map(p => ({
              ...p,
              uri: resolveFileUri(p.uri)
            }));
            setPhotos(resolvedPhotos);
          } else {
            console.warn('Invalid gallery data, resetting to empty array');
            await AsyncStorage.removeItem(GALLERY_STORAGE_KEY);
            setPhotos([]);
          }
        } catch (parseError) {
          console.error('JSON parse error in gallery:', parseError);
          await AsyncStorage.removeItem(GALLERY_STORAGE_KEY);
          setPhotos([]);
        }
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const savePhotos = useCallback(async (updatedPhotos: GalleryPhoto[]) => {
      // Convert to relative paths
      const photosToSave = updatedPhotos.map(p => ({
        ...p,
        uri: convertToRelativePath(p.uri)
      }));

      const jsonString = JSON.stringify(photosToSave);
      
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      console.log(`Gallery storage size: ${sizeInMB.toFixed(2)} MB`);
      
      if (sizeInMB > 5) {
        throw new Error('Storage quota exceeded. Please delete some old photos to free up space.');
      }
      
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(GALLERY_STORAGE_KEY, jsonString);
      }
      setPhotos(updatedPhotos);
  }, []);

  const addPhoto = useCallback(async (photo: Omit<GalleryPhoto, 'id' | 'createdAt'>) => {
    try {
      // Save image to library
      const relativePath = await saveToLibrary(photo.uri);
      const resolvedUri = resolveFileUri(relativePath);

      const newPhoto: GalleryPhoto = {
        ...photo,
        uri: resolvedUri,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      const updated = [newPhoto, ...photos];
      await savePhotos(updated);
      return newPhoto;
    } catch (error: any) {
      console.error('Error adding photo:', error);
      if (error?.message?.includes('quota') || error?.message?.includes('QuotaExceededError') || error?.code === 'E_ASYNC_STORAGE_QUOTA_EXCEEDED') {
        throw new Error('Storage quota exceeded. Please delete some old photos to free up space.');
      }
      throw error;
    }
  }, [photos, savePhotos]);

  const updatePhoto = useCallback(async (id: string, updates: Partial<GalleryPhoto>) => {
    try {
      let processedUpdates = { ...updates };
      
      if (updates.uri) {
        const relativePath = await saveToLibrary(updates.uri);
        processedUpdates.uri = resolveFileUri(relativePath);
      }

      const updated = photos.map((p) => (p.id === id ? { ...p, ...processedUpdates } : p));
      await savePhotos(updated);
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  }, [photos, savePhotos]);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      const photoToDelete = photos.find(p => p.id === id);
      if (photoToDelete) {
        await deleteFromLibrary(photoToDelete.uri);
      }

      const updated = photos.filter((p) => p.id !== id);
      await savePhotos(updated);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }, [photos, savePhotos]);

  return useMemo(() => ({
    photos,
    isLoading,
    addPhoto,
    updatePhoto,
    deletePhoto,
  }), [photos, isLoading, addPhoto, updatePhoto, deletePhoto]);
});
