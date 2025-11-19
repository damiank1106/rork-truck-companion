import React from "react";
import { PressableProps, TouchableOpacity, TouchableOpacityProps } from "react-native";

import { playClickSound } from "@/soundManager";
import { useSoundSettings } from "@/contexts/SoundSettingsContext";

type ClickableProps = TouchableOpacityProps & PressableProps;

export function Clickable(props: ClickableProps) {
  const { onPress, ...rest } = props;
  const { clickSoundEnabled } = useSoundSettings();

  const handlePress: TouchableOpacityProps["onPress"] = (event) => {
    if (clickSoundEnabled) {
      console.log("Playing click sound...");
      void playClickSound();
    }
    if (onPress) {
      onPress(event);
    }
  };

  return <TouchableOpacity onPress={handlePress} {...rest} />;
}
