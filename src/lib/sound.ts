import windSwoosh from "@/assets/wind-swoosh.mp3.asset.json";
import arcadeClick from "@/assets/arcade-click.mp3.asset.json";
import beepPloc from "@/assets/beep-ploc.mp3.asset.json";

let swooshAudio: HTMLAudioElement | null = null;
let clickAudio: HTMLAudioElement | null = null;
let beepAudio: HTMLAudioElement | null = null;
let lastPlayedAt = 0;
let lastClickAt = 0;
let lastBeepAt = 0;

/** Plays the swipe/slide sound used when moving between LAB icons. */
export function playSwipe() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastPlayedAt < 90) return;
  lastPlayedAt = now;

  if (!swooshAudio) {
    swooshAudio = new Audio(windSwoosh.url);
    swooshAudio.preload = "auto";
    swooshAudio.volume = 0.6;
  }

  swooshAudio.currentTime = 0;
  swooshAudio.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}

/** Plays the arcade UI click used on primary buttons. */
export function playClick() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastClickAt < 90) return;
  lastClickAt = now;

  if (!clickAudio) {
    clickAudio = new Audio(arcadeClick.url);
    clickAudio.preload = "auto";
    clickAudio.volume = 0.7;
  }

  clickAudio.currentTime = 0;
  clickAudio.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}
