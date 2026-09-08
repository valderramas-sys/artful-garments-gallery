import type { CSSProperties } from "react";
import { hashString, mulberry32 } from "./bubble-layout";

/**
 * Deterministic field of particles opening outward from the center —
 * replaces the arcs on the home screen and /lab (see Backdrop's `variant`
 * prop). Reuses bubble-layout's seeded PRNG rather than Math.random(): a
 * fixed backdrop decoration still renders on the server, so a
 * server/client mismatch here would trip the same hydration issue the
 * bubble field was built to avoid.
 *
 * Final dx/dy are computed once, here, in plain JS — not with CSS
 * trig functions at animation time, which would need runtime support and
 * buy nothing since the values never change per particle.
 */
export function buildParticleField(seed: string, count: number): CSSProperties[] {
  const rand = mulberry32(hashString(seed));
  const particles: CSSProperties[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = rand() * Math.PI * 2;
    // vw-based for both axes (not vh) so the spread scales the same way
    // regardless of aspect ratio; flattened vertically so the field reads
    // as opening outward across the scene, not shooting off the top/bottom.
    const distance = 22 + rand() * 40;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance * 0.6;
    const dur = 7 + rand() * 9;
    particles.push({
      "--dx": `${dx.toFixed(1)}vw`,
      "--dy": `${dy.toFixed(1)}vw`,
      "--size": `${(2 + rand() * 3).toFixed(1)}px`,
      "--dur": `${dur.toFixed(1)}s`,
      // Negative delay up to a full cycle: without this every particle
      // starts its journey from dead center at the same instant on load,
      // which reads as a single synchronized burst instead of an ambient
      // field already in motion.
      "--delay": `-${(rand() * dur).toFixed(1)}s`,
      "--op": (0.35 + rand() * 0.35).toFixed(2),
    } as CSSProperties);
  }
  return particles;
}
