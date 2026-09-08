import { useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { buildParticleField } from "@/lib/particle-field";

const PARTICLE_COUNT = 28;

/**
 * The Rhytmo world: a saturated blue sky and a geometric plate floor
 * running continuously toward the horizon, always. On top of that, either
 * big overlapping rings (shop, product, checkout, info — pages about
 * browsing content) or a field of particles opening outward from the
 * screen's center (the home screen and /lab — pages centered on one
 * focal piece of UI, the start panel and the wheel). Everything here is
 * CSS — no bitmaps, no canvas, no render loop of our own — so the whole
 * scene costs the compositor two animated layers plus whichever variant
 * is active.
 *
 * Depth comes from three things working together: each layer drifts a
 * different amount against the cursor (--parallax-x/-y, set below), the
 * floor's perspective makes near plates travel further per second than
 * far ones, and the rings/particles move on long out-of-phase cycles so
 * the arrangement never visibly repeats.
 */
export function Backdrop({
  className = "",
  variant = "rings",
}: {
  className?: string;
  variant?: "rings" | "particles";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const particles = useMemo(
    () =>
      variant === "particles" ? buildParticleField("backdrop-particles", PARTICLE_COUNT) : null,
    [variant],
  );

  // Cursor parallax. Skipped entirely under prefers-reduced-motion (the
  // listener never attaches, so every layer's --parallax-* stays at its
  // unset 0 default), and mouse-only so it's a no-op on touch.
  useEffect(() => {
    if (reducedMotion) return;
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty("--parallax-x", nx.toFixed(3));
        el.style.setProperty("--parallax-y", ny.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className={`game-backdrop fixed inset-0 z-0 overflow-hidden ${className}`}>
      <div className="game-gradient" aria-hidden />

      <div className="game-glow game-glow-b" aria-hidden />

      {variant === "rings" && (
        <div className="game-rings game-rings-far" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      )}

      {/* Perspective floor: two nodes, one GPU-composited animation. */}
      <div className="game-floor" aria-hidden>
        <div className="game-floor-plane" />
      </div>

      <div className="game-glow game-glow-a" aria-hidden />

      {variant === "rings" ? (
        <div className="game-rings game-rings-near" aria-hidden>
          <span />
          <span />
        </div>
      ) : (
        <div className="game-particles" aria-hidden>
          {particles?.map((style, i) => (
            <span key={i} style={style} />
          ))}
        </div>
      )}

      <div className="game-noise" aria-hidden />
      <div className="game-vignette" aria-hidden />
    </div>
  );
}
