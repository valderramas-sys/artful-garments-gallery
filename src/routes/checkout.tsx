import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

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
  "w-full rounded-sm border border-border bg-surface/60 px-5 py-4 text-base outline-none transition-colors duration-250 placeholder:text-muted-foreground focus:border-pink focus:bg-background";

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const [placed, setPlaced] = useState(false);

  if (placed) {
    return (
      <main className="mx-auto flex min-h-[80svh] max-w-[1600px] flex-col justify-center px-5 pt-32 pb-24 sm:px-8">
        <h1 className="display text-[12vw] leading-[0.84] sm:text-[6vw]">
          Order<span className="text-pink">.</span>
        </h1>
        <p className="mt-6 max-w-[46ch] text-sm text-muted-foreground">
          Thank you. A confirmation is on its way. Each piece is packed by hand in the studio.
        </p>
        <Link to="/shop" className="label-xs mt-10 w-fit text-pink transition-opacity duration-250 hover:opacity-70">
          Back to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-5 pt-32 pb-24 sm:px-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-6">
        <h1 className="display text-[12vw] leading-[0.84] sm:text-[6vw]">Checkout</h1>
        <Link to="/shop" className="label-xs pb-2 text-muted-foreground transition-colors duration-250 hover:text-pink">
          Back
        </Link>
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
          <input id="email" type="email" required placeholder="Email" className={fieldClass} />
          <label className="label-xs mt-6 text-muted-foreground" htmlFor="name">
            Shipping
          </label>
          <input id="name" required placeholder="Full name" className={fieldClass} />
          <input required placeholder="Address" className={fieldClass} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input required placeholder="City" className={fieldClass} />
            <input required placeholder="Postal code" className={fieldClass} />
          </div>
          <label className="label-xs mt-6 text-muted-foreground" htmlFor="card">
            Payment
          </label>
          <input id="card" required placeholder="Card number" className={fieldClass} />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="MM / YY" className={fieldClass} />
            <input required placeholder="CVC" className={fieldClass} />
          </div>
          <button
            type="submit"
            disabled={lines.length === 0}
            className="label-xs mt-8 rounded-full bg-pink py-5 text-primary-foreground transition-colors duration-250 hover:bg-pink-deep disabled:bg-surface-2 disabled:text-muted-foreground"
          >
            Place order — {formatPrice(subtotal)}
          </button>
        </form>

        <aside className="h-fit rounded-sm bg-surface/70 p-6 sm:p-8">
          <h2 className="label-xs text-muted-foreground">Summary</h2>
          {lines.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="mt-8 divide-y divide-border">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-4 py-5">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-4/5 w-full rounded-sm object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Qty {quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-pink">
                    {formatPrice(product.price * quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <span className="label-xs text-muted-foreground">Total</span>
            <span className="text-lg font-bold tracking-tight">{formatPrice(subtotal)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
