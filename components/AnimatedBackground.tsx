import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { height } = Dimensions.get("window");

export default function AnimatedBackground() {
  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const bgAnim2 = useRef(new Animated.Value(0)).current;
  const bgAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim1, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim1, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim2, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim2, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim3, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim3, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bgAnim1, bgAnim2, bgAnim3]);

  return (
    <View style={styles.backgroundContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle1,
          {
            transform: [
              {
                translateX: bgAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100],
                }),
              },
              {
                translateY: bgAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle2,
          {
            transform: [
              {
                translateX: bgAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -120],
                }),
              },
              {
                translateY: bgAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle3,
          {
            transform: [
              {
                translateX: bgAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 80],
                }),
              },
              {
                translateY: bgAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 120],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgCircle: {
    position: "absolute" as const,
    borderRadius: 9999,
    opacity: 0.08,
  },
  bgCircle1: {
    width: 400,
    height: 400,
    backgroundColor: "#000000",
    top: -100,
    left: -100,
  },
  bgCircle2: {
    width: 350,
    height: 350,
    backgroundColor: "#000000",
    bottom: -80,
    right: -80,
  },
  bgCircle3: {
    width: 300,
    height: 300,
    backgroundColor: "#000000",
    top: height / 2 - 150,
    right: -100,
  },
});
