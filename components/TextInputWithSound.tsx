import React, { forwardRef, useCallback, useRef } from "react";
import { TextInput, TextInputProps, Platform } from "react-native";
import { useSoundSettings } from "@/contexts/SoundSettingsContext";
import { playKeyboardClickSound } from "@/soundManager";

export const TextInputWithSound = forwardRef<TextInput, TextInputProps>((props, ref) => {
  const { keyboardClickEnabled } = useSoundSettings();
  const { onChangeText, value, defaultValue } = props;
  const previousTextRef = useRef<string>(value || defaultValue || "");

  const handleChangeText = useCallback((text: string) => {
    if (keyboardClickEnabled && Platform.OS !== "web") {
      const previousLength = previousTextRef.current.length;
      const currentLength = text.length;
      
      if (currentLength !== previousLength) {
        playKeyboardClickSound();
      }
    }
    previousTextRef.current = text;

    if (onChangeText) {
      onChangeText(text);
    }
  }, [keyboardClickEnabled, onChangeText]);

  return (
    <TextInput
      {...props}
      ref={ref}
      onChangeText={handleChangeText}
    />
  );
});

TextInputWithSound.displayName = "TextInputWithSound";
