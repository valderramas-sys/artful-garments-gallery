import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rhytmo — Autoral Streetwear, Vol. 01 Atmosphere" },
      {
        name: "description",
        content:
          "Rhytmo is an independent streetwear studio. Vol. 01 Atmosphere: four limited pieces in technical cotton, nylon and coated film.",
      },
      { property: "og:title", content: "Rhytmo — Autoral Streetwear, Vol. 01 Atmosphere" },
      {
        property: "og:description",
        content: "Four limited pieces. Technical cotton, nylon and coated film. Studio edition.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <ProductGrid />
    </>
  );
}
