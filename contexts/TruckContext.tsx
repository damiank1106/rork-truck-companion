import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TruckProfile } from '@/types';

const TRUCK_STORAGE_KEY = '@trucker_app:truck_profile';

const defaultTruckProfile: TruckProfile = {
  id: '1',
  companyName: '',
  make: '',
  model: '',
  year: '',
  truckNumber: '',
  tripNumber: '',
  puNumber: '',
  bolNumber: '',
  loadWeight: '',
  loadNotes: '',
  driverId: '',
  mcn: '',
  dotNumber: '',
  registrationNumber: '',
  mileage: '',
  heightWithTrailer: '',
  heightWithoutTrailer: '',
  width: '',
  length: '',
  trailerType: '',
  trailerLength: '',
  trailerWidth: '',
  trailerHeight: '',
  trailerNumber: '',
  trailerYear: '',
  trailerRegistrationPlate: '',
  trailerInsurance: '',
  trailerInspection: '',
  maxLoadWeight: '',
  steerAxleWeight: '',
  driveAxleWeight: '',
  trailerAxleWeight: '',
  grossVehicleWeight: '',
  steerTirePSI: '',
  driveTirePSI: '',
  trailerTirePSI: '',
  steerTireSize: '',
  driveTireSize: '',
  trailerTireSize: '',
  steeringTreadDepth: '',
  driverTreadDepth: '',
  trailerTreadDepth: '',
};

export const [TruckProvider, useTruck] = createContextHook(() => {
  const [truckProfile, setTruckProfile] = useState<TruckProfile>(defaultTruckProfile);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTruckProfile();
  }, []);

  const loadTruckProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(TRUCK_STORAGE_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
        try {
          if (!stored.startsWith('{') && !stored.startsWith('[')) {
            console.warn('Invalid JSON format in truck profile, clearing storage');
            await AsyncStorage.removeItem(TRUCK_STORAGE_KEY);
            setTruckProfile(defaultTruckProfile);
            return;
          }
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setTruckProfile({ ...defaultTruckProfile, ...parsed });
          } else {
            console.warn('Invalid truck profile data, resetting to default');
            await AsyncStorage.removeItem(TRUCK_STORAGE_KEY);
            setTruckProfile(defaultTruckProfile);
          }
        } catch (parseError) {
          console.error('JSON parse error in truck profile:', parseError);
          await AsyncStorage.removeItem(TRUCK_STORAGE_KEY);
          setTruckProfile(defaultTruckProfile);
        }
      }
    } catch (error) {
      console.error('Error loading truck profile:', error);
      setTruckProfile(defaultTruckProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTruckProfile = useCallback(async (updates: Partial<TruckProfile>) => {
    try {
      const updated = { ...truckProfile, ...updates };
      setTruckProfile(updated);
      const jsonString = JSON.stringify(updated);
      if (jsonString && jsonString.length > 0) {
        await AsyncStorage.setItem(TRUCK_STORAGE_KEY, jsonString);
      }
    } catch (error) {
      console.error('Error updating truck profile:', error);
      throw error;
    }
  }, [truckProfile]);

  const resetTruckProfile = useCallback(async () => {
    try {
      setTruckProfile(defaultTruckProfile);
      await AsyncStorage.removeItem(TRUCK_STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting truck profile:', error);
    }
  }, []);

  return useMemo(() => ({
    truckProfile,
    isLoading,
    updateTruckProfile,
    resetTruckProfile,
  }), [truckProfile, isLoading, updateTruckProfile, resetTruckProfile]);
});
