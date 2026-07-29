import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";

export function Header() {
  const { count, open } = useCart();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-250 ${
        solid
          ? "aero-glass border-b border-border/70"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 sm:px-8">
        <Link to="/" aria-label="Rhytmo home" className="text-foreground">
          <Logo className="h-4 w-20 sm:w-24" />
        </Link>
        <span className="label-xs hidden justify-self-center text-muted-foreground sm:block">
          Vol. 01 — Atmosphere
        </span>
        <button
          type="button"
          onClick={open}
          className="label-xs group inline-flex items-center gap-2 text-foreground transition-colors duration-250 hover:text-blue"
        >
          Cart
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] transition-colors duration-250 ${
              count > 0
                ? "bg-green text-primary-foreground"
                : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}
