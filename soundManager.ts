import { Audio } from "expo-av";
import { Platform } from "react-native";

let startupSound: Audio.Sound | null = null;
let clickSound: Audio.Sound | null = null;
let isInitialized = false;

async function initializeAudio() {
  if (isInitialized || Platform.OS === "web") {
    return;
  }
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    isInitialized = true;
  } catch (error) {
    console.log("Audio initialization not supported:", error);
  }
}

async function loadStartupSound() {
  if (Platform.OS === "web") {
    return null;
  }
  if (!startupSound) {
    try {
      await initializeAudio();
      const { sound } = await Audio.Sound.createAsync(
        require("./assets/sounds/startupsound.mp3")
      );
      startupSound = sound;
    } catch (error) {
      console.log("Failed to load startup sound:", error);
      return null;
    }
  }
  return startupSound;
}

async function loadClickSound() {
  if (Platform.OS === "web") {
    return null;
  }
  if (!clickSound) {
    try {
      await initializeAudio();
      const { sound } = await Audio.Sound.createAsync(
        require("./assets/sounds/clicksound.mp3")
      );
      clickSound = sound;
    } catch (error) {
      console.log("Failed to load click sound:", error);
      return null;
    }
  }
  return clickSound;
}

export async function playStartupSound() {
  if (Platform.OS === "web") {
    console.log("Startup sound skipped: Web platform");
    return;
  }
  try {
    console.log("Attempting to play startup sound...");
    const sound = await loadStartupSound();
    if (sound) {
      await sound.replayAsync();
      console.log("Startup sound played successfully");
    } else {
      console.log("Startup sound not loaded");
    }
  } catch (error) {
    console.log("Failed to play startup sound:", error);
  }
}

export async function playClickSound() {
  if (Platform.OS === "web") {
    return;
  }
  try {
    const sound = await loadClickSound();
    if (sound) {
      await sound.replayAsync();
    }
  } catch (error) {
    console.log("Failed to play click sound:", error);
  }
}
