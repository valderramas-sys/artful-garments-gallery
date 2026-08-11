import { createFileRoute } from "@tanstack/react-router";
import { CategoryWheel } from "@/components/wheel/CategoryWheel";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Lab — RHYTMO" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Experimental navigation interface." },
      { property: "og:title", content: "Lab — RHYTMO" },
      { property: "og:description", content: "Experimental navigation interface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lab,
});

function Lab() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-24">
      <h1 className="sr-only">RHYTMO experimental navigation wheel</h1>
      <div className="relative z-10 flex flex-col items-center">
        <CategoryWheel />
        <SwipeHint className="pointer-events-none mt-4 sm:mt-6" />
      </div>
    </main>
  );
}

