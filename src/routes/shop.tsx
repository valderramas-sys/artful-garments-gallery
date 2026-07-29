import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { products, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { QuickView } from "@/components/QuickView";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — RHYTMO" },
      {
        name: "description",
        content: "The current RHYTMO release. Limited pieces in technical cotton, nylon and film.",
      },
      { property: "og:title", content: "Shop — RHYTMO" },
      { property: "og:description", content: "The current RHYTMO release. Limited pieces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const [active, setActive] = useState<Product | null>(null);

  return (
    <main className="animate-fade-in mx-auto max-w-[1600px] px-6 pt-28 pb-32 sm:px-10 lg:px-16">
      <h1 className="sr-only">RHYTMO products</h1>
      <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-10 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={setActive} />
        ))}
      </div>
      <QuickView product={active} onClose={() => setActive(null)} />
    </main>
  );
}
