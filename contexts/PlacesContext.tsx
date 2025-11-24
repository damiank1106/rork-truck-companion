import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Place } from '@/types';
import { 
  resolveFileUri, 
  convertToRelativePath, 
  saveToLibrary, 
  deleteFromLibrary 
} from '@/lib/file-storage';

const PLACES_STORAGE_KEY = '@trucker_app:places';

export const [PlacesProvider, usePlaces] = createContextHook(() => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadPlaces = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PLACES_STORAGE_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
        try {
          if (!stored.startsWith('[') && !stored.startsWith('{')) {
            console.warn('Invalid JSON format in places, clearing storage');
            await AsyncStorage.removeItem(PLACES_STORAGE_KEY);
            setPlaces([]);
            return;
          }
          const parsedPlaces = JSON.parse(stored);
          if (Array.isArray(parsedPlaces)) {
            const migratedPlaces = parsedPlaces.map((place: Place) => ({
              ...place,
              overnightParking: place.overnightParking ?? false,
              photos: place.photos ? place.photos.map(resolveFileUri) : []
            }));
            setPlaces(migratedPlaces);
          } else {
            console.warn('Invalid places data, resetting to empty array');
            await AsyncStorage.removeItem(PLACES_STORAGE_KEY);
            setPlaces([]);
          }
        } catch (parseError) {
          console.error('JSON parse error in places:', parseError);
          await AsyncStorage.removeItem(PLACES_STORAGE_KEY);
          setPlaces([]);
        }
      }
    } catch (error) {
      console.error('Error loading places:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const savePlacesToStorage = async (updatedPlaces: Place[]) => {
     try {
       const placesToSave = updatedPlaces.map(p => ({
         ...p,
         photos: p.photos ? p.photos.map(convertToRelativePath) : []
       }));
       
       const jsonString = JSON.stringify(placesToSave);
       const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
       console.log(`Places storage size: ${sizeInMB.toFixed(2)} MB`);
       
       if (sizeInMB > 5) {
         throw new Error('Storage quota exceeded. Please delete some old places to free up space.');
       }
       
       if (jsonString && jsonString.length > 0) {
         await AsyncStorage.setItem(PLACES_STORAGE_KEY, jsonString);
       }
     } catch (error: any) {
        console.error('Error saving places to storage:', error);
        if (error?.message?.includes('quota') || error?.message?.includes('QuotaExceededError') || error?.code === 'E_ASYNC_STORAGE_QUOTA_EXCEEDED') {
           throw new Error('Storage quota exceeded. Please delete some old places to free up space.');
        }
        throw error;
     }
  };

  const addPlace = useCallback(async (place: Omit<Place, 'id' | 'createdAt'>) => {
    try {
      const processedPhotos = await Promise.all(
        (place.photos || []).map(async (uri) => {
          const relative = await saveToLibrary(uri);
          return resolveFileUri(relative);
        })
      );

      const newPlace: Place = {
        ...place,
        photos: processedPhotos,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...places, newPlace];
      setPlaces(updated);
      await savePlacesToStorage(updated);
      return newPlace;
    } catch (error) {
      console.error('Error adding place:', error);
      throw error;
    }
  }, [places]);

  const updatePlace = useCallback(async (id: string, updates: Partial<Place>) => {
    try {
      let processedUpdates = { ...updates };
      
      if (updates.photos) {
        const processedPhotos = await Promise.all(
          updates.photos.map(async (uri) => {
            const relative = await saveToLibrary(uri);
            return resolveFileUri(relative);
          })
        );
        processedUpdates.photos = processedPhotos;
      }

      const updated = places.map((p) => (p.id === id ? { ...p, ...processedUpdates } : p));
      setPlaces(updated);
      await savePlacesToStorage(updated);
    } catch (error) {
      console.error('Error updating place:', error);
      throw error;
    }
  }, [places]);

  const deletePlace = useCallback(async (id: string) => {
    try {
      const placeToDelete = places.find(p => p.id === id);
      if (placeToDelete && placeToDelete.photos) {
        for (const photoUri of placeToDelete.photos) {
          await deleteFromLibrary(photoUri);
        }
      }

      const updated = places.filter((p) => p.id !== id);
      setPlaces(updated);
      await savePlacesToStorage(updated);
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }, [places]);

  return useMemo(() => ({
    places,
    isLoading,
    addPlace,
    updatePlace,
    deletePlace,
  }), [places, isLoading, addPlace, updatePlace, deletePlace]);
});
