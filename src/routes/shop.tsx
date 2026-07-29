import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/ProductCard";
import { QuickView } from "@/components/QuickView";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [active, setActive] = useState<ShopifyProduct | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shopify", "products"],
    queryFn: () => fetchProducts(50),
    staleTime: 1000 * 60 * 5,
  });

  const products = data ?? [];

  return (
    <main className="animate-fade-in mx-auto max-w-[1600px] px-6 pt-28 pb-32 sm:px-10 lg:px-16">
      <h1 className="sr-only">RHYTMO products</h1>

      {isLoading && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-10 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-4/5 w-full rounded-3xl bg-surface" />
              <div className="mt-4 h-3 w-2/3 rounded-full bg-surface" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (isError || products.length === 0) && (
        <p className="py-24 text-center text-sm text-muted-foreground">
          {isError ? "Products could not be loaded right now." : t("cart.empty")}
        </p>
      )}

      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-10 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.node.id} product={product} onQuickView={setActive} />
          ))}
        </div>
      )}

      <QuickView product={active} onClose={() => setActive(null)} />
    </main>
  );
}
