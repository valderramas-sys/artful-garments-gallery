import windSwoosh from "@/assets/wind-swoosh.mp3.asset.json";
import arcadeClick from "@/assets/arcade-click.mp3.asset.json";
import beepPloc from "@/assets/beep-ploc.mp3.asset.json";
import popupOpen from "@/assets/popup-open.mp3.asset.json";
import popupClose from "@/assets/popup-close.mp3.asset.json";

type Slot = { url: string; volume: number; audio: HTMLAudioElement | null; last: number };

const slots: Record<string, Slot> = {
  swipe: { url: windSwoosh.url, volume: 0.6, audio: null, last: 0 },
  click: { url: arcadeClick.url, volume: 0.7, audio: null, last: 0 },
  beep: { url: beepPloc.url, volume: 0.7, audio: null, last: 0 },
  popupOpen: { url: popupOpen.url, volume: 0.7, audio: null, last: 0 },
  popupClose: { url: popupClose.url, volume: 0.7, audio: null, last: 0 },
};

function ensure(slot: Slot) {
  if (!slot.audio) {
    const audio = new Audio(slot.url);
    audio.preload = "auto";
    audio.volume = slot.volume;
    // iOS/Safari: keep playback inline instead of opening a media overlay.
    audio.setAttribute("playsinline", "");
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    audio.load();
    slot.audio = audio;
  }
  return slot.audio;
}

let unlocked = false;

/**
 * Mobile browsers only allow audio after a user gesture. Prime every clip on
 * the first interaction so later playback (including async handlers) works.
 */
function unlock() {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;
  for (const slot of Object.values(slots)) {
    const audio = ensure(slot);
    const previous = audio.volume;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previous;
      })
      .catch(() => {
        audio.volume = previous;
      });
  }
}

if (typeof window !== "undefined") {
  const opts = { passive: true } as AddEventListenerOptions;
  const handler = () => {
    unlock();
    window.removeEventListener("touchstart", handler);
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("touchstart", handler, opts);
  window.addEventListener("pointerdown", handler, opts);
  window.addEventListener("keydown", handler, opts);
}

function play(key: keyof typeof slots) {
  if (typeof window === "undefined") return;
  const slot = slots[key];
  const now = Date.now();
  if (now - slot.last < 90) return;
  slot.last = now;

  const audio = ensure(slot);
  audio.volume = slot.volume;
  try {
    audio.currentTime = 0;
  } catch {
    // Ignore seek errors before metadata is ready.
  }
  audio.play().catch(() => {
    // Ignore autoplay/policy errors.
  });
}

/** Plays the swipe/slide sound used when moving between LAB icons. */
export function playSwipe() {
  play("swipe");
}

/** Plays the arcade UI click used on primary buttons. */
export function playClick() {
  play("click");
}

/** Plays the settings beep used when changing currency or language. */
export function playSettingsBeep() {
  play("beep");
}

/** Plays the pop-up open SFX. */
export function playPopupOpen() {
  play("popupOpen");
}

/** Plays the pop-up close SFX. */
export function playPopupClose() {
  play("popupClose");
}
