import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { cartSubtotal, useCartStore } from "@/stores/cartStore";
import { CurrencySelector } from "./CurrencySelector";

export function CartDrawer() {
  const { t, localize } = useI18n();
  const { isOpen, close } = useCart();
  const { formatFrom } = useCurrency();
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const currencyCode = lines[0]?.currencyCode ?? "BRL";
  const subtotal = cartSubtotal(lines);

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
        className={`aero-glass fixed top-0 right-0 z-70 flex h-full w-full max-w-[420px] flex-col transition-transform duration-[350ms] ease-[var(--ease-out-soft)] sm:rounded-l-3xl ${
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
              className="glass-btn label-xs rounded-full px-3 py-1.5"
            >
              {t("cart.close")}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <p className="py-16 text-sm text-ink">{t("cart.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <li key={line.lineId} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-6">
                  {line.image ? (
                    <img
                      src={line.image}
                      alt={line.title}
                      loading="lazy"
                      className="aspect-4/5 w-full rounded-2xl bg-surface object-cover"
                    />
                  ) : (
                    <div className="aspect-4/5 w-full rounded-2xl bg-surface-2" />
                  )}
                  <div className="min-w-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                      <h3 className="text-sm leading-snug font-bold tracking-tight text-ink">{localize(line.title)}</h3>
                      <p className="font-num text-sm text-ink">
                        {formatFrom(line.price * line.quantity, line.currencyCode)}
                      </p>
                    </div>
                    {line.variantTitle && line.variantTitle !== "Default Title" && (
                      <p className="label-xs mt-1 text-ink">{line.variantTitle}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="glass-soft flex items-center gap-3 rounded-full px-3 py-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${line.title}`}
                          onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                          className="text-sm text-pink transition-opacity duration-250 hover:opacity-70"
                        >
                          −
                        </button>
                        <span className="font-num w-4 text-center text-xs text-ink">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${line.title}`}
                          onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                          className="text-sm text-pink transition-opacity duration-250 hover:opacity-70"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.lineId)}
                        className="glass-btn label-xs rounded-full px-3 py-1.5"
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
            <span className="label-xs text-ink">{t("cart.subtotal")}</span>
            <span className="font-num text-lg text-ink">{formatFrom(subtotal, currencyCode)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={close}
            aria-disabled={lines.length === 0}
            className={`label-xs mt-5 flex w-full items-center justify-center rounded-full py-4 transition-all duration-250 ease-[var(--ease-out-soft)] ${
              lines.length === 0
                ? "pointer-events-none bg-surface-2 text-ink"
                : "glass-btn-go"
            }`}
          >
            {t("nav.checkout")}
          </Link>
        </div>
      </aside>
    </>
  );
}
