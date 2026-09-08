import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/shopify";
import { BubbleField } from "@/components/bubbles/BubbleField";
import { useI18n } from "@/lib/i18n";
import { reactRobot } from "@/stores/robotStore";

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shopify", "products"],
    queryFn: () => fetchProducts(50),
    staleTime: 1000 * 60 * 5,
  });

  const products = data ?? [];

  useEffect(() => {
    if (isLoading) reactRobot("searching");
  }, [isLoading]);

  return (
    <main className="animate-fade-in relative flex min-h-svh w-full flex-col items-center justify-center px-4 pt-[calc(var(--header-h)+2.5rem)] pb-28 sm:px-8 lg:px-12">
      <h1 className="sr-only">RHYTMO products</h1>
      <div className="mx-auto w-full max-w-[1800px]">
        <p className="mb-20 text-center text-[11px] leading-none tracking-[0.2em] text-white/90 uppercase sm:text-xs">
          Rhytmo X Paradela Beanies Collab.
        </p>

        {isLoading && (
          <div className="bubble-track mx-auto flex w-full flex-nowrap items-center justify-start sm:justify-center gap-10 px-8 py-10 sm:gap-16 sm:px-12 lg:gap-20 lg:px-16 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bubble-size relative shrink-0 animate-pulse rounded-full bg-white/5"
              />
            ))}
          </div>
        )}

        {!isLoading && (isError || products.length === 0) && (
          <p className="py-24 text-center text-sm text-white">
            {isError ? "Products could not be loaded right now." : t("cart.empty")}
          </p>
        )}

        {products.length > 0 && <BubbleField products={products} />}
      </div>
    </main>
  );
}
