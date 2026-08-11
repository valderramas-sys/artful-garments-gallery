import { useCallback, useEffect, useRef, useState } from "react";
import { GlassSphere } from "./GlassSphere";
import { WHEEL_CATEGORIES } from "./wheel-categories";

/** Responsive geometry: [wheel diameter, sphere diameter]. */
function geometry(width: number): { wheel: number; sphere: number } {
  if (width < 480) return { wheel: 250, sphere: 78 };
  if (width < 768) return { wheel: 330, sphere: 94 };
  if (width < 1200) return { wheel: 430, sphere: 112 };
  return { wheel: 520, sphere: 128 };
}

export function CategoryWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ wheel, sphere }, setGeo] = useState(() => geometry(1280));
  const [angle, setAngle] = useState(-8);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const drag = useRef({
    active: false,
    startAngle: 0,
    startPointer: 0,
    last: 0,
    lastTime: 0,
    velocity: 0,
    moved: 0,
  });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => setGeo(geometry(window.innerWidth));
    measure();
    setReady(true);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pointerAngle = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  }, []);

  const stopInertia = () => {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  const runInertia = useCallback(() => {
    stopInertia();
    const step = () => {
      const d = drag.current;
      d.velocity *= 0.94;
      if (Math.abs(d.velocity) < 0.02) {
        raf.current = null;
        return;
      }
      setAngle((a) => a + d.velocity);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    stopInertia();
    const d = drag.current;
    d.active = true;
    d.moved = 0;
    d.startPointer = pointerAngle(e.clientX, e.clientY);
    d.startAngle = angle;
    d.last = d.startPointer;
    d.lastTime = performance.now();
    d.velocity = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const current = pointerAngle(e.clientX, e.clientY);
    let delta = current - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const now = performance.now();
    const dt = Math.max(now - d.lastTime, 1);
    d.velocity = delta * (16 / dt);
    d.last = current;
    d.lastTime = now;
    d.moved += Math.abs(delta);
    setAngle((a) => a + delta);
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    if (Math.abs(d.velocity) > 0.15) runInertia();
  };

  useEffect(() => stopInertia, []);

  const suppressClick = useCallback(() => drag.current.moved > 6, []);
  const radius = wheel / 2;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative touch-none cursor-grab select-none active:cursor-grabbing"
      style={{
        width: wheel + sphere,
        height: wheel + sphere,
        opacity: ready ? 1 : 0,
        transform: ready ? "scale(1)" : "scale(0.94)",
        transition: "opacity 900ms ease-out, transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Wheel track */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 rounded-full border border-white/50"
        style={{
          width: wheel,
          height: wheel,
          marginLeft: -radius,
          marginTop: -radius,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.7), 0 30px 80px -60px rgba(0,0,0,0.45)",
        }}
      />

      {/* Rotating ring */}
      <div
        className="absolute inset-0"
        style={{ transform: `rotate(${angle}deg)`, willChange: "transform" }}
      >
        {WHEEL_CATEGORIES.map((category, i) => {
          const slice = 360 / WHEEL_CATEGORIES.length;
          const a = ((slice * i - 90) * Math.PI) / 180;
          const x = Math.cos(a) * radius;
          const y = Math.sin(a) * radius;
          return (
            <div
              key={category.id}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <GlassSphere
                category={category}
                size={sphere}
                counterAngle={-angle}
                index={i}
                hovered={hovered === category.id}
                dimmed={hovered !== null && hovered !== category.id}
                onHoverChange={setHovered}
                suppressClick={suppressClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
