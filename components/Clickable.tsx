import React from "react";
import { PressableProps, TouchableOpacity, TouchableOpacityProps } from "react-native";

import { playClickSound } from "@/soundManager";

type ClickableProps = TouchableOpacityProps & PressableProps;

export function Clickable(props: ClickableProps) {
  const { onPress, ...rest } = props;

  const handlePress: TouchableOpacityProps["onPress"] = (event) => {
    void playClickSound();
    if (onPress) {
      onPress(event);
    }
  };

  return <TouchableOpacity onPress={handlePress} {...rest} />;
}
