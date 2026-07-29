import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import type { Product } from "@/lib/products";

export function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { add, close: closeCart } = useCart();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const isOpen = Boolean(product);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSize(product.sizes[0]);
      setQuantity(1);
    }
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const maxQty = product ? Math.max(1, Math.min(product.stock, 10)) : 1;

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-80 flex items-end justify-center transition-opacity duration-300 ease-[var(--ease-out-soft)] sm:items-center sm:p-4 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[8px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ?? "Product"}
        className={`aero-glass relative z-10 flex max-h-[92svh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-3xl transition-all duration-300 ease-[var(--ease-out-soft)] sm:max-h-[88svh] sm:rounded-3xl ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-100 opacity-0 sm:scale-[0.98]"
        }`}
      >
        {product && (
          <>
            <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 sm:px-8 sm:pt-6">
              <span className="font-num text-xs tracking-[0.18em] text-muted-foreground">
                {product.index}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("cart.close")}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface/70 text-muted-foreground transition-colors duration-250 hover:text-pink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain px-5 pb-6 sm:grid-cols-2 sm:gap-10 sm:px-8 sm:pb-8">
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                width={1024}
                height={1280}
                className="max-h-[42svh] w-full rounded-2xl bg-surface object-cover sm:top-0 sm:max-h-none sm:aspect-4/5 sm:sticky"
              />

              <div className="flex min-w-0 flex-col">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h2>
                <p className="font-num mt-2 text-xl sm:text-2xl">{format(product.price)}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                <p
                  className={`label-xs mt-5 ${product.stock <= 5 ? "text-pink-deep" : "text-muted-foreground"}`}
                >
                  {product.stock > 0 ? (
                    <>
                      {t("product.instock")} — <span className="font-num">{product.stock}</span> {t("product.left")}
                    </>
                  ) : (
                    t("product.soldout")
                  )}
                </p>

                <fieldset className="mt-6">
                  <legend className="label-xs text-muted-foreground">{t("cart.size")}</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        aria-pressed={size === s}
                        className={`font-num min-h-11 min-w-11 rounded-2xl border px-4 text-sm transition-all duration-250 ease-[var(--ease-out-soft)] ${
                          size === s
                            ? "border-pink bg-pink text-primary-foreground"
                            : "border-border bg-surface/60 text-foreground hover:border-pink hover:text-pink"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-6">
                  <span className="label-xs text-muted-foreground">{t("product.quantity")}</span>
                  <div className="mt-3 flex w-fit items-center gap-1 rounded-2xl bg-surface/70 p-1">
                    <button
                      type="button"
                      aria-label={`- ${t("product.quantity")}`}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="grid h-11 w-11 place-items-center rounded-xl text-pink transition-colors duration-250 hover:bg-pink-mist/60"
                    >
                      −
                    </button>
                    <span className="font-num w-8 text-center text-sm">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`+ ${t("product.quantity")}`}
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      className="grid h-11 w-11 place-items-center rounded-xl text-pink transition-colors duration-250 hover:bg-pink-mist/60"
                    >
                      +
                    </button>
                  </div>
                </div>

                <dl className="mt-8 divide-y divide-border border-t border-border text-sm">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-3">
                      <dt className="label-xs pt-0.5 text-muted-foreground">{spec.label}</dt>
                      <dd className="text-right">{spec.value}</dd>
                    </div>
                  ))}
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-3">
                    <dt className="label-xs pt-0.5 text-muted-foreground">{t("product.material")}</dt>
                    <dd className="text-right">{product.composition}</dd>
                  </div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-3">
                    <dt className="label-xs pt-0.5 text-muted-foreground">{t("product.care")}</dt>
                    <dd className="text-right">{product.care.join(" · ")}</dd>
                  </div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-3">
                    <dt className="label-xs pt-0.5 text-muted-foreground">{t("product.shipping")}</dt>
                    <dd className="text-right">{product.shipping}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="glass-bar sticky bottom-0 z-10 grid gap-3 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:px-8">
              <button
                type="button"
                onClick={() => {
                  add(product, quantity, size);
                  onClose();
                }}
                className="label-xs min-h-12 rounded-full border border-pink-mist bg-pink-mist/50 text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:bg-pink hover:text-primary-foreground active:scale-[0.99]"
              >
                {t("product.add")}
              </button>
              <button
                type="button"
                onClick={() => {
                  add(product, quantity, size);
                  onClose();
                  closeCart();
                  navigate({ to: "/checkout" });
                }}
                className="label-xs min-h-12 rounded-full bg-pink text-primary-foreground transition-all duration-250 ease-[var(--ease-out-soft)] hover:bg-pink-deep active:scale-[0.99]"
              >
                {t("product.buy")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
