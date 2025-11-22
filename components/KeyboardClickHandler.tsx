import { useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useSoundSettings } from "@/contexts/SoundSettingsContext";
import { playKeyboardClickSound } from "@/soundManager";

export function useKeyboardClickSound() {
  const { keyboardClickEnabled } = useSoundSettings();
  const previousTextRef = useRef<string>("");

  const handleTextChange = useCallback((text: string) => {
    if (keyboardClickEnabled && Platform.OS !== "web") {
      const previousLength = previousTextRef.current.length;
      const currentLength = text.length;
      
      if (currentLength !== previousLength) {
        playKeyboardClickSound();
      }
    }
    previousTextRef.current = text;
  }, [keyboardClickEnabled]);

  const resetPreviousText = useCallback((text: string = "") => {
    previousTextRef.current = text;
  }, []);

  return {
    handleTextChange,
    resetPreviousText,
  };
}
