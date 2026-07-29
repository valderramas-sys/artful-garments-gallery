import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/products";

export function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { add } = useCart();
  const isOpen = Boolean(product);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-80 flex items-center justify-center p-4 transition-opacity duration-300 ease-[var(--ease-out-soft)] ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div onClick={onClose} aria-hidden className="absolute inset-0 bg-foreground/15 backdrop-blur-[3px]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ?? "Product"}
        className={`aero-glass relative z-10 grid w-full max-w-[880px] gap-8 overflow-hidden rounded-2xl p-5 transition-all duration-300 ease-[var(--ease-out-soft)] sm:grid-cols-2 sm:p-8 ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        {product && (
          <>
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              width={1024}
              height={1280}
              className="aspect-4/5 w-full rounded-xl bg-surface object-cover"
            />
            <div className="flex min-w-0 flex-col justify-center">
              <p className="label-xs text-muted-foreground">{product.index}</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{product.material}</p>
              <p className="mt-6 text-lg font-semibold">{formatPrice(product.price)}</p>
              <button
                type="button"
                onClick={() => {
                  add(product);
                  onClose();
                }}
                className="label-xs mt-8 rounded-full bg-pink py-4 text-primary-foreground transition-all duration-250 ease-[var(--ease-out-soft)] hover:bg-pink-deep active:scale-[0.99]"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={onClose}
                className="label-xs mt-4 text-muted-foreground transition-colors duration-250 hover:text-pink"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
