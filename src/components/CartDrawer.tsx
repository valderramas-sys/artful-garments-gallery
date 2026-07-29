import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export function CartDrawer() {
  const { isOpen, close, lines, subtotal, setQuantity, remove } = useCart();

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
        className={`fixed inset-0 z-60 bg-foreground/10 backdrop-blur-[2px] transition-opacity duration-250 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Cart"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 z-70 flex h-full w-full max-w-[440px] flex-col bg-background transition-transform duration-[350ms] ease-[var(--ease-out-soft)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-6 py-5">
          <h2 className="label-xs">Cart</h2>
          <button
            type="button"
            onClick={close}
            className="label-xs text-muted-foreground transition-colors duration-250 hover:text-blue"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <p className="py-16 text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 py-6">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-4/5 w-full rounded-sm bg-surface object-cover"
                  />
                  <div className="min-w-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                      <h3 className="truncate text-sm font-bold tracking-tight">{product.name}</h3>
                      <p className="text-sm font-bold text-blue">
                        {formatPrice(product.price * quantity)}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full bg-surface px-3 py-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name}`}
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          className="text-sm text-muted-foreground transition-colors duration-250 hover:text-green"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-xs font-semibold">{quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name}`}
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          className="text-sm text-muted-foreground transition-colors duration-250 hover:text-green"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        className="label-xs text-muted-foreground transition-colors duration-250 hover:text-pink"
                      >
                        Remove
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
            <span className="label-xs text-muted-foreground">Subtotal</span>
            <span className="text-lg font-bold tracking-tight">{formatPrice(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={close}
            aria-disabled={lines.length === 0}
            className={`label-xs mt-5 flex w-full items-center justify-center rounded-full py-4 transition-colors duration-250 ${
              lines.length === 0
                ? "pointer-events-none bg-surface-2 text-muted-foreground"
                : "bg-green text-primary-foreground hover:bg-green-deep"
            }`}
          >
            Checkout
          </Link>
        </div>
      </aside>
    </>
  );
}
