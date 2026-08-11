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

export function CheckoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.2" y="6.2" width="17.6" height="11.6" rx="2.2" />
      <path d="M3.2 10.3h17.6" />
      <path d="M6.8 14.4h3.4" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.6" />
      <circle cx="12" cy="12" r="3.9" />
      <path d="M16.9 7.1h.01" />
    </svg>
  );
}

export function PinterestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M11 20.1c.6-1.9 1.3-4.4 1.5-5.2" />
      <path d="M9.4 14.3c-.6-.9-.8-2-.5-3.2.5-2 2.3-3.2 4.2-2.9 1.8.3 2.9 1.8 2.6 3.7-.3 2-1.7 3.3-3.2 3-.8-.2-1.2-.8-1.1-1.5" />
    </svg>
  );
}
