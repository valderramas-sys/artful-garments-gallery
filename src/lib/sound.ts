import windSwoosh from "@/assets/wind-swoosh.mp3.asset.json";
import arcadeClick from "@/assets/arcade-click.mp3.asset.json";
import beepPloc from "@/assets/beep-ploc.mp3.asset.json";
import popupOpen from "@/assets/popup-open.mp3.asset.json";
import popupClose from "@/assets/popup-close.mp3.asset.json";
import confirmTap from "@/assets/confirm-tap.mp3.asset.json";

/* -------------------------------------------------------------------------- */
/* Debug audit logging (opt-in)                                               */
/* -------------------------------------------------------------------------- */

type SfxLogEntry = {
  /** Sound key that was requested. */
  key: string;
  /** Playback engine used for this trigger. */
  engine: "webaudio" | "element" | "blocked";
  /** ms between the originating user gesture and the actual playback call. */
  latencyMs: number;
  /** High-resolution timestamp of the trigger. */
  at: number;
  /** Failure reason, when playback was rejected. */
  error?: string;
};

const LOG_LIMIT = 100;
const auditLog: SfxLogEntry[] = [];
let debugEnabled = false;

if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sfxdebug") === "1") localStorage.setItem("rhytmo:sfx-debug", "1");
    if (params.get("sfxdebug") === "0") localStorage.removeItem("rhytmo:sfx-debug");
    debugEnabled = localStorage.getItem("rhytmo:sfx-debug") === "1";
  } catch {
    debugEnabled = false;
  }
}

/** Enables/disables internal SFX audit logging (persisted). */
export function setSfxDebug(enabled: boolean) {
  debugEnabled = enabled;
  if (typeof window === "undefined") return;
  try {
    if (enabled) localStorage.setItem("rhytmo:sfx-debug", "1");
    else localStorage.removeItem("rhytmo:sfx-debug");
  } catch {
    // Ignore storage failures (private mode).
  }
}

/** Returns the in-memory SFX audit log (debug mode only). */
export function getSfxLog(): SfxLogEntry[] {
  return [...auditLog];
}

function audit(entry: SfxLogEntry) {
  if (!debugEnabled) return;
  auditLog.push(entry);
  if (auditLog.length > LOG_LIMIT) auditLog.shift();
  // eslint-disable-next-line no-console
  console.debug(
    `[sfx] ${entry.key} via ${entry.engine} +${entry.latencyMs.toFixed(1)}ms` +
      (entry.error ? ` — ${entry.error}` : ""),
  );
}

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>)["__sfx"] = {
    log: getSfxLog,
    debug: setSfxDebug,
  };
}

/** Timestamp of the most recent user gesture, used to measure trigger latency. */
let lastGestureAt = 0;

/* -------------------------------------------------------------------------- */
/* Element-based slots (legacy clips)                                         */
/* -------------------------------------------------------------------------- */

type Slot = { url: string; volume: number; audio: HTMLAudioElement | null; last: number };

const slots: Record<string, Slot> = {
  swipe: { url: windSwoosh.url, volume: 0.6, audio: null, last: 0 },
  click: { url: arcadeClick.url, volume: 0.7, audio: null, last: 0 },
  beep: { url: beepPloc.url, volume: 0.7, audio: null, last: 0 },
  popupOpen: { url: popupOpen.url, volume: 0.7, audio: null, last: 0 },
  popupClose: { url: popupClose.url, volume: 0.7, audio: null, last: 0 },
  tap: { url: confirmTap.url, volume: 0.7, audio: null, last: 0 },
};

