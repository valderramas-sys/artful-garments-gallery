import { products } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { useReveal } from "@/hooks/use-reveal";

export function ProductGrid() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section id="shop" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 pb-32 sm:px-8">
      <div
        ref={ref}
        data-visible={visible}
        className="reveal grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-6"
      >
        <h2 className="display text-[13vw] leading-[0.84] sm:text-[7vw]">Objects</h2>
        <p className="label-xs pb-2 text-muted-foreground">04 pieces</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} delay={i * 80} />
        ))}
      </div>
    </section>
  );
}
