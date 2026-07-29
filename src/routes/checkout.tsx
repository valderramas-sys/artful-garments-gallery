import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { CurrencySelector } from "@/components/CurrencySelector";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — RHYTMO" },
      {
        name: "description",
        content: "Complete your RHYTMO order. Secure, minimal checkout.",
      },
      { property: "og:title", content: "Checkout — RHYTMO" },
      { property: "og:description", content: "Complete your RHYTMO order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const fieldClass =
  "w-full rounded-2xl border border-border bg-surface/60 px-5 py-4 text-base outline-none transition-colors duration-250 placeholder:text-muted-foreground focus:border-pink focus:bg-background";

/** Free shipping above this subtotal (BRL). */
const FREE_SHIPPING_FROM = 1500;
const SHIPPING_FLAT = 39.9;
const TAX_RATE = 0.05;

function Checkout() {
  const { t } = useI18n();
  const { lines, subtotal, clear } = useCart();
  const { format } = useCurrency();
  const [placed, setPlaced] = useState(false);

  const shipping = lines.length === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  if (placed) {
    return (
      <main className="mx-auto flex min-h-[80svh] max-w-[1600px] flex-col justify-center px-5 pt-32 pb-24 sm:px-8">
        <h1 className="display text-[12vw] leading-[0.84] sm:text-[6vw]">
          Order<span className="text-pink">.</span>
        </h1>
        <p className="mt-6 max-w-[46ch] text-sm text-muted-foreground">
          {t("checkout.thanks")}
        </p>
        <Link
          to="/shop"
          className="label-xs mt-10 w-fit text-pink transition-opacity duration-250 hover:opacity-70"
        >
          {t("checkout.backshop")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-5 pt-32 pb-24 sm:px-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-6">
        <h1 className="display text-[12vw] leading-[0.84] sm:text-[6vw]">{t("checkout.title")}</h1>
        <div className="flex items-center gap-4 pb-2">
          <CurrencySelector />
          <Link
            to="/shop"
            className="label-xs text-muted-foreground transition-colors duration-250 hover:text-pink"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-24">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            clear();
            setPlaced(true);
          }}
        >
          <label className="label-xs text-muted-foreground" htmlFor="email">
            Contact
          </label>
          <input id="email" type="email" required placeholder={t("checkout.email")} className={fieldClass} />
          <label className="label-xs mt-6 text-muted-foreground" htmlFor="name">
            Shipping
          </label>
          <input id="name" required placeholder={t("checkout.name")} className={fieldClass} />
          <input required placeholder={t("checkout.address")} className={fieldClass} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input required placeholder={t("checkout.city")} className={fieldClass} />
            <input required placeholder={t("checkout.postal")} className={`font-num ${fieldClass}`} />
          </div>
          <label className="label-xs mt-6 text-muted-foreground" htmlFor="card">
            Payment
          </label>
          <input
            id="card"
            required
            placeholder={t("checkout.card")}
            className={`font-num ${fieldClass}`}
          />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="MM / YY" className={`font-num ${fieldClass}`} />
            <input required placeholder="CVC" className={`font-num ${fieldClass}`} />
          </div>
          <button
            type="submit"
            disabled={lines.length === 0}
            className="label-xs mt-8 rounded-full bg-pink py-5 text-primary-foreground transition-colors duration-250 hover:bg-pink-deep disabled:bg-surface-2 disabled:text-muted-foreground"
          >
            {t("checkout.place")} — <span className="font-num">{format(total)}</span>
          </button>
        </form>

        <aside className="h-fit rounded-3xl bg-surface/70 p-6 sm:p-8">
          <h2 className="label-xs text-muted-foreground">{t("checkout.summary")}</h2>
          {lines.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">{t("cart.empty")}</p>
          ) : (
            <ul className="mt-8 divide-y divide-border">
              {lines.map(({ key, product, quantity, size }) => (
                <li key={key} className="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-4 py-5">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-4/5 w-full rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Qty <span className="font-num">{quantity}</span>
                      {size && (
                        <>
                          {" · Size "}
                          <span className="font-num">{size}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <p className="font-num text-sm text-pink">{format(product.price * quantity)}</p>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("cart.subtotal")}</dt>
              <dd className="font-num">{format(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("checkout.shipping")}</dt>
              <dd className="font-num">{shipping === 0 ? "Free" : format(shipping)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="label-xs text-muted-foreground">{t("checkout.tax")}</dt>
              <dd className="font-num">{format(tax)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <dt className="label-xs text-muted-foreground">{t("checkout.total")}</dt>
              <dd className="font-num text-lg">{format(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
