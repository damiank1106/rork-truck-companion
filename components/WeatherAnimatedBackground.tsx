import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type WeatherCondition = "Clear" | "Cloudy" | "Rain" | "Snow" | "Storm" | "Unknown";
type TimeOfDay = "day" | "night";

type WeatherAnimatedBackgroundProps = {
  condition?: string | null;
  borderRadius?: number;
  timeOfDay?: TimeOfDay;
};

const gradientPalettes: Record<TimeOfDay, Record<WeatherCondition, readonly [string, string, string]>> = {
  day: {
    Clear: ["rgba(255, 222, 173, 0.55)", "rgba(255, 244, 214, 0.45)", "rgba(255, 255, 255, 0.3)"],
    Cloudy: ["rgba(206, 217, 235, 0.6)", "rgba(232, 236, 244, 0.5)", "rgba(255, 255, 255, 0.35)"],
    Rain: ["rgba(119, 167, 255, 0.55)", "rgba(71, 110, 190, 0.55)", "rgba(179, 198, 255, 0.35)"],
    Snow: ["rgba(220, 236, 255, 0.6)", "rgba(240, 248, 255, 0.5)", "rgba(255, 255, 255, 0.4)"],
    Storm: ["rgba(74, 84, 129, 0.65)", "rgba(34, 40, 73, 0.65)", "rgba(13, 17, 41, 0.55)"],
    Unknown: ["rgba(210, 220, 235, 0.55)", "rgba(236, 240, 246, 0.5)", "rgba(255, 255, 255, 0.35)"],
  },
  night: {
    Clear: ["rgba(32, 54, 121, 0.85)", "rgba(18, 24, 47, 0.88)", "rgba(63, 81, 181, 0.6)"],
    Cloudy: ["rgba(40, 53, 88, 0.8)", "rgba(24, 31, 56, 0.82)", "rgba(81, 99, 149, 0.55)"],
    Rain: ["rgba(44, 62, 112, 0.85)", "rgba(17, 26, 54, 0.88)", "rgba(96, 120, 171, 0.6)"],
    Snow: ["rgba(54, 74, 128, 0.82)", "rgba(28, 40, 72, 0.86)", "rgba(116, 142, 192, 0.58)"],
    Storm: ["rgba(24, 28, 54, 0.9)", "rgba(11, 14, 32, 0.92)", "rgba(53, 63, 108, 0.6)"],
    Unknown: ["rgba(36, 51, 92, 0.82)", "rgba(19, 26, 49, 0.85)", "rgba(72, 91, 147, 0.58)"],
  },
};

const DROP_COUNT = 8;
const SPARKLE_COUNT = 6;

const normalizeCondition = (condition?: string | null): WeatherCondition => {
  if (!condition) {
    return "Unknown";
  }

  if (condition === "Clear" || condition === "Cloudy" || condition === "Rain" || condition === "Snow" || condition === "Storm") {
    return condition;
  }

  return "Unknown";
};

