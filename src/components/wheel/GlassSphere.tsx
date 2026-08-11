import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
          background: `radial-gradient(120% 110% at 30% 18%, color-mix(in oklab, white 78%, transparent), color-mix(in oklab, ${tint} 42%, transparent) 62%, color-mix(in oklab, ${tint} 62%, transparent))`,
          opacity: isFront ? 0.95 : 0.62,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[16%] top-[9%] h-[32%] rounded-full bg-white/60 blur-[7px] transition-opacity duration-300"
        style={{ opacity: active ? 0.9 : 0.55 }}
      />
      <Icon
        className="relative z-10 transition-transform duration-500 ease-out"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          transform: active ? "scale(1.16)" : "scale(1)",
        }}
      />
      <span
        className="relative z-10 mt-1 text-[9px] leading-none tracking-[0.18em] uppercase transition-opacity duration-300 sm:text-[10px]"
        style={{ opacity: isFront ? 0.85 : 0.45 }}
      >
        {label}
      </span>
    </>
  );

  const className =
    "glass-btn relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-full text-center select-none";

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
            if (!suppressClick()) onSelect();
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
          }}
        >
          {inner}
        </a>
      )}

    </div>
  );
}
