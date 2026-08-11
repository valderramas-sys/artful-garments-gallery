import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useCartStore } from "@/stores/cartStore";
import {
  productImage,
  sizedImage,
  type ShopifyProduct,
  type ShopifyVariant,
} from "@/lib/shopify";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { buildCheckoutUrl } from "@/lib/commerce";
import { playTap, playSwipe, playModalClose } from "@/lib/sound";


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

function SpecText({ text }: { text: string }) {
  if (!text.includes("@paradela")) return <>{text}</>;
  const [before] = text.split("@paradela");
  return (
    <>
      {before}
      <ParadelaLink />
    </>
  );
}

export function QuickView({
  product,
  onClose,
}: {
  product: ShopifyProduct | null;
  onClose: () => void;
}) {
  const { t, product: content, localize, lang } = useI18n();
  const { formatFrom, currency } = useCurrency();
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

  // Close paths that should play the SFX (everything except "Add to Cart").
  const closeWithSound = () => {
    playModalClose();
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isOpen) return;
      playModalClose();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isOpen]);

  const variant: ShopifyVariant | undefined =
    variants.find((v) => v.id === variantId) ?? variants[0];
  const maxQty = 10;
  const image = product ? productImage(product) : null;

  // Primary Shopify photo first, brand editorial photo second.
  const gallery = useMemo(() => {
    const list: string[] = [];
    if (image) list.push(image);
    const second = product ? secondPhoto(product.node.title, product.node.handle) : null;
    if (second) list.push(second);
    return list;
  }, [image, product]);

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    setSlide(0);
  }, [product]);

  const goSlide = (dir: number) => {
    if (gallery.length < 2) return;
    setSlide((s) => {
      const next = Math.min(gallery.length - 1, Math.max(0, s + dir));
      if (next !== s) playSwipe();
      return next;
    });
  };

  const swipe = useRef({ x: 0, active: false, fired: false });
  const onSwipeDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, active: true, fired: false };
  };
  const onSwipeMove = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!s.active || s.fired) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40) {
      s.fired = true;
      goSlide(dx < 0 ? 1 : -1);
    }
  };
  const endSwipe = () => {
    swipe.current.active = false;
  };


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
        onClick={closeWithSound}
        aria-hidden
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[8px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product?.node.title ?? "Product"}
        className={`aero-glass relative z-10 flex max-h-[94svh] w-full max-w-[1180px] flex-col overflow-hidden rounded-t-3xl transition-all duration-300 ease-[var(--ease-out-soft)] sm:max-h-[92svh] sm:rounded-3xl ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-100 opacity-0 sm:scale-[0.98]"
        }`}
      >
        {product && (
          <>
            <button
              type="button"
              onClick={closeWithSound}
              aria-label={t("cart.close")}
              className="glass-btn absolute top-3 right-3 z-20 grid h-9 w-9 place-items-center rounded-full sm:top-5 sm:right-5"
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

            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain px-5 pt-5 pb-5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-9 sm:overflow-hidden sm:px-8 sm:py-8 lg:gap-12 lg:px-10">
              {/* Image */}
              <div className="card-float min-w-0">
                {image ? (
                  <img
                    src={sizedImage(image, 1000) ?? image}
                    width={800}
                    height={1000}
                    alt={product.node.title}
                    loading="lazy"
                    className="max-h-[36svh] w-full rounded-2xl bg-surface object-cover sm:max-h-[74svh] sm:aspect-4/5"
                  />
                ) : (
                  <div className="card-float-media max-h-[36svh] w-full rounded-2xl bg-surface-2 sm:aspect-4/5" />
                )}
              </div>

              {/* Details */}
              <div className="flex min-w-0 flex-col sm:max-h-[74svh] sm:overflow-y-auto sm:overscroll-contain sm:pr-1">
                <p className="label-xs text-ink">
                  {t("product.collab")}: RHYTMO × <ParadelaLink />
                </p>

                <h2 className="font-display mt-2 text-2xl leading-[1.05] tracking-tight uppercase sm:text-3xl lg:text-4xl">
                  {localize(product.node.title)}
                </h2>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <p className="font-num text-xl sm:text-2xl text-ink">
                    {variant
                      ? formatFrom(Number(variant.price.amount), variant.price.currencyCode)
                      : formatFrom(
                          Number(product.node.priceRange.minVariantPrice.amount),
                          product.node.priceRange.minVariantPrice.currencyCode,
                        )}
                  </p>
                  <span
                    className={`label-xs ${
                      variant?.availableForSale ? "text-ink" : "text-pink-deep"
                    }`}
                  >
                    {variant?.availableForSale ? t("product.instock") : t("product.soldout")}
                  </span>
                </div>

                <p className="mt-4 max-w-[52ch] text-[0.8125rem] leading-relaxed text-ink">
                  {content.overview}
                </p>

                {/* Size + quantity share one row */}
                <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
                  {variants.length > 1 && (
                    <fieldset className="min-w-0">
                      <legend className="label-xs text-ink">
                        {product.node.options[0]?.name ?? t("cart.size")}
                      </legend>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setVariantId(v.id)}
                            aria-pressed={variant?.id === v.id}
                            disabled={!v.availableForSale}
                            className={`font-num min-h-10 min-w-10 rounded-2xl px-3.5 text-sm disabled:opacity-40 ${
                              variant?.id === v.id ? "glass-btn-accent" : "glass-btn"
                            }`}
                          >
                            {v.title}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  <div className="min-w-0">
                    <span className="label-xs text-ink">{t("product.quantity")}</span>
                    <div className="glass-soft mt-2.5 flex w-fit items-center gap-1 rounded-2xl p-1">
                      <button
                        type="button"
                        aria-label={`− ${t("product.quantity")}`}
                        onClick={() => {
                          playTap();
                          setQuantity((q) => Math.max(1, q - 1));
                        }}
                        className="grid h-10 w-10 place-items-center rounded-xl text-brand-blue transition-colors duration-250 hover:bg-pink-mist/60"
                      >
                        −
                      </button>
                      <span className="font-num w-8 text-center text-sm">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`+ ${t("product.quantity")}`}
                        onClick={() => {
                          playTap();
                          setQuantity((q) => Math.min(maxQty, q + 1));
                        }}
                        className="grid h-10 w-10 place-items-center rounded-xl text-brand-blue transition-colors duration-250 hover:bg-pink-mist/60"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specs + care side by side */}
                <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2 sm:gap-8">
                  <section className="min-w-0">
                    <h3 className="label-xs text-ink">{t("product.specs")}</h3>
                    <ul className="mt-2.5 space-y-1.5 text-[0.75rem] leading-relaxed text-ink">
                      {content.specs.map((spec) => (
                        <li key={spec} className="grid grid-cols-[8px_minmax(0,1fr)] gap-2.5">
                          <span aria-hidden className="text-pink">
                            •
                          </span>
                          <span>
                            <SpecText text={spec} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="min-w-0">
                    <h3 className="label-xs text-ink">{t("product.care")}</h3>
                    <ul className="mt-2.5 space-y-1.5 text-[0.75rem] leading-relaxed text-ink">
                      {content.care.map((item) => (
                        <li key={item} className="grid grid-cols-[8px_minmax(0,1fr)] gap-2.5">
                          <span aria-hidden className="text-pink">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="label-xs mt-4 text-ink">{t("product.shipping")}</h3>
                    <p className="mt-2.5 text-[0.75rem] leading-relaxed text-ink">
                      {content.shipping}
                    </p>
                  </section>
                </div>

                <ShippingCalculator variantId={variant?.id} quantity={quantity} />
              </div>
            </div>

            <div className="glass-bar sticky bottom-0 z-10 grid gap-3 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:px-8 lg:px-10">
              <button
                type="button"
                disabled={!variant?.availableForSale || loading}
                onClick={async () => {
                  playTap();
                  await addToCart();
                  onClose();
                  open();
                }}
                className="glass-btn-ink label-xs rounded-full px-4 py-3.5 leading-tight break-words whitespace-normal disabled:opacity-50"
              >
                {t("product.add")}
              </button>
              <button
                type="button"
                disabled={!variant?.availableForSale || loading}
                onClick={async () => {
                  playTap();
                  await addToCart();
                  const url = buildCheckoutUrl(
                    useCartStore.getState().checkoutUrl ?? checkoutUrl,
                    { currency, lang },
                  );
                  if (url) window.location.href = url;
                }}
                className="glass-btn-go label-xs rounded-full px-4 py-3.5 leading-tight break-words whitespace-normal disabled:opacity-50"
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
