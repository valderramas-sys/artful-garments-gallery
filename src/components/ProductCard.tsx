import { useCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/products";
import { useReveal } from "@/hooks/use-reveal";

export function ProductCard({ product, delay = 0 }: { product: Product; delay?: number }) {
  const { add } = useCart();
  const { ref, visible } = useReveal<HTMLElement>();

  return (
    <article
      ref={ref}
      data-visible={visible}
      className="reveal group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative overflow-hidden rounded-sm bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-250 group-hover:opacity-100"
          style={{ background: "var(--gradient-sheen)" }}
        />
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1280}
          className="aspect-4/5 w-full object-cover transition-transform duration-[700ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.035]"
        />
        <span className="label-xs absolute top-4 left-4 z-20 text-muted-foreground">
          {product.index}
        </span>
        <div className="absolute inset-x-3 bottom-3 z-20 translate-y-3 opacity-0 transition-all duration-250 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => add(product)}
            className="label-xs w-full rounded-full bg-green py-3.5 text-primary-foreground transition-colors duration-250 hover:bg-green-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            Add to cart
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold tracking-tight">{product.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{product.material}</p>
        </div>
        <p className="shrink-0 text-base font-bold tracking-tight text-blue">
          {formatPrice(product.price)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => add(product)}
        className="label-xs mt-4 w-full rounded-full border border-border py-3 transition-colors duration-250 hover:border-green hover:text-green sm:hidden"
      >
        Add to cart
      </button>
    </article>
  );
}
