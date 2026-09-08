import { useMemo, type CSSProperties } from "react";

// Same deterministic PRNG approach as bubble-layout.ts — seeded by product id
// so ambient drift is stable across renders and SSR/CSR hydration.
function mulberry32(seed: number) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Per-bubble ambient-float parameters, exposed as CSS custom properties for
 * the shared `bubble-float` keyframe (see styles.css). Each bubble gets a
 * different amplitude/duration and a negative animation-delay so it starts
 * mid-cycle — the cheapest way to avoid every bubble drifting in lockstep.
 */
export function useFloatMotion(seed: string): CSSProperties {
  return useMemo(() => {
    const rand = mulberry32(hashString(seed));
    const dx = Math.round((rand() - 0.5) * 2 * 18);
    const dy = Math.round((rand() - 0.5) * 2 * 22);
    const dx2 = Math.round((rand() - 0.5) * 2 * 14);
    const dy2 = Math.round((rand() - 0.5) * 2 * 18);
    const rot = ((rand() - 0.5) * 2 * 3).toFixed(2);
    const duration = 7 + rand() * 6;
    const delay = -(rand() * duration);

    return {
      "--float-dx": `${dx}px`,
      "--float-dy": `${dy}px`,
      "--float-dx2": `${dx2}px`,
      "--float-dy2": `${dy2}px`,
      "--float-rot": `${rot}deg`,
      animationDuration: `${duration.toFixed(2)}s`,
      animationDelay: `${delay.toFixed(2)}s`,
    } as CSSProperties;
  }, [seed]);
}
