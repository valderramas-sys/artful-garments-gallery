import { useState } from "react";
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
  const { t, localize } = useI18n();
  const { formatFrom } = useCurrency();
  const lines = useCartStore((s) => s.lines);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyDiscount = useCartStore((s) => s.applyDiscount);
  const discountCodes = useCartStore((s) => s.discountCodes);
  const cost = useCartStore((s) => s.cost);
  const loading = useCartStore((s) => s.loading);
  const [code, setCode] = useState("");

  const appliedCode = discountCodes.find((d) => d.applicable);
  const rejectedCode = discountCodes.find((d) => !d.applicable);
  const shopifyCheckoutUrl = checkoutUrl
    ? `${checkoutUrl}${checkoutUrl.includes("?") ? "&" : "?"}channel=online_store`
    : null;

  const currencyCode = lines[0]?.currencyCode ?? "BRL";
  const subtotal = cartSubtotal(lines);

  return (
    <main className="mx-auto max-w-[1600px] px-5 pt-32 pb-24 sm:px-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="display text-[14vw] leading-[0.84] sm:text-[6vw]">{t("checkout.title")}</h1>
        <div className="flex flex-wrap items-center gap-3 sm:pb-2">
          <CurrencySelector />
          <Link to="/shop" className="glass-btn label-xs rounded-full px-4 py-2">
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
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-5"
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
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-snug font-bold tracking-tight">
                        {localize(line.title)}
                      </p>
                      <p className="font-num text-sm text-pink sm:hidden">
                        {formatFrom(line.price * line.quantity, line.currencyCode)}
                      </p>
                    </div>
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
                  <p className="font-num hidden text-sm text-pink sm:block">
                    {formatFrom(line.price * line.quantity, line.currencyCode)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="aero-glass h-fit rounded-3xl p-6 sm:p-8 lg:sticky lg:top-28">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyDiscount(code.trim());
            }}
            className="mb-7 flex flex-col gap-3 border-b border-border pb-7 sm:flex-row"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("checkout.discount")}
              aria-label={t("checkout.discount")}
              className="glass-soft min-h-11 w-full rounded-full px-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="glass-btn label-xs min-h-11 rounded-full px-5 disabled:opacity-50"
            >
              {t("checkout.apply")}
            </button>
          </form>
          {appliedCode && (
            <p className="label-xs mb-5 text-pink">
              {t("checkout.discountapplied")}: {appliedCode.code}
            </p>
          )}
          {!appliedCode && rejectedCode && (
            <p className="label-xs mb-5 text-muted-foreground">{t("checkout.discountinvalid")}</p>
          )}

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("cart.subtotal")}</dt>
              <dd className="font-num">
                {formatFrom(
                  cost ? Number(cost.subtotalAmount.amount) : subtotal,
                  cost?.subtotalAmount.currencyCode ?? currencyCode,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("checkout.shipping")}</dt>
              <dd className="text-muted-foreground">—</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("checkout.tax")}</dt>
              <dd className={cost?.totalTaxAmount ? "font-num" : "text-muted-foreground"}>
                {cost?.totalTaxAmount
                  ? formatFrom(
                      Number(cost.totalTaxAmount.amount),
                      cost.totalTaxAmount.currencyCode,
                    )
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <dt className="label-xs text-muted-foreground">{t("checkout.total")}</dt>
              <dd className="font-num text-lg">
                {formatFrom(
                  cost ? Number(cost.totalAmount.amount) : subtotal,
                  cost?.totalAmount.currencyCode ?? currencyCode,
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {t("checkout.securenote")}
          </p>

          <a
            href={shopifyCheckoutUrl ?? "#"}
            aria-disabled={lines.length === 0 || !shopifyCheckoutUrl}
            className={`label-xs mt-8 flex w-full items-center justify-center rounded-full px-4 py-5 text-center leading-tight break-words whitespace-normal transition-colors duration-250 ${
              lines.length === 0 || !shopifyCheckoutUrl
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
