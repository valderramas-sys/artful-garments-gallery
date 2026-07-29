import { useCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView: (product: Product) => void;
}) {
  const { add } = useCart();

  return (
    <article className="group">
      <button
        type="button"
        onClick={() => onQuickView(product)}
        aria-label={`Quick view ${product.name}`}
        className="block w-full overflow-hidden rounded-sm bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={1024}
          height={1280}
          className="aspect-4/5 w-full object-cover transition-transform duration-[600ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.025]"
        />
      </button>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <h2 className="truncate text-sm font-bold tracking-tight">{product.name}</h2>
        <p className="shrink-0 text-sm font-semibold text-muted-foreground">
          {formatPrice(product.price)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => add(product)}
        className="label-xs mt-3 w-full rounded-full border border-pink-mist bg-pink-mist/50 py-2.5 text-pink transition-all duration-250 ease-[var(--ease-out-soft)] hover:bg-pink hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink active:scale-[0.99]"
      >
        Add to cart
      </button>
    </article>
  );
}
