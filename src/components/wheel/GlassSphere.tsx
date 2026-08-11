import { Link } from "@tanstack/react-router";
import type { WheelCategory } from "./wheel-categories";

type Props = {
  category: WheelCategory;
  /** Sphere diameter in px. */
  size: number;
  /** Counter-rotation so the sphere content stays upright. */
  counterAngle: number;
  dimmed: boolean;
  hovered: boolean;
  onHoverChange: (id: string | null) => void;
  /** Suppress navigation right after a drag gesture. */
  suppressClick: () => boolean;
  index: number;
};

export function GlassSphere({
  category,
  size,
  counterAngle,
  dimmed,
  hovered,
  onHoverChange,
  suppressClick,
  index,
}: Props) {
  const { Icon, label } = category;

  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[14%] top-[8%] h-[34%] rounded-full bg-white/55 blur-[6px] transition-opacity duration-300"
        style={{ opacity: hovered ? 0.85 : 0.6 }}
      />
      <Icon
        className="relative z-10 transition-transform duration-400 ease-out"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          transform: hovered ? "scale(1.18)" : "scale(1)",
        }}
      />
      <span className="relative z-10 mt-1 text-[9px] leading-none tracking-[0.18em] uppercase opacity-70 sm:text-[10px]">
        {label}
      </span>
    </>
  );

  const className =
    "glass-btn flex h-full w-full flex-col items-center justify-center gap-1 rounded-full text-center select-none";

  return (
    <div
      className="absolute top-1/2 left-1/2 will-change-transform"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        opacity: mounted ? (dimmed ? 0.45 : 1) : 0,
        transform: `rotate(${counterAngle}deg) scale(${mounted ? (hovered ? 1.14 : 1) : 0.6})`,
        transition:
          "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms ease-out",
      }}
      onMouseEnter={() => onHoverChange(category.id)}
      onMouseLeave={() => onHoverChange(null)}
    >

      {category.to ? (
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
