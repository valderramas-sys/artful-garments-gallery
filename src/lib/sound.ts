import popOpen from "@/assets/pop-open.mp3.asset.json";
import windSwoosh from "@/assets/wind-swoosh.mp3.asset.json";

let clickAudio: HTMLAudioElement | null = null;
let hoverAudio: HTMLAudioElement | null = null;
let context: AudioContext | null = null;
let lastHoverAt = 0;

function resumeContext() {
  if (typeof window === "undefined") return;
  if (!context && window.AudioContext) {
    context = new AudioContext();
  }
  if (context && context.state === "suspended") {
    context.resume().catch(() => {});
  }
}

export function playClick() {
  if (typeof window === "undefined") return;
  if (!clickAudio) {
    clickAudio = new Audio(popOpen.url);
    clickAudio.preload = "auto";
  }

  resumeContext();

  clickAudio.currentTime = 0;
  clickAudio.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}

export function playHover() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastHoverAt < 90) return;
  lastHoverAt = now;

  if (!hoverAudio) {
    hoverAudio = new Audio(windSwoosh.url);
    hoverAudio.preload = "auto";
    hoverAudio.volume = 0.6;
  }

  resumeContext();

  hoverAudio.currentTime = 0;
  hoverAudio.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}


