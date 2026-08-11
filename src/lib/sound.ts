import popOpen from "@/assets/pop-open.mp3.asset.json";
import windSwoosh from "@/assets/wind-swoosh.mp3.asset.json";

let clickAudio: HTMLAudioElement | null = null;
let hoverAudio: HTMLAudioElement | null = null;
let context: AudioContext | null = null;
let lastHoverAt = 0;

function ensureAudio(asset: typeof popOpen, ref: { current: HTMLAudioElement | null }) {
  if (typeof window === "undefined") return null;
  if (!ref.current) {
    ref.current = new Audio(asset.url);
    ref.current.preload = "auto";
  }
  return ref.current;
}

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
  const el = ensureAudio(popOpen, { current: clickAudio });
  if (!el) return;

  resumeContext();

  el.currentTime = 0;
  el.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}

export function playHover() {
  const now = Date.now();
  if (now - lastHoverAt < 90) return;
  lastHoverAt = now;

  if (!hoverAudio) {
    hoverAudio = new Audio(windSwoosh.url);
    hoverAudio.preload = "auto";
    hoverAudio.volume = 0.6;
  }
  if (typeof window === "undefined") return;

  resumeContext();

  hoverAudio.currentTime = 0;
  hoverAudio.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}

