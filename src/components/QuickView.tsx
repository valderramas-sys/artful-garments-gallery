import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useCartStore } from "@/stores/cartStore";
import { productImage, type ShopifyProduct, type ShopifyVariant } from "@/lib/shopify";

export function QuickView({
  product,
  onClose,
}: {
  product: ShopifyProduct | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
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
  const stock: number | null = null;
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
        className={`aero-glass relative z-10 flex max-h-[92svh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-3xl transition-all duration-300 ease-[var(--ease-out-soft)] sm:max-h-[88svh] sm:rounded-3xl ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-100 opacity-0 sm:scale-[0.98]"
        }`}
      >
        {product && (
          <>
            <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 sm:px-8 sm:pt-6">
              <span className="label-xs text-muted-foreground">{t("product.quickview")}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("cart.close")}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface/70 text-muted-foreground transition-colors duration-250 hover:text-pink"
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

            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain px-5 pb-6 sm:grid-cols-2 sm:gap-10 sm:px-8 sm:pb-8">
              {image ? (
                <img
                  src={image}
                  alt={product.node.title}
                  loading="lazy"
                  className="max-h-[42svh] w-full rounded-2xl bg-surface object-cover sm:top-0 sm:max-h-none sm:aspect-4/5 sm:sticky"
                />
              ) : (
                <div className="max-h-[42svh] w-full rounded-2xl bg-surface-2 sm:aspect-4/5" />
              )}

              <div className="flex min-w-0 flex-col">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {product.node.title}
                </h2>
                <p className="font-num mt-2 text-xl sm:text-2xl">
                  {variant
                    ? formatFrom(Number(variant.price.amount), variant.price.currencyCode)
                    : formatFrom(
                        Number(product.node.priceRange.minVariantPrice.amount),
                        product.node.priceRange.minVariantPrice.currencyCode,
                      )}
                </p>
                {product.node.description && (
                  <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {product.node.description}
                  </p>
                )}

                <p
                  className={`label-xs mt-5 ${
                    variant?.availableForSale ? "text-muted-foreground" : "text-pink-deep"
                  }`}
                >
                  {variant?.availableForSale ? (
                    stock !== null ? (
                      <>
                        {t("product.instock")} — <span className="font-num">{stock}</span>{" "}
                        {t("product.left")}
                      </>
                    ) : (
                      t("product.instock")
                    )
                  ) : (
                    t("product.soldout")
                  )}
                </p>

                {variants.length > 1 && (
                  <fieldset className="mt-6">
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
                          className={`font-num min-h-11 min-w-11 rounded-2xl border px-4 text-sm transition-all duration-250 ease-[var(--ease-out-soft)] disabled:opacity-40 ${
                            variant?.id === v.id
                              ? "border-pink bg-pink text-primary-foreground"
                              : "border-border bg-surface/60 text-foreground hover:border-pink hover:text-pink"
                          }`}
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

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

                {variant && variant.selectedOptions.length > 0 && (
                  <dl className="mt-8 divide-y divide-border border-t border-border text-sm">
                    {variant.selectedOptions.map((opt) => (
                      <div
                        key={opt.name}
                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-3"
                      >
                        <dt className="label-xs pt-0.5 text-muted-foreground">{opt.name}</dt>
                        <dd className="text-right">{opt.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>

            <div className="glass-bar sticky bottom-0 z-10 grid gap-3 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:px-8">
              <button
                type="button"
                disabled={!variant?.availableForSale || loading}
                onClick={async () => {
                  await addToCart();
                  onClose();
                  open();
                }}
                className="label-xs rounded-full border border-pink-mist bg-pink-mist/50 py-4 text-pink transition-colors duration-250 hover:bg-pink hover:text-primary-foreground disabled:opacity-50"
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
                className="label-xs rounded-full bg-pink py-4 text-primary-foreground transition-colors duration-250 hover:bg-pink-deep disabled:opacity-50"
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
