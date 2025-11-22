import { useCallback } from "react";
import { Platform } from "react-native";
import { useSoundSettings } from "@/contexts/SoundSettingsContext";
import { playKeyboardClickSound } from "@/soundManager";

export function useKeyboardClickSound() {
  const { keyboardClickEnabled } = useSoundSettings();

  const handleKeyPress = useCallback(() => {
    if (keyboardClickEnabled && Platform.OS !== "web") {
      playKeyboardClickSound();
    }
  }, [keyboardClickEnabled]);

  return {
    onKeyPress: handleKeyPress,
  };
}
