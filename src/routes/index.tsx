import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import backdrop from "@/assets/hero.gif.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RHYTMO — Independent Streetwear Label" },
      {
        name: "description",
        content:
          "RHYTMO is an independent streetwear label. Enter the store to view the current release.",
      },
      { property: "og:title", content: "RHYTMO — Independent Streetwear Label" },
      { property: "og:description", content: "Enter the RHYTMO store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: backdrop.url, fetchPriority: "high" }],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const enter = () => {
    setLeaving(true);
    window.setTimeout(() => navigate({ to: "/shop" }), 380);
  };

  return (
    <main
      data-leaving={leaving}
      data-entered={entered}
      className="relative h-[100svh] w-full overflow-hidden bg-background opacity-0 transition-all duration-[380ms] ease-[var(--ease-out-soft)] data-[entered=true]:opacity-100 data-[leaving=true]:scale-[1.03] data-[leaving=true]:opacity-0"
    >
      <h1 className="sr-only">RHYTMO</h1>
      <img
        src={backdrop.url}
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 grid place-items-center">
        <button
          type="button"
          onClick={enter}
          className="font-hero aero-glass glass-sheen rounded-full px-12 py-5 text-base tracking-[0.18em] text-foreground uppercase sm:px-16 sm:text-lg transition-all duration-250 ease-[var(--ease-out-soft)] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.99]"
        >
          R H Y T M O
        </button>
      </div>
    </main>
  );
}
