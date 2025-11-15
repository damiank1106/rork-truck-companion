import { Audio } from "expo-av";

let startupSound: Audio.Sound | null = null;
let clickSound: Audio.Sound | null = null;

async function loadStartupSound() {
  if (!startupSound) {
    const { sound } = await Audio.Sound.createAsync(
      require("./assets/sounds/startupsound.mp3")
    );
    startupSound = sound;
  }
  return startupSound;
}

async function loadClickSound() {
  if (!clickSound) {
    const { sound } = await Audio.Sound.createAsync(
      require("./assets/sounds/clicksound.mp3")
    );
    clickSound = sound;
  }
  return clickSound;
}

export async function playStartupSound() {
  const sound = await loadStartupSound();
  await sound.replayAsync();
}

export async function playClickSound() {
  const sound = await loadClickSound();
  await sound.replayAsync();
}
