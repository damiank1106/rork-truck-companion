import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@/lib/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Trailer } from '@/types';

const TRAILERS_STORAGE_KEY = '@trucker_app:trailers';

export const [TrailerProvider, useTrailers] = createContextHook(() => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTrailers();
  }, []);

  const loadTrailers = async () => {
    try {
      const stored = await AsyncStorage.getItem(TRAILERS_STORAGE_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
        try {
          if (!stored.startsWith('[') && !stored.startsWith('{')) {
            console.warn('Invalid JSON format in trailers, clearing storage');
            await AsyncStorage.removeItem(TRAILERS_STORAGE_KEY);
            setTrailers([]);
            return;
          }
          const parsedTrailers = JSON.parse(stored);
          if (Array.isArray(parsedTrailers)) {
            setTrailers(parsedTrailers);
          } else {
            console.warn('Invalid trailers data, resetting to empty array');
            await AsyncStorage.removeItem(TRAILERS_STORAGE_KEY);
            setTrailers([]);
          }
        } catch (parseError) {
          console.error('JSON parse error in trailers:', parseError);
          await AsyncStorage.removeItem(TRAILERS_STORAGE_KEY);
          setTrailers([]);
        }
      }
    } catch (error) {
      console.error('Error loading trailers:', error);
      setTrailers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addTrailer = useCallback(async (trailer: Omit<Trailer, 'id' | 'createdAt'>) => {
    try {
      const newTrailer: Trailer = {
        ...trailer,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...trailers, newTrailer];
      setTrailers(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(TRAILERS_STORAGE_KEY, jsonString);
      }
      return newTrailer;
    } catch (error) {
      console.error('Error adding trailer:', error);
      throw error;
    }
  }, [trailers]);

  const updateTrailer = useCallback(async (id: string, updates: Partial<Trailer>) => {
    try {
      const updated = trailers.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setTrailers(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(TRAILERS_STORAGE_KEY, jsonString);
      }
    } catch (error) {
      console.error('Error updating trailer:', error);
      throw error;
    }
  }, [trailers]);

  const deleteTrailer = useCallback(async (id: string) => {
    try {
      const updated = trailers.filter((t) => t.id !== id);
      setTrailers(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(TRAILERS_STORAGE_KEY, jsonString);
      }
    } catch (error) {
      console.error('Error deleting trailer:', error);
      throw error;
    }
  }, [trailers]);

  return useMemo(() => ({
    trailers,
    isLoading,
    addTrailer,
    updateTrailer,
    deleteTrailer,
  }), [trailers, isLoading, addTrailer, updateTrailer, deleteTrailer]);
});
