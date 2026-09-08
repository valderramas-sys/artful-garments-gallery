import { createFileRoute } from "@tanstack/react-router";
import { CategoryWheel } from "@/components/wheel/CategoryWheel";
import { SwipeHint } from "@/components/SwipeHint";

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
    <main className="game-menu relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-20 sm:px-8">
      <h1 className="sr-only">RHYTMO experimental navigation wheel</h1>
      <div className="game-hud game-hud-top" aria-hidden>
        <div className="game-brand-lockup">
          <span className="game-brand-mark">R</span>
          <span>
            <strong>RHYTMO</strong>
            <small>PLAYER MENU</small>
          </span>
        </div>
        <div className="game-status">
          <span className="game-status-dot" />
          <span>ONLINE</span>
          <b>01</b>
        </div>
      </div>
      <div className="game-menu-title" aria-hidden>
        <span>MAIN MENU</span>
        <i />
        <small>SELECT YOUR DESTINATION</small>
      </div>
      <div className="relative z-10 flex w-full flex-col items-center">
        <CategoryWheel />
        <SwipeHint className="game-swipe-hint pointer-events-none mt-7 sm:mt-9" />
      </div>
      <div className="game-hud game-hud-bottom" aria-hidden>
        <span>SCROLL / DRAG TO NAVIGATE</span>
        <span className="game-hud-divider" />
        <span>RHYTMO.EXE // 2026</span>
      </div>
    </main>
  );
}
