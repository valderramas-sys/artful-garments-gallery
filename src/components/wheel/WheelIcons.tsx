import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10.5 12 3.8l8.5 6.7" />
      <path d="M5.6 9.6v9.1a1 1 0 0 0 1 1h10.8a1 1 0 0 0 1-1V9.6" />
      <path d="M9.8 19.7v-5.4h4.4v5.4" />
    </svg>
  );
}

export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5.4 7.8h13.2l-1 11.1a1 1 0 0 1-1 .9H7.4a1 1 0 0 1-1-.9Z" />
      <path d="M8.9 10.2V7.4a3.1 3.1 0 0 1 6.2 0v2.8" />
    </svg>
  );
}

export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11v5.2" />
      <path d="M12 7.9h.01" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.8" />
      <circle cx="12" cy="12" r="4.1" />
      {/* O flash era `M16.9 7.1h.01` — um segmento de comprimento zero que só
          aparece por causa do stroke-linecap redondo, com o diâmetro da
          espessura do traço. Vira um ponto quase invisível nesta escala. */}
      <circle cx="16.75" cy="7.25" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PinterestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      {/* Eram três traços soltos que não fechavam num "P". Agora é um P de
          verdade — haste e bojo — na mesma construção dos outros ícones. */}
      <path d="M10.1 17.9V7.5h3.1a2.9 2.9 0 0 1 0 5.8h-3.1" />
    </svg>
  );
}
