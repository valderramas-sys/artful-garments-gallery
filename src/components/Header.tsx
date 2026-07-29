import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";

export function Header() {
  const { count, open } = useCart();

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <Link
          to="/shop"
          aria-label="RHYTMO"
          className="text-foreground transition-colors duration-250 hover:text-pink"
        >
          <Logo className="h-3.5 w-[86px]" />
        </Link>
        <button
          type="button"
          onClick={open}
          aria-label={`Open cart, ${count} items`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:bg-pink-mist/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
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
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
