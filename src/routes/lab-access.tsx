import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockAdmin } from "@/lib/admin-gate.functions";

export const Route = createFileRoute("/lab-access")({
  head: () => ({
    meta: [
      { title: "Restricted — RHYTMO" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Restricted area." },
      { property: "og:title", content: "Restricted — RHYTMO" },
      { property: "og:description", content: "Restricted area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LabAccess,
});

function LabAccess() {
  const navigate = useNavigate();
  const unlock = useServerFn(unlockAdmin);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await unlock({ data: { password } });
    setBusy(false);
    if (res.ok) await navigate({ to: "/lab" });
    else setError(true);
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <form onSubmit={onSubmit} className="aero-glass w-full max-w-sm rounded-3xl p-8">
        <h1 className="display text-lg tracking-[0.16em] uppercase">Restricted</h1>
        <p className="mt-2 text-xs text-muted-foreground">Administrator access only.</p>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="glass-soft mt-6 w-full rounded-full px-5 py-3 text-sm outline-none"
          placeholder="Password"
        />
        {error && <p className="mt-3 text-xs text-brand-magenta">Incorrect password.</p>}
        <button
          type="submit"
          disabled={busy}
          className="glass-btn-go mt-5 w-full rounded-full px-5 py-3 text-xs tracking-[0.18em] uppercase disabled:opacity-60"
        >
          {busy ? "Checking" : "Enter"}
        </button>
      </form>
    </main>
  );
}
