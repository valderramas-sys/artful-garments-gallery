import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { playClick } from "@/lib/sound";
import type { WheelCategory } from "./wheel-categories";

type Props = {
  category: WheelCategory;
  size: number;
  depth: number;
  isFront: boolean;
  hovered: boolean;
  onHoverChange: (id: string | null) => void;
  onSelect: () => void;
  suppressClick: () => boolean;
  index: number;
};
// Neutral grey ramp — was 4 blues/lilacs + 2 pinks. No hue at all, only value,
// so the spheres still read as distinct from one another without any of
// them reading as "the blue one" or "the pink one".
// One tone for every sphere, not a per-index scale — six near-identical
// greys used to read as "each button its own colour" (feedback), so this
// is now a single constant instead of an array to pick from.
const SPHERE_TINT = "#A6ADB8";
const TINTS = [SPHERE_TINT, SPHERE_TINT, SPHERE_TINT, SPHERE_TINT, SPHERE_TINT, SPHERE_TINT];

export function GlassSphere({
  category,
  size,
  depth,
  isFront,
  hovered,
  onHoverChange,
  onSelect,
  suppressClick,
  index,
}: Props) {
  const { Icon, label } = category;
  const [mounted, setMounted] = useState(false);
  const tint = TINTS[index % TINTS.length];
  const active = isFront && hovered;
  // 0,78 fazia sentido quando a perspectiva quase não encolhia as laterais
  // (ampliação 1,035 a ±72°). Com o anel recuado (ver RASTER_GAIN em
  // CategoryWheel) a distância passou a encolher de verdade — 0,822 a ±72° e
  // 0,639 a ±144° — e manter 0,78 deixaria as laterais pequenas demais.
  // 0,74 é o valor que reproduz a proporção anterior entre a esfera da frente
  // e as outras: 0,74 × 0,822 / 1,02 = 0,596, contra 0,78 × 1,035 / 1,360 =
  // 0,594 de antes. Um valor maior (0,86) engordava as laterais em 17% e
  // amontoava a roda a 390px.
  const scale = mounted ? (active ? 1.13 : isFront ? 1.02 : 0.74) : 0.6;
  // Era `0,28 + depth × 0,16`: com 5 itens, as duas de trás caem em
  // depth = cos(144°) = −0,809 e ficavam a 0,151 de opacidade — Instagram e
  // Pinterest praticamente apagados. A faixa agora é 0,42 → 1,00.
  const opacity = mounted ? (isFront ? 1 : 0.71 + Math.max(depth, -1) * 0.29) : 0;
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 140 + index * 70);
    return () => window.clearTimeout(id);
  }, [index]);

  const inner = (
    <>
      <span className="sphere-pixel-grid" aria-hidden />
      <span
        className="sphere-light"
        aria-hidden
        style={{
          background: `radial-gradient(circle at 28% 18%, #fff 0%, ${tint} 36%, #2B2F38 100%)`,
        }}
      />
      <span className="sphere-gloss" aria-hidden />
      <span className="sphere-rim" aria-hidden />
      <span className="sphere-icon-wrap">
        <Icon className="sphere-icon" aria-hidden />
      </span>
      <span className="sphere-label">{label}</span>
      {isFront && (
        <span className="sphere-selected" aria-hidden>
          SELECTED
        </span>
      )}
    </>
  );
  // With the pink drop-shadow gone (see .game-sphere in styles.css), the
  // white ring on `.sphere-front` is now the only thing that marks the
  // wheel's active item.
  const className = `game-sphere relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center select-none ${isFront ? "sphere-front" : ""}`;

  return (
    <div
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: "auto",
        filter: isFront ? "none" : `blur(${(1 - Math.max(depth, 0)) * 0.45}px)`,
        transition:
          "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms ease-out, filter 520ms ease-out",
      }}
      onMouseEnter={() => onHoverChange(category.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      {!isFront ? (
        <button
          type="button"
          aria-label={label}
          className={className}
          onClick={(e) => {
            e.preventDefault();
            if (!suppressClick()) {
              playClick();
              onSelect();
            }
          }}
        >
          {inner}
        </button>
      ) : category.to ? (
        <Link
          to={category.to}
          className={className}
          draggable={false}
          onClick={(e) => {
            if (suppressClick()) e.preventDefault();
            else playClick();
          }}
        >
          {inner}
        </Link>
      ) : (
        <a
          href={category.href}
          target="_blank"
          rel="noreferrer noopener"
          className={className}
          draggable={false}
          onClick={(e) => {
            if (suppressClick()) e.preventDefault();
            else playClick();
          }}
        >
          {inner}
        </a>
      )}
    </div>
  );
}
