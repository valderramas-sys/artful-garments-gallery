import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { cartSubtotal, useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — RHYTMO" },
      {
        name: "description",
        content: "Review your RHYTMO order and continue to secure checkout.",
      },
      { property: "og:title", content: "Checkout — RHYTMO" },
      { property: "og:description", content: "Review your RHYTMO order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { t } = useI18n();
  const { formatFrom } = useCurrency();
  const lines = useCartStore((s) => s.lines);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const currencyCode = lines[0]?.currencyCode ?? "BRL";
  const subtotal = cartSubtotal(lines);

  return (
    <main className="mx-auto max-w-[1600px] px-5 pt-32 pb-24 sm:px-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-6">
        <h1 className="display text-[12vw] leading-[0.84] sm:text-[6vw]">{t("checkout.title")}</h1>
        <div className="flex items-center gap-4 pb-2">
          <CurrencySelector />
          <Link
            to="/shop"
            className="glass-btn label-xs rounded-full px-4 py-2"
          >
            {t("checkout.back")}
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-24">
        <section>
          <h2 className="label-xs text-muted-foreground">{t("checkout.summary")}</h2>

          {lines.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">{t("cart.empty")}</p>
          ) : (
            <ul className="mt-8 divide-y divide-border">
              {lines.map((line) => (
                <li
                  key={line.lineId}
                  className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-5 py-6"
                >
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
                    <p className="text-sm leading-snug font-bold tracking-tight">{line.title}</p>
                    {line.variantTitle && line.variantTitle !== "Default Title" && (
                      <p className="label-xs mt-1 text-muted-foreground">{line.variantTitle}</p>
                    )}
                    <div className="mt-4 flex items-center gap-4">
                      <div className="glass-soft flex items-center gap-3 rounded-full px-3 py-1.5">
                        <button
                          type="button"
                          aria-label={`- ${line.title}`}
                          onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                          className="text-sm text-pink transition-opacity duration-250 hover:opacity-70"
                        >
                          −
                        </button>
                        <span className="font-num w-4 text-center text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`+ ${line.title}`}
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
                  <p className="font-num text-sm text-pink">
                    {formatFrom(line.price * line.quantity, line.currencyCode)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="aero-glass h-fit rounded-3xl p-6 sm:p-8">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("cart.subtotal")}</dt>
              <dd className="font-num">{formatFrom(subtotal, currencyCode)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("checkout.shipping")}</dt>
              <dd className="text-muted-foreground">—</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("checkout.tax")}</dt>
              <dd className="text-muted-foreground">—</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <dt className="label-xs text-muted-foreground">{t("checkout.total")}</dt>
              <dd className="font-num text-lg">{formatFrom(subtotal, currencyCode)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Shipping and taxes are calculated in the secure checkout.
          </p>

          <a
            href={checkoutUrl ?? "#"}
            aria-disabled={lines.length === 0 || !checkoutUrl}
            className={`label-xs mt-8 flex w-full items-center justify-center rounded-full py-5 transition-colors duration-250 ${
              lines.length === 0 || !checkoutUrl
                ? "pointer-events-none bg-surface-2 text-muted-foreground"
                : "glass-btn-primary"
            }`}
          >
            {t("checkout.place")}
          </a>

          <Link
            to="/shop"
            className="glass-btn label-xs mt-4 flex w-full items-center justify-center rounded-full py-3"
          >
            {t("checkout.backshop")}
          </Link>
        </aside>
      </div>
    </main>
  );
}
