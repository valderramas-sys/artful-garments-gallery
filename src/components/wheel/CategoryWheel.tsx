import { useCallback, useEffect, useRef, useState } from "react";
import { GlassSphere } from "./GlassSphere";
import { WHEEL_CATEGORIES } from "./wheel-categories";
import { playSwipe } from "@/lib/sound";

/**
 * A esfera selecionada ficava 0,8·raio À FRENTE do plano de perspectiva
 * (anel em translateZ(-0,2·r), item em +1·r), com perspective = 3,2·r. Isso
 * dá uma ampliação de 3,2/(3,2−0,8) = 4/3: o navegador rasterizava a camada
 * no tamanho CSS (130px) e a transformação 3D esticava o raster para 176px na
 * tela. Ícone, rótulo e grade saíam todos borrados — medido comparando com um
 * clone da mesma marcação fora de contexto 3D, no mesmo tamanho de tela.
 *
 * Agora o anel recua para translateZ(-1·r), o item selecionado cai
 * exatamente sobre o plano (z = 0, ampliação 1,000) e o raster é 1:1. Raio e
 * diâmetro sobem na mesma proporção de 4/3 para a composição continuar do
 * mesmo tamanho aos olhos. Efeito colateral bem-vindo: as esferas de trás
 * agora encolhem de verdade com a distância, em vez de por um scale fixo.
 */
const RASTER_GAIN = 4 / 3;

/** Responsive geometry: [ring radius, sphere diameter], antes do ganho. */
const BREAKPOINTS = [
  { under: 380, radius: 108, sphere: 76 },
  { under: 480, radius: 128, sphere: 84 },
  { under: 768, radius: 176, sphere: 98 },
  { under: 1200, radius: 236, sphere: 114 },
  { under: Infinity, radius: 296, sphere: 130 },
];

function geometry(width: number): { radius: number; sphere: number } {
  const b = BREAKPOINTS.find((x) => width < x.under) ?? BREAKPOINTS[BREAKPOINTS.length - 1];
  return {
    radius: Math.round(b.radius * RASTER_GAIN),
    sphere: Math.round(b.sphere * RASTER_GAIN),
  };
}

const norm = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * Metade da largura que a roda realmente ocupa na tela.
 *
 * Com o anel em z = −raio, um item a θ graus fica em z = raio(cos θ − 1) e
 * projeta em x = raio·sin θ · d/(d − z), com d = 3,2·raio. Reservar `raio` de
 * meia-largura, como antes, virou superestimativa: a caixa passou a 963px
 * contra os 760px do .game-wheel-stage, estourou o grid e a roda inteira
 * alinhou à esquerda em vez de centralizar.
 */
function projectedHalfWidth(radius: number, count: number): number {
  const d = radius * 3.2;
  let max = 0;
  for (let i = 0; i < count; i++) {
    const theta = ((360 / count) * i * Math.PI) / 180;
    const z = radius * (Math.cos(theta) - 1);
    max = Math.max(max, Math.abs(radius * Math.sin(theta)) * (d / (d - z)));
  }
  return max;
}

export function CategoryWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ radius, sphere }, setGeo] = useState(() => geometry(1280));
  const [index, setIndex] = useState(0);
  const [hovered, setHoveredState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const setHovered = useCallback((id: string | null) => {
    setHoveredState(id);
  }, []);

  const count = WHEEL_CATEGORIES.length;
  const slice = 360 / count;

  useEffect(() => {
    const measure = () => setGeo(geometry(window.innerWidth));
    measure();
    setReady(true);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const goTo = useCallback((next: number) => {
    setIndex((i) => {
      if (next === i) return i;
      playSwipe();
      return next;
    });
  }, []);

  const step = useCallback(
    (dir: number) => {
      setIndex((i) => {
        playSwipe();
        return (i + dir + count) % count;
      });
    },
    [count],
  );

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
    <div className="game-wheel-stage">
      <div className="game-wheel-ring game-wheel-ring-outer" aria-hidden />
      <div className="game-wheel-ring game-wheel-ring-inner" aria-hidden />
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
          width: Math.round(projectedHalfWidth(radius, count) * 2 + sphere),
          maxWidth: "100vw",
          height: Math.round(radius * 0.86 + sphere),
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
            transform: `translateZ(${-radius}px) rotateX(9deg) rotateY(${angle}deg) scale(${ready ? 1 : 0.92})`,
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
                  onSelect={() => goTo(i)}
                  suppressClick={suppressClick}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
