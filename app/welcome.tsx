import { Truck } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const bgAnim2 = useRef(new Animated.Value(0)).current;
  const bgAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

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
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim, floatAnim, bgAnim1, bgAnim2, bgAnim3]);

  const handleGetStarted = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/(tabs)/home");
    });
  };

  return (
    <View style={styles.container}>
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
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.glassCircle}>
              <View style={styles.iconCircle}>
                <Truck color={Colors.black} size={80} strokeWidth={2.5} />
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Trucker Companion</Text>
            <Text style={styles.subtitle}>Your journey, organized</Text>
            <Text style={styles.description}>
              Manage your truck specs, track locations, and document your journey all in one place
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 60,
  },
  glassCircle: {
    position: "relative" as const,
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },

  textContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.black,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: Colors.black,
    marginBottom: 20,
    textAlign: "center",
    opacity: 0.7,
  },
  description: {
    fontSize: 16,
    color: Colors.black,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.6,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: Colors.black,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.white,
  },
});
