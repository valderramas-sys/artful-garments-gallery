import popOpen from "@/assets/pop-open.mp3.asset.json";

let audio: HTMLAudioElement | null = null;
let context: AudioContext | null = null;

function ensureAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(popOpen.url);
    audio.preload = "auto";
  }
  return audio;
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
  const el = ensureAudio();
  if (!el) return;

  resumeContext();

  el.currentTime = 0;
  el.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}
