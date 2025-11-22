import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";

interface SoundSettings {
  startupSoundEnabled: boolean;
  clickSoundEnabled: boolean;
  keyboardClickEnabled: boolean;
}

interface SoundSettingsContextType extends SoundSettings {
  setStartupSoundEnabled: (enabled: boolean) => Promise<void>;
  setClickSoundEnabled: (enabled: boolean) => Promise<void>;
  setKeyboardClickEnabled: (enabled: boolean) => Promise<void>;
}

const SoundSettingsContext = createContext<SoundSettingsContextType | undefined>(undefined);

const SOUND_SETTINGS_KEY = "sound_settings";

export function SoundSettingsProvider({ children }: { children: ReactNode }) {
  const [startupSoundEnabled, setStartupSoundEnabledState] = useState<boolean>(true);
  const [clickSoundEnabled, setClickSoundEnabledState] = useState<boolean>(true);
  const [keyboardClickEnabled, setKeyboardClickEnabledState] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      if (stored) {
        const settings: SoundSettings = JSON.parse(stored);
        setStartupSoundEnabledState(settings.startupSoundEnabled ?? true);
        setClickSoundEnabledState(settings.clickSoundEnabled ?? true);
        setKeyboardClickEnabledState(settings.keyboardClickEnabled ?? true);
      }
    } catch (error) {
      console.error("Error loading sound settings:", error);
    }
  };

  const setStartupSoundEnabled = async (enabled: boolean) => {
    try {
      setStartupSoundEnabledState(enabled);
      const stored = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      const settings: SoundSettings = stored ? JSON.parse(stored) : { startupSoundEnabled: true, clickSoundEnabled: true, keyboardClickEnabled: true };
      settings.startupSoundEnabled = enabled;
      await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving startup sound setting:", error);
    }
  };

  const setClickSoundEnabled = async (enabled: boolean) => {
    try {
      setClickSoundEnabledState(enabled);
      const stored = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      const settings: SoundSettings = stored ? JSON.parse(stored) : { startupSoundEnabled: true, clickSoundEnabled: true, keyboardClickEnabled: true };
      settings.clickSoundEnabled = enabled;
      await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving click sound setting:", error);
    }
  };

  const setKeyboardClickEnabled = async (enabled: boolean) => {
    try {
      setKeyboardClickEnabledState(enabled);
      const stored = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      const settings: SoundSettings = stored ? JSON.parse(stored) : { startupSoundEnabled: true, clickSoundEnabled: true, keyboardClickEnabled: true };
      settings.keyboardClickEnabled = enabled;
      await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving keyboard click sound setting:", error);
    }
  };

  const value = useMemo(
    () => ({
      startupSoundEnabled,
      clickSoundEnabled,
      keyboardClickEnabled,
      setStartupSoundEnabled,
      setClickSoundEnabled,
      setKeyboardClickEnabled,
    }),
    [startupSoundEnabled, clickSoundEnabled, keyboardClickEnabled]
  );

  return (
    <SoundSettingsContext.Provider value={value}>
      {children}
    </SoundSettingsContext.Provider>
  );
}

export function useSoundSettings() {
  const context = useContext(SoundSettingsContext);
  if (!context) {
    throw new Error("useSoundSettings must be used within SoundSettingsProvider");
  }
  return context;
}
