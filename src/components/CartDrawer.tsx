import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { CurrencySelector } from "./CurrencySelector";

export function CartDrawer() {
  const { t } = useI18n();
  const { isOpen, close, lines, subtotal, setQuantity, remove } = useCart();
  const { format } = useCurrency();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-60 bg-foreground/15 backdrop-blur-[6px] transition-opacity duration-250 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label={t("nav.cart")}
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 z-70 aero-glass flex h-full w-full max-w-[420px] flex-col transition-transform duration-[350ms] ease-[var(--ease-out-soft)] sm:rounded-l-3xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-6">
          <h2 className="label-xs">{t("nav.cart")}</h2>
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <button
              type="button"
              onClick={close}
              className="label-xs text-pink transition-opacity duration-250 hover:opacity-70"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <p className="py-16 text-sm text-muted-foreground">{t("cart.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map(({ key, product, quantity, size }) => (
                <li key={key} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-6">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-4/5 w-full rounded-2xl bg-surface object-cover"
                  />
                  <div className="min-w-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                      <h3 className="truncate text-sm font-bold tracking-tight">{product.name}</h3>
                      <p className="font-num text-sm">{format(product.price * quantity)}</p>
                    </div>
                    {size && (
                      <p className="label-xs mt-1 text-muted-foreground">
                        Size <span className="font-num">{size}</span>
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full bg-surface px-3 py-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name}`}
                          onClick={() => setQuantity(key, quantity - 1)}
                          className="text-sm text-pink transition-opacity duration-250 hover:opacity-70"
                        >
                          −
                        </button>
                        <span className="font-num w-4 text-center text-xs">{quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name}`}
                          onClick={() => setQuantity(key, quantity + 1)}
                          className="text-sm text-pink transition-opacity duration-250 hover:opacity-70"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(key)}
                        className="label-xs text-muted-foreground transition-colors duration-250 hover:text-pink"
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-6 py-6">
          <div className="flex items-center justify-between">
            <span className="label-xs text-muted-foreground">{t("cart.subtotal")}</span>
            <span className="font-num text-lg">{format(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={close}
            aria-disabled={lines.length === 0}
            className={`label-xs mt-5 flex w-full items-center justify-center rounded-full py-4 transition-all duration-250 ease-[var(--ease-out-soft)] ${
              lines.length === 0
                ? "pointer-events-none bg-surface-2 text-muted-foreground"
                : "bg-pink text-primary-foreground hover:bg-pink-deep"
            }`}
          >
            {t("nav.checkout")}
          </Link>
        </div>
      </aside>
    </>
  );
}
