import { useCallback, useEffect, useRef, useState } from "react";
import { GlassSphere } from "./GlassSphere";
import { WHEEL_CATEGORIES } from "./wheel-categories";

/** Responsive geometry: [ring radius, sphere diameter]. */
function geometry(width: number): { radius: number; sphere: number } {
  if (width < 480) return { radius: 130, sphere: 86 };
  if (width < 768) return { radius: 180, sphere: 100 };
  if (width < 1200) return { radius: 240, sphere: 116 };
  return { radius: 300, sphere: 132 };
}

const norm = (deg: number) => {
  let d = ((deg + 180) % 360 + 360) % 360 - 180;
  return d;
};

export function CategoryWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ radius, sphere }, setGeo] = useState(() => geometry(1280));
  const [angle, setAngle] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const drag = useRef({
    active: false,
    lastX: 0,
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
    d.lastX = e.clientX;
    d.lastTime = performance.now();
    d.velocity = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const now = performance.now();
    const dt = Math.max(now - d.lastTime, 1);
    const delta = dx * 0.32;
    d.velocity = delta * (16 / dt);
    d.lastX = e.clientX;
    d.lastTime = now;
    d.moved += Math.abs(dx);
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

  const slice = 360 / WHEEL_CATEGORIES.length;

  // Which sphere currently sits closest to the front-facing position.
  let frontIndex = 0;
  let frontDelta = 999;
  WHEEL_CATEGORIES.forEach((_, i) => {
    const d = Math.abs(norm(slice * i + angle));
    if (d < frontDelta) {
      frontDelta = d;
      frontIndex = i;
    }
  });
  const frontActive = frontDelta < slice / 2;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative touch-none cursor-grab select-none active:cursor-grabbing"
      style={{
        width: radius * 2 + sphere,
        height: radius * 1.15 + sphere,
        perspective: radius * 3.2,
        perspectiveOrigin: "50% 45%",
        opacity: ready ? 1 : 0,
        transition: "opacity 900ms ease-out",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${-radius * 0.2}px) rotateX(9deg) rotateY(${angle}deg) scale(${ready ? 1 : 0.92})`,
          transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {WHEEL_CATEGORIES.map((category, i) => {
          const theta = slice * i;
          const delta = norm(theta + angle);
          const depth = Math.cos((delta * Math.PI) / 180); // 1 = front, -1 = back
          const isFront = frontActive && i === frontIndex;
          return (
            <div
              key={category.id}
              className="absolute top-1/2 left-1/2"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${theta}deg) translateZ(${radius}px) rotateY(${-theta - angle}deg) rotateX(-9deg)`,
              }}
            >
              <GlassSphere
                category={category}
                size={sphere}
                index={i}
                depth={depth}
                isFront={isFront}
                hovered={hovered === category.id}
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
