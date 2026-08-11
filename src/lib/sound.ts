import windSwoosh from "@/assets/wind-swoosh.mp3.asset.json";

let swooshAudio: HTMLAudioElement | null = null;
let lastPlayedAt = 0;

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