export default function WeatherAnimatedBackground({ condition, borderRadius = 18, timeOfDay = "day" }: WeatherAnimatedBackgroundProps) {
  const variant = normalizeCondition(condition);

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const flickerAnim = useRef(new Animated.Value(0)).current;
  const dropAnims = useRef(Array.from({ length: DROP_COUNT }, () => new Animated.Value(0))).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const parallaxAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(Array.from({ length: SPARKLE_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    shimmerAnim.setValue(0);
    floatAnim.setValue(0);
    flickerAnim.setValue(0);
    highlightAnim.setValue(0);
    parallaxAnim.setValue(0);
    dropAnims.forEach((anim) => anim.setValue(0));
    sparkleAnims.forEach((anim) => anim.setValue(0));

    const animations: Animated.CompositeAnimation[] = [];

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    shimmerLoop.start();
    floatLoop.start();
    animations.push(shimmerLoop, floatLoop);

    const highlightLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const parallaxLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(parallaxAnim, {
          toValue: 1,
          duration: 16000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(parallaxAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    highlightLoop.start();
    parallaxLoop.start();
    animations.push(highlightLoop, parallaxLoop);

    sparkleAnims.forEach((anim, index) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(400 + index * 420),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2600 + index * 240,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2600 + index * 240,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      animations.push(loop);
    });

    if (variant === "Storm") {
      const flickerLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(flickerAnim, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(flickerAnim, {
            toValue: 0,
            duration: 520,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(1400),
        ])
      );
      flickerLoop.start();
      animations.push(flickerLoop);
    }

    if (variant === "Rain" || variant === "Snow") {
      const duration = variant === "Snow" ? 5200 : 2000;
      const delayStep = variant === "Snow" ? 320 : 140;
      dropAnims.forEach((anim, index) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.delay(index * delayStep),
            Animated.timing(anim, {
              toValue: 1,
              duration,
              easing: variant === "Snow" ? Easing.inOut(Easing.quad) : Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
        loop.start();
        animations.push(loop);
      });
    }

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [variant, timeOfDay, shimmerAnim, floatAnim, flickerAnim, dropAnims, highlightAnim, parallaxAnim, sparkleAnims]);

  const dropMeta = useMemo(
    () =>
      dropAnims.map((_, index) => {
        const ratio = DROP_COUNT > 1 ? index / (DROP_COUNT - 1) : 0;
        const left = 8 + ratio * 84;
        const driftMultiplier = (index % 3) - 1; // -1, 0, 1
        const size = 4 + (index % 3);
        const scale = 0.85 + (index % 4) * 0.08;
        return { left, driftMultiplier, size, scale };
      }),
    [dropAnims]
  );

  const sparkleMeta = useMemo(
    () =>
      Array.from({ length: SPARKLE_COUNT }, (_, index) => {
        const row = Math.floor(index / 3);
        const column = index % 3;
        return {
          top: 14 + row * 26,
          left: 14 + column * 26 + (row % 2) * 8,
          minScale: 0.55 + (index % 3) * 0.1,
          maxScale: 0.95 + (index % 3) * 0.15,
          peakOpacity: 0.14 + row * 0.05,
        };
      }),
    []
  );

  const gradient = useMemo(() => gradientPalettes[timeOfDay][variant], [timeOfDay, variant]);

  const sparkleStyle = timeOfDay === "night" ? styles.starSparkle : styles.sparkle;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { borderRadius }]}
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={gradient}
        style={[styles.gradient, { borderRadius }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.highlightOverlay,
          { borderRadius },
          {
            backgroundColor: timeOfDay === "night" ? "rgba(12, 18, 35, 0.28)" : "rgba(255, 255, 255, 0.12)",
            opacity: highlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.16],
            }),
            transform: [
              {
                translateY: parallaxAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-18, 18],
                }),
              },
              {
                translateX: parallaxAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 12],
                }),
              },
            ],
          },
        ]}
      />

      {sparkleMeta.map((sparkle, index) => (
        <Animated.View
          key={`sparkle-${index}`}
          style={[
            sparkleStyle,
            {
              top: `${sparkle.top}%`,
              left: `${sparkle.left}%`,
              opacity: sparkleAnims[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, sparkle.peakOpacity, 0],
              }),
              transform: [
                {
                  scale: sparkleAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [sparkle.minScale, sparkle.maxScale],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {timeOfDay === "day" && variant === "Clear" && (
        <>
          <Animated.View
            style={[
              styles.sunCore,
              {
                transform: [
                  {
                    scale: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1.08],
                    }),
                  },
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 8],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sunAura,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.18, 0.34],
                }),
                transform: [
                  { rotate: "-20deg" },
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 12],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}

      {timeOfDay === "night" && (
        <>
          <Animated.View
            style={[
              styles.nightGlow,
              {
                borderRadius,
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.12, 0.24],
                }),
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 12],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.moonAura,
              {
                transform: [
                  {
                    scale: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.1],
                    }),
                  },
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 8],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.moonCore,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.75, 0.95],
                }),
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 6],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.stardust,
              {
                borderRadius,
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.05, 0.12],
                }),
                transform: [
                  {
                    translateX: parallaxAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 10],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}

      {variant === "Cloudy" && (
        <>
          <Animated.View
            style={[
              styles.cloudLarge,
              {
                transform: [
                  {
                    translateX: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 18],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.cloudSmall,
              {
                transform: [
                  {
                    translateX: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -16],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}

      {variant === "Rain" && (
        <>
          <Animated.View
            style={[
              styles.rainMist,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.12, 0.2],
                }),
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 14],
                    }),
                  },
                ],
              },
            ]}
          />
          {dropAnims.map((anim, index) => (
            <Animated.View
              key={`rain-${index}`}
              style={[
                styles.raindrop,
                {
                  left: `${dropMeta[index].left}%`,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 120],
                      }),
                    },
                    { scaleY: dropMeta[index].scale },
                  ],
                  opacity: anim.interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [0, 0.55, 0],
                  }),
                },
              ]}
            />
          ))}
        </>
      )}

      {variant === "Snow" && (
        <>
          <Animated.View
            style={[
              styles.snowHaze,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.08, 0.16],
                }),
              },
            ]}
          />
          {dropAnims.map((anim, index) => {
            const driftDistance = dropMeta[index].driftMultiplier * 6;
            return (
              <Animated.View
                key={`snow-${index}`}
                style={[
                  styles.snowflake,
                  {
                    left: `${dropMeta[index].left}%`,
                    width: dropMeta[index].size,
                    height: dropMeta[index].size,
                    borderRadius: dropMeta[index].size / 2,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 110],
                        }),
                      },
                      {
                        translateX: floatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-driftDistance, driftDistance],
                        }),
                      },
                    ],
                    opacity: anim.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 0.85, 0],
                    }),
                  },
                ]}
              />
            );
          })}
        </>
      )}

      {variant === "Storm" && (
        <>
          <Animated.View
            style={[
              styles.stormCloud,
              {
                transform: [
                  {
                    translateX: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 14],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.stormCloudRight,
              {
                transform: [
                  {
                    translateX: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -12],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.lightningGlow,
              {
                opacity: flickerAnim.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0, 0.5, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.lightningBolt,
              {
                opacity: flickerAnim.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0, 0.85, 0],
                }),
              },
            ]}
          />
        </>
      )}

      {variant === "Unknown" && (
        <Animated.View
          style={[
            styles.ambientGlow,
            {
              opacity: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.06, 0.12],
              }),
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 10],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  sparkle: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: "#ffffff",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 3,
  },
  starSparkle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#8097ff",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 3,
  },
  sunCore: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 214, 133, 0.42)",
    top: -80,
    right: -80,
  },
  sunAura: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    top: -120,
    right: -120,
  },
  nightGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 19, 40, 0.45)",
    zIndex: 0,
  },
  moonAura: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(120, 148, 255, 0.22)",
    top: -60,
    right: -70,
    zIndex: 1,
  },
  moonCore: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(214, 225, 255, 0.85)",
    top: -30,
    right: -40,
    zIndex: 2,
  },
  stardust: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(128, 149, 255, 0.12)",
    zIndex: 1,
  },
  cloudLarge: {
    position: "absolute",
    width: 220,
    height: 110,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    top: 6,
    left: -60,
  },
  cloudSmall: {
    position: "absolute",
    width: 180,
    height: 90,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    top: 42,
    right: -50,
  },
  rainMist: {
    position: "absolute",
    left: -30,
    right: -30,
    bottom: -30,
    height: 160,
    borderRadius: 120,
    backgroundColor: "rgba(147, 197, 253, 0.28)",
  },
  raindrop: {
    position: "absolute",
    width: 3,
    height: 28,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    top: 20,
  },
  snowHaze: {
    position: "absolute",
    left: -40,
    right: -40,
    top: -20,
    bottom: -20,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  snowflake: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    top: 10,
  },
  stormCloud: {
    position: "absolute",
    width: 220,
    height: 120,
    borderRadius: 80,
    backgroundColor: "rgba(26, 31, 58, 0.6)",
    top: 0,
    left: -70,
  },
  stormCloudRight: {
    position: "absolute",
    width: 200,
    height: 110,
    borderRadius: 75,
    backgroundColor: "rgba(20, 26, 52, 0.55)",
    top: 40,
    right: -60,
  },
  lightningGlow: {
    position: "absolute",
    left: -10,
    right: -10,
    top: -10,
    bottom: -10,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  lightningBolt: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    top: 36,
    left: "52%",
    transform: [{ rotate: "-28deg" }],
    shadowColor: "#ffffff",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  ambientGlow: {
    position: "absolute",
    left: -20,
    right: -20,
    top: -20,
    bottom: -20,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
});
