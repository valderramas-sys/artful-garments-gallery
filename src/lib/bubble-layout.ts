export type BubbleSize = "sm" | "md" | "lg";

export type BubbleLayoutInfo = {
  size: BubbleSize;
  /** Static vertical offset (px) for subtle organic vertical breathing. */
  jitter: number;
  /** Static horizontal offset (px). */
  xJitter: number;
  /** Animation delay (s) for phase desynchronization. */
  animDelay: number;
  /** Animation duration (s). */
  animDuration: number;
};

// Deterministic PRNG (mulberry32) — never Math.random() here: the layout must
// be identical between SSR and the client, or React hydration mismatches.
// Exported for reuse by anything else on the page needing the same
// SSR/CSR-safe seeded randomness (see src/lib/particle-field.ts).
export function mulberry32(seed: number) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/** Deterministic unified bubble layout info, seeded by product id. */
export function bubbleLayout(seed: string, index: number): BubbleLayoutInfo {
  const rand = mulberry32(hashString(seed) ^ (index * 0x9e3779b9));
  // Tamanho 100% unificado para todas as bolhas
  const size: BubbleSize = "md";
  const jitter = 0;
  const xJitter = 0;
  const animDelay = -(rand() * 6);
  const animDuration = 6.5 + rand() * 2.5;
  return { size, jitter, xJitter, animDelay, animDuration };
}
