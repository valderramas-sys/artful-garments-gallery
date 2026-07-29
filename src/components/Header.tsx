import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";
import { CurrencySelector } from "./CurrencySelector";
import { useI18n } from "@/lib/i18n";

export function Header() {
  const { count, open } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [leaving, setLeaving] = useState(false);

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") return;
    setLeaving(true);
    document.body.dataset.leaving = "true";
    window.setTimeout(() => {
      document.body.dataset.leaving = "false";
      setLeaving(false);
      navigate({ to: "/" });
    }, 320);
  };

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-90 bg-background transition-opacity duration-300 ease-[var(--ease-out-soft)] ${
          leaving ? "opacity-100" : "opacity-0"
        }`}
      />
      <header className="glass-bar fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-5 sm:px-10 lg:px-16">
          <Link
            to="/"
            onClick={goHome}
            aria-label="RHYTMO — home"
            className="text-foreground transition-colors duration-250 hover:text-pink"
          >
            <Logo className="h-8 w-[190px] sm:h-9 sm:w-[224px]" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <CurrencySelector />
            <button
              type="button"
              onClick={open}
              aria-label={`${t("cart.open")}, ${count}`}
              className="glass-soft relative inline-flex h-9 w-9 items-center justify-center rounded-full text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:scale-[1.04] hover:text-pink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
            >

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
              </svg>
              {count > 0 && (
                <span className="font-num absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
