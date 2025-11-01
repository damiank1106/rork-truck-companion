import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@/lib/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GalleryPhoto } from '@/types';

const GALLERY_STORAGE_KEY = '@trucker_app:gallery';

export const [GalleryProvider, useGallery] = createContextHook(() => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
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
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setPhotos(parsed);
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
  };

  const addPhoto = useCallback(async (photo: Omit<GalleryPhoto, 'id' | 'createdAt'>) => {
    try {
      const newPhoto: GalleryPhoto = {
        ...photo,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newPhoto, ...photos];
      const jsonString = JSON.stringify(updated);
      
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      console.log(`Gallery storage size: ${sizeInMB.toFixed(2)} MB`);
      
      if (sizeInMB > 5) {
        throw new Error('Storage quota exceeded. Please delete some old photos to free up space.');
      }
      
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(GALLERY_STORAGE_KEY, jsonString);
      }
      setPhotos(updated);
      return newPhoto;
    } catch (error: any) {
      console.error('Error adding photo:', error);
      if (error?.message?.includes('quota') || error?.message?.includes('QuotaExceededError') || error?.code === 'E_ASYNC_STORAGE_QUOTA_EXCEEDED') {
        throw new Error('Storage quota exceeded. Please delete some old photos to free up space.');
      }
      throw error;
    }
  }, [photos]);

  const updatePhoto = useCallback(async (id: string, updates: Partial<GalleryPhoto>) => {
    try {
      const updated = photos.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setPhotos(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(GALLERY_STORAGE_KEY, jsonString);
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  }, [photos]);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      const updated = photos.filter((p) => p.id !== id);
      setPhotos(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(GALLERY_STORAGE_KEY, jsonString);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }, [photos]);

  return useMemo(() => ({
    photos,
    isLoading,
    addPhoto,
    updatePhoto,
    deletePhoto,
  }), [photos, isLoading, addPhoto, updatePhoto, deletePhoto]);
});
