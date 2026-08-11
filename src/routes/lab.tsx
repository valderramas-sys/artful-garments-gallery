import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CategoryWheel } from "@/components/wheel/CategoryWheel";
import { requireAdmin, lockAdmin } from "@/lib/admin-gate.functions";
import backdrop from "@/assets/hero.gif.asset.json";

export const Route = createFileRoute("/lab")({
  // Server-side gate: redirects to /lab-access unless the admin session cookie is valid.
  beforeLoad: async () => {
    const { admin } = await requireAdmin();
    if (!admin) throw redirect({ to: "/lab-access" });
  },
  head: () => ({
    meta: [
      { title: "Lab — RHYTMO" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Internal experimental interface." },
      { property: "og:title", content: "Lab — RHYTMO" },
      { property: "og:description", content: "Internal experimental interface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lab,
});

function Lab() {
  const navigate = useNavigate();
  const lock = useServerFn(lockAdmin);

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-24">
      <img
        src={backdrop.url}
        alt=""
        aria-hidden
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <h1 className="sr-only">RHYTMO experimental navigation wheel</h1>
      <div className="relative z-10">
        <CategoryWheel />
      </div>
      <button
        type="button"
        onClick={async () => {
          await lock();
          await navigate({ to: "/lab-access" });
        }}
        className="glass-btn absolute right-6 bottom-6 rounded-full px-4 py-2 text-[10px] tracking-[0.18em] uppercase"
      >
        Lock
      </button>
    </main>
  );
}