function makeAudio(url: string, volume: number) {
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = volume;
  // iOS/Safari: keep playback inline instead of opening a media overlay.
  audio.setAttribute("playsinline", "");
  (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  audio.load();
  return audio;
}

function ensure(slot: Slot) {
  if (!slot.audio) slot.audio = makeAudio(slot.url, slot.volume);
  return slot.audio;
}

/* -------------------------------------------------------------------------- */
/* Tap SFX: WebAudio first (zero-latency on iOS), element pool as fallback     */
/* -------------------------------------------------------------------------- */

const TAP_VOLUME = 0.7;
const TAP_POOL_SIZE = 4;

let tapPool: HTMLAudioElement[] = [];
/** Elements currently doing a silent unlock pass — never reuse them mid-prime. */
const priming = new Set<HTMLAudioElement>();
let tapIndex = 0;

let audioCtx: AudioContext | null = null;
let tapBuffer: AudioBuffer | null = null;
let tapBufferPending = false;

function tapInstances() {
  if (tapPool.length === 0 && typeof window !== "undefined") {
    tapPool = Array.from({ length: TAP_POOL_SIZE }, () => makeAudio(confirmTap.url, TAP_VOLUME));
  }
  return tapPool;
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

/** Fetches + decodes the tap clip once so playback is a synchronous buffer start. */
function preloadTapBuffer() {
  const ctx = getContext();
  if (!ctx || tapBuffer || tapBufferPending) return;
  tapBufferPending = true;
  fetch(confirmTap.url)
    .then((r) => r.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      tapBuffer = buffer;
      audit({ key: "tap:decoded", engine: "webaudio", latencyMs: 0, at: performance.now() });
    })
    .catch((err: unknown) => {
      audit({
        key: "tap:decode",
        engine: "blocked",
        latencyMs: 0,
        at: performance.now(),
        error: String(err),
      });
    })
    .finally(() => {
      tapBufferPending = false;
    });
}

/* -------------------------------------------------------------------------- */
/* Gesture unlock (iOS Safari requires a user gesture to start audio)          */
/* -------------------------------------------------------------------------- */

let unlocked = false;

function unlock() {
  if (typeof window === "undefined") return;
  lastGestureAt = performance.now();

  // Safari suspends the context whenever the tab/app is backgrounded — resume
  // on every gesture, not just the first one.
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});

  if (unlocked) return;
  unlocked = true;

  // Silent buffer start inside the gesture: this is what actually unlocks
  // WebAudio output on iOS.
  if (ctx) {
    try {
      const source = ctx.createBufferSource();
      source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignore: fallback path still works.
    }
  }
  preloadTapBuffer();

  const primed: HTMLAudioElement[] = [
    ...Object.values(slots).map((slot) => ensure(slot)),
    ...tapInstances(),
  ];
  for (const audio of primed) {
    const previous = audio.volume || 0.7;
    audio.volume = 0;
    priming.add(audio);
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previous;
      })
      .catch(() => {
        audio.volume = previous;
      })
      .finally(() => {
        priming.delete(audio);
      });
  }
  audit({ key: "unlock", engine: "webaudio", latencyMs: 0, at: performance.now() });
}

if (typeof window !== "undefined") {
  // Warm the element pool immediately so the first interaction is instant.
  tapInstances();
  const opts = { passive: true, capture: true } as AddEventListenerOptions;
  // Kept attached: every gesture refreshes the timestamp and resumes iOS audio.
  window.addEventListener("touchstart", unlock, opts);
  window.addEventListener("pointerdown", unlock, opts);
  window.addEventListener("keydown", unlock, opts);
}

/* -------------------------------------------------------------------------- */
/* Playback                                                                    */
/* -------------------------------------------------------------------------- */

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
  const at = performance.now();
  audio
    .play()
    .then(() =>
      audit({ key, engine: "element", latencyMs: at - lastGestureAt, at }),
    )
    .catch((err: unknown) =>
      audit({
        key,
        engine: "blocked",
        latencyMs: at - lastGestureAt,
        at,
        error: String(err),
      }),
    );
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

/**
 * Plays the confirm tap SFX instantly — no debounce, no delay. Uses a decoded
 * WebAudio buffer when available (synchronous start, best on iOS Safari) and
 * falls back to a preloaded pool of audio elements.
 */
export function playTap() {
  if (typeof window === "undefined") return;
  const at = performance.now();
  const ctx = getContext();

  if (ctx && tapBuffer) {
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    try {
      const source = ctx.createBufferSource();
      source.buffer = tapBuffer;
      const gain = ctx.createGain();
      gain.gain.value = TAP_VOLUME;
      source.connect(gain).connect(ctx.destination);
      source.start(0);
      audit({ key: "tap", engine: "webaudio", latencyMs: at - lastGestureAt, at });
      return;
    } catch (err) {
      audit({
        key: "tap",
        engine: "blocked",
        latencyMs: at - lastGestureAt,
        at,
        error: String(err),
      });
    }
  } else {
    preloadTapBuffer();
  }

  const pool = tapInstances();
  if (pool.length === 0) return;
  // Skip any element still finishing its silent unlock pass, otherwise the
  // priming pause() aborts this playback.
  let audio = pool[tapIndex % pool.length];
  for (let i = 0; i < pool.length && priming.has(audio); i += 1) {
    tapIndex += 1;
    audio = pool[tapIndex % pool.length];
  }
  tapIndex += 1;
  audio.volume = TAP_VOLUME;
  try {
    audio.currentTime = 0;
  } catch {
    // Ignore seek errors before metadata is ready.
  }
  audio
    .play()
    .then(() => audit({ key: "tap", engine: "element", latencyMs: at - lastGestureAt, at }))
    .catch((err: unknown) =>
      audit({
        key: "tap",
        engine: "blocked",
        latencyMs: at - lastGestureAt,
        at,
        error: String(err),
      }),
    );
}
