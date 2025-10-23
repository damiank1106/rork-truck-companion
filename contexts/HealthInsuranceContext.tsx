import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { HealthInsurance } from '@/types';

const HEALTH_INSURANCE_STORAGE_KEY = '@trucker_app:health_insurance';

export const [HealthInsuranceProvider, useHealthInsurance] = createContextHook(() => {
  const [insurance, setInsurance] = useState<HealthInsurance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadInsurance();
  }, []);

  const loadInsurance = async () => {
    try {
      const stored = await AsyncStorage.getItem(HEALTH_INSURANCE_STORAGE_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
        try {
          if (!stored.startsWith('{') && !stored.startsWith('[')) {
            console.warn('Invalid JSON format in health insurance, clearing storage');
            await AsyncStorage.removeItem(HEALTH_INSURANCE_STORAGE_KEY);
            setInsurance(null);
            return;
          }
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setInsurance(parsed);
          } else {
            console.warn('Invalid health insurance data, resetting to default');
            await AsyncStorage.removeItem(HEALTH_INSURANCE_STORAGE_KEY);
            setInsurance(null);
          }
        } catch (parseError) {
          console.error('JSON parse error in health insurance:', parseError);
          await AsyncStorage.removeItem(HEALTH_INSURANCE_STORAGE_KEY);
          setInsurance(null);
        }
      }
    } catch (error) {
      console.error('Error loading health insurance:', error);
      setInsurance(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveInsurance = useCallback(async (data: Omit<HealthInsurance, 'id' | 'createdAt'>) => {
    try {
      const newInsurance: HealthInsurance = {
        id: insurance?.id || Date.now().toString(),
        ...data,
        createdAt: insurance?.createdAt || new Date().toISOString(),
      };
      setInsurance(newInsurance);
      await AsyncStorage.setItem(HEALTH_INSURANCE_STORAGE_KEY, JSON.stringify(newInsurance));
    } catch (error) {
      console.error('Error saving health insurance:', error);
      throw error;
    }
  }, [insurance]);

  const updateInsurance = useCallback(async (updates: Partial<HealthInsurance>) => {
    try {
      if (!insurance) {
        throw new Error('No insurance to update');
      }
      const updated = { ...insurance, ...updates };
      setInsurance(updated);
      await AsyncStorage.setItem(HEALTH_INSURANCE_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating health insurance:', error);
      throw error;
    }
  }, [insurance]);

  const deleteInsurance = useCallback(async () => {
    try {
      setInsurance(null);
      await AsyncStorage.removeItem(HEALTH_INSURANCE_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting health insurance:', error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    insurance,
    isLoading,
    saveInsurance,
    updateInsurance,
    deleteInsurance,
  }), [insurance, isLoading, saveInsurance, updateInsurance, deleteInsurance]);
});
