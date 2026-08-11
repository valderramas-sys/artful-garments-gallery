import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { playClick } from "@/lib/sound";
import type { WheelCategory } from "./wheel-categories";



type Props = {
  category: WheelCategory;
  /** Sphere diameter in px. */
  size: number;
  /** -1 (back) .. 1 (front). */
  depth: number;
  /** True when this sphere sits in the front-facing slot. */
  isFront: boolean;
  hovered: boolean;
  onHoverChange: (id: string | null) => void;
  /** Bring this sphere to the centre when it is not the selected one. */
  onSelect: () => void;
  /** Suppress navigation right after a drag gesture. */
  suppressClick: () => boolean;
  index: number;
};

/** Balanced rotation of the brand palette across the spheres. */
const TINTS = [
  "var(--brand-pink)",
  "var(--brand-blue)",
  "var(--brand-green)",
  "var(--brand-magenta)",
  "var(--brand-indigo)",
  "var(--brand-lime)",
];

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

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 120 + index * 70);
    return () => window.clearTimeout(id);
  }, [index]);

  const tint = TINTS[index % TINTS.length];
  const active = isFront && hovered;
  // Small by default; only the front sphere grows on hover.
  const scale = mounted ? (active ? 1.5 : isFront ? 1.08 : 0.78) : 0.6;
  const opacity = mounted ? (isFront ? 1 : 0.32 + Math.max(depth, -1) * 0.16) : 0;

  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500"
        style={{
          background: `radial-gradient(118% 108% at 30% 16%, color-mix(in oklab, white 82%, transparent), color-mix(in oklab, ${tint} 38%, transparent) 58%, color-mix(in oklab, ${tint} 62%, transparent))`,
          opacity: isFront ? 0.95 : 0.62,
        }}
      />
      {/* Crisp rim light around the edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500"
        style={{
          background: `conic-gradient(from 210deg, color-mix(in oklab, white 90%, transparent), transparent 22%, transparent 62%, color-mix(in oklab, white 70%, transparent) 82%, transparent)`,
          mask: "radial-gradient(closest-side, transparent 82%, black 92%, black 100%)",
          WebkitMask: "radial-gradient(closest-side, transparent 82%, black 92%, black 100%)",
          opacity: isFront ? 0.85 : 0.4,
        }}
      />
      {/* Top specular highlight. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[18%] top-[8%] h-[30%] rounded-full bg-white/70 blur-[6px] transition-opacity duration-300"
        style={{ opacity: active ? 0.95 : 0.6 }}
      />
      {/* Lower bounce light. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[28%] bottom-[8%] h-[16%] rounded-full bg-white/40 blur-[8px] transition-opacity duration-300"
        style={{ opacity: isFront ? 0.6 : 0.3 }}
      />
      <Icon
        className="relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)] transition-transform duration-500 ease-out"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          transform: active ? "scale(1.16)" : "scale(1)",
        }}
      />
      <span
        className="relative z-10 mt-1 max-w-[86%] leading-none tracking-[0.18em] whitespace-nowrap uppercase transition-opacity duration-300"
        style={{
          opacity: isFront ? 0.9 : 0.45,
          // Scale down just enough that longer labels stay inside the bubble.
          fontSize: `${Math.max(6.5, Math.min(10, (size * 0.72) / (label.length * 0.8)))}px`,
        }}
      >
        {label}
      </span>
    </>
  );

  const className =
    "glass-sphere relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-full text-center select-none";


  return (
    <div
      className="absolute top-1/2 left-1/2 will-change-transform"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: "auto",
        filter: isFront ? "none" : `blur(${(1 - Math.max(depth, 0)) * 1.4}px)`,
        boxShadow: `0 ${size * 0.16}px ${size * 0.3}px -${size * 0.18}px color-mix(in oklab, ${tint} 55%, transparent)`,
        borderRadius: "9999px",
        transition:
          "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms ease-out, filter 520ms ease-out, box-shadow 520ms ease-out",
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
