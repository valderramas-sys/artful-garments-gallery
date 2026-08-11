import { useCallback, useEffect, useRef, useState } from "react";
import { GlassSphere } from "./GlassSphere";
import { WHEEL_CATEGORIES } from "./wheel-categories";
import { playHover } from "@/lib/sound";


/** Responsive geometry: [ring radius, sphere diameter]. */
function geometry(width: number): { radius: number; sphere: number } {
  if (width < 380) return { radius: 108, sphere: 76 };
  if (width < 480) return { radius: 128, sphere: 84 };
  if (width < 768) return { radius: 176, sphere: 98 };
  if (width < 1200) return { radius: 236, sphere: 114 };
  return { radius: 296, sphere: 130 };
}

const norm = (deg: number) => (((deg + 180) % 360) + 360) % 360 - 180;

export function CategoryWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ radius, sphere }, setGeo] = useState(() => geometry(1280));
  const [index, setIndex] = useState(0);
  const [hovered, setHoveredState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);


  const count = WHEEL_CATEGORIES.length;
  const slice = 360 / count;

  useEffect(() => {
    const measure = () => setGeo(geometry(window.innerWidth));
    measure();
    setReady(true);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const step = useCallback((dir: number) => {
    setIndex((i) => (i + dir + count) % count);
  }, [count]);

  const stepRef = useRef(step);
  stepRef.current = step;

  // Keyboard navigation (arrows never scroll the page while the wheel is mounted).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      stepRef.current(e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Wheel / trackpad navigation with accumulation so one flick moves one item.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let acc = 0;
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const dx = e.deltaX * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      acc += Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const now = performance.now();
      if (Math.abs(acc) > 40 && now - lock > 220) {
        stepRef.current(acc > 0 ? 1 : -1);
        acc = 0;
        lock = now;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Swipe: one gesture = one step, always snapping to a centered item.
  const swipe = useRef({ active: false, x: 0, y: 0, fired: false });

  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { active: true, x: e.clientX, y: e.clientY, fired: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!s.active || s.fired) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 44) {
      s.fired = true;
      step(dx < 0 ? 1 : -1);
    }
  };
  const endSwipe = () => {
    swipe.current.active = false;
  };

  const suppressClick = useCallback(() => swipe.current.fired, []);

  const angle = -slice * index;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="listbox"
      aria-label="RHYTMO navigation wheel"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      className="relative touch-none select-none outline-none"
      style={{
        width: radius * 2 + sphere,
        maxWidth: "100vw",
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
          transition: "transform 720ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {WHEEL_CATEGORIES.map((category, i) => {
          const theta = slice * i;
          const delta = norm(theta + angle);
          const depth = Math.cos((delta * Math.PI) / 180);
          const isFront = i === index;
          return (
            <div
              key={category.id}
              className="absolute top-1/2 left-1/2"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${theta}deg) translateZ(${radius}px) rotateY(${-theta - angle}deg) rotateX(-9deg)`,
                transition: "transform 720ms cubic-bezier(0.22, 1, 0.36, 1)",
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
                onSelect={() => setIndex(i)}
                suppressClick={suppressClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
