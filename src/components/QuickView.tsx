import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useCartStore } from "@/stores/cartStore";
import { productImage, type ShopifyProduct, type ShopifyVariant } from "@/lib/shopify";

const PARADELA_URL = "https://www.instagram.com/paradela___/";

function ParadelaLink() {
  return (
    <a
      href={PARADELA_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="text-pink underline decoration-pink/40 underline-offset-4 transition-colors duration-250 hover:text-pink-deep"
    >
      @paradela
    </a>
  );
}

export function QuickView({
  product,
  onClose,
}: {
  product: ShopifyProduct | null;
  onClose: () => void;
}) {
  const { t, product: content, localize } = useI18n();
  const { formatFrom } = useCurrency();
  const { open } = useCart();
  const addItem = useCartStore((s) => s.addItem);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const loading = useCartStore((s) => s.loading);

  const isOpen = Boolean(product);
  const variants = useMemo(
    () => product?.node.variants.edges.map((e) => e.node) ?? [],
    [product],
  );
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      const first = variants.find((v) => v.availableForSale) ?? variants[0];
      setVariantId(first?.id);
      setQuantity(1);
    }
  }, [product, variants]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const variant: ShopifyVariant | undefined =
    variants.find((v) => v.id === variantId) ?? variants[0];
  const maxQty = 10;
  const image = product ? productImage(product) : null;

  const addToCart = async () => {
    if (!product || !variant) return;
    await addItem({
      variantId: variant.id,
      productId: product.node.id,
      handle: product.node.handle,
      title: product.node.title,
      variantTitle: variant.title,
      image,
      price: Number(variant.price.amount),
      currencyCode: variant.price.currencyCode,
      quantity,
    });
  };

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
        aria-label={product?.node.title ?? "Product"}
        className={`aero-glass relative z-10 flex max-h-[92svh] w-full max-w-[1020px] flex-col overflow-hidden rounded-t-3xl transition-all duration-300 ease-[var(--ease-out-soft)] sm:max-h-[88svh] sm:rounded-3xl ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-100 opacity-0 sm:scale-[0.98]"
        }`}
      >
        {product && (
          <>
            <div className="flex items-center justify-end gap-4 px-5 pt-4 pb-3 sm:px-10 sm:pt-6">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("cart.close")}
                className="glass-btn grid h-9 w-9 place-items-center rounded-full"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-7 overflow-y-auto overscroll-contain px-5 pb-6 sm:grid-cols-2 sm:gap-12 sm:px-10 sm:pb-10">
              <div className="card-float">
                {image ? (
                  <img
                    src={image}
                    alt={product.node.title}
                    loading="lazy"
                    className="max-h-[42svh] w-full rounded-2xl bg-surface object-cover sm:top-0 sm:max-h-none sm:aspect-4/5 sm:sticky"
                  />
                ) : (
                  <div className="card-float-media max-h-[42svh] w-full rounded-2xl bg-surface-2 sm:aspect-4/5" />
                )}
              </div>

              <div className="flex min-w-0 flex-col">
                <p className="label-xs text-muted-foreground">RHYTMO × Paradela</p>
                <h2 className="mt-2 text-2xl leading-tight font-bold tracking-tight sm:text-[2rem]">
                  {localize(product.node.title)}
                </h2>
                <p className="font-num mt-2 text-xl sm:text-2xl">
                  {variant
                    ? formatFrom(Number(variant.price.amount), variant.price.currencyCode)
                    : formatFrom(
                        Number(product.node.priceRange.minVariantPrice.amount),
                        product.node.priceRange.minVariantPrice.currencyCode,
                      )}
                </p>

                <p className="mt-3 text-sm text-muted-foreground">
                  {t("product.collab")}: RHYTMO × <ParadelaLink />
                </p>

                <p
                  className={`label-xs mt-4 ${
                    variant?.availableForSale ? "text-muted-foreground" : "text-pink-deep"
                  }`}
                >
                  {variant?.availableForSale ? t("product.instock") : t("product.soldout")}
                </p>

                {variants.length > 1 && (
                  <fieldset className="mt-7 border-t border-border pt-6">
                    <legend className="label-xs text-muted-foreground">
                      {product.node.options[0]?.name ?? t("cart.size")}
                    </legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVariantId(v.id)}
                          aria-pressed={variant?.id === v.id}
                          disabled={!v.availableForSale}
                          className={`font-num min-h-11 min-w-11 rounded-2xl px-4 text-sm disabled:opacity-40 ${
                            variant?.id === v.id ? "glass-btn-primary" : "glass-btn"
                          }`}
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div className="mt-7 border-t border-border pt-6">
                  <span className="label-xs text-muted-foreground">{t("product.quantity")}</span>
                  <div className="glass-soft mt-3 flex w-fit items-center gap-1 rounded-2xl p-1">
                    <button
                      type="button"
                      aria-label={`− ${t("product.quantity")}`}
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

                <section className="mt-7 border-t border-border pt-6">
                  <h3 className="label-xs text-muted-foreground">{t("product.overview")}</h3>
                  <p className="mt-3 text-sm leading-relaxed">{content.overview}</p>
                </section>

                <section className="mt-7 border-t border-border pt-6">
                  <h3 className="label-xs text-muted-foreground">{t("product.specs")}</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                    {content.specs.map((spec) => (
                      <li key={spec} className="grid grid-cols-[10px_minmax(0,1fr)] gap-3">
                        <span aria-hidden className="text-pink">
                          •
                        </span>
                        <span>
                          {spec.includes("@paradela") ? (
                            <>
                              {spec.split("@paradela")[0]}
                              <ParadelaLink />
                            </>
                          ) : (
                            spec
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-7 border-t border-border pt-6">
                  <h3 className="label-xs text-muted-foreground">{t("product.care")}</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                    {content.care.map((item) => (
                      <li key={item} className="grid grid-cols-[10px_minmax(0,1fr)] gap-3">
                        <span aria-hidden className="text-pink">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-7 border-t border-border pt-6">
                  <h3 className="label-xs text-muted-foreground">{t("product.shipping")}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {content.shipping}
                  </p>
                </section>
              </div>
            </div>

            <div className="glass-bar sticky bottom-0 z-10 grid gap-3 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:px-10">
              <button
                type="button"
                disabled={!variant?.availableForSale || loading}
                onClick={async () => {
                  await addToCart();
                  onClose();
                  open();
                }}
                className="glass-btn label-xs rounded-full px-4 py-4 leading-tight break-words whitespace-normal disabled:opacity-50"
              >
                {t("product.add")}
              </button>
              <button
                type="button"
                disabled={!variant?.availableForSale || loading}
                onClick={async () => {
                  await addToCart();
                  const url = useCartStore.getState().checkoutUrl ?? checkoutUrl;
                  if (url) window.location.href = url;
                }}
                className="glass-btn-primary label-xs rounded-full px-4 py-4 leading-tight break-words whitespace-normal disabled:opacity-50"
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
