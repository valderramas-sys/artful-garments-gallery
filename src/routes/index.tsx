import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import backdrop from "@/assets/windows_xp_31.jpg.asset.json";

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
    links: [{ rel: "preload", as: "image", href: backdrop.url, fetchpriority: "high" }],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    setLeaving(true);
    window.setTimeout(() => navigate({ to: "/shop" }), 380);
  };

  return (
    <main
      data-leaving={leaving}
      className="relative h-[100svh] w-full overflow-hidden opacity-100 transition-all duration-[380ms] ease-[var(--ease-out-soft)] data-[leaving=true]:scale-[1.03] data-[leaving=true]:opacity-0"
    >
      <h1 className="sr-only">RHYTMO</h1>
      <img
        src={backdrop.url}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 grid place-items-center">
        <button
          type="button"
          onClick={enter}
          className="rounded-full border border-white/40 bg-white/15 px-14 py-5 text-[0.6875rem] font-semibold tracking-[0.32em] text-white uppercase backdrop-blur-md transition-all duration-250 ease-[var(--ease-out-soft)] hover:scale-[1.03] hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.99]"
        >
          Shop
        </button>
      </div>
    </main>
  );
}
