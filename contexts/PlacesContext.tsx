import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Place } from '@/types';

const PLACES_STORAGE_KEY = '@trucker_app:places';

export const [PlacesProvider, usePlaces] = createContextHook(() => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
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
  };

  const addPlace = useCallback(async (place: Omit<Place, 'id' | 'createdAt'>) => {
    try {
      const newPlace: Place = {
        ...place,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...places, newPlace];
      const jsonString = JSON.stringify(updated);
      
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      console.log(`Places storage size: ${sizeInMB.toFixed(2)} MB`);
      
      if (sizeInMB > 5) {
        throw new Error('Storage quota exceeded. Please delete some old places to free up space.');
      }
      
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(PLACES_STORAGE_KEY, jsonString);
      }
      setPlaces(updated);
      return newPlace;
    } catch (error: any) {
      console.error('Error adding place:', error);
      if (error?.message?.includes('quota') || error?.message?.includes('QuotaExceededError') || error?.code === 'E_ASYNC_STORAGE_QUOTA_EXCEEDED') {
        throw new Error('Storage quota exceeded. Please delete some old places to free up space.');
      }
      throw error;
    }
  }, [places]);

  const updatePlace = useCallback(async (id: string, updates: Partial<Place>) => {
    try {
      const updated = places.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setPlaces(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(PLACES_STORAGE_KEY, jsonString);
      }
    } catch (error) {
      console.error('Error updating place:', error);
      throw error;
    }
  }, [places]);

  const deletePlace = useCallback(async (id: string) => {
    try {
      const updated = places.filter((p) => p.id !== id);
      setPlaces(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(PLACES_STORAGE_KEY, jsonString);
      }
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
