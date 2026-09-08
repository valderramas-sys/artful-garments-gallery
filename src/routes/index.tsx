import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { playClick } from "@/lib/sound";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";

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
    playClick();
    setLeaving(true);
    window.setTimeout(() => navigate({ to: "/lab" }), 380);
  };

  return (
    <main
      data-leaving={leaving}
      data-entered={entered}
      className="relative h-[100svh] w-full overflow-hidden opacity-0 transition-all duration-[380ms] ease-[var(--ease-out-soft)] data-[entered=true]:opacity-100 data-[leaving=true]:scale-[1.03] data-[leaving=true]:opacity-0"
    >
      <h1 className="sr-only">RHYTMO</h1>

      <div className="absolute inset-0 z-0">
        <Backdrop variant="particles" />
      </div>

      <div className="game-start-screen absolute inset-0 z-10 grid place-items-center">
        <div className="game-start-panel">
          <div className="game-start-topline">
            <span>RHYTMO.EXE</span>
            <span>VER. 01.26</span>
          </div>
          <Logo className="game-start-logo-img mx-auto mt-[clamp(28px,5vw,48px)] w-[min(72cqw,460px)]" />
          <button type="button" onClick={enter} className="game-start-button">
            <span>PRESS START</span>
            <i aria-hidden />
          </button>
          <p className="game-start-note">ENTER THE RHYTHM</p>
        </div>
      </div>

      <div className="game-landing-hud" aria-hidden>
        <span>© 2026 RHYTMO</span>
        <span>PLAYER 01</span>
        <span>WEBSITE BY @THIAGOVSOUZA_</span>
      </div>

      {/* A opacidade aqui era `opacity-[0.08]` no container VEZES `opacity-50`
          em cada span — as duas se multiplicam, davam 0,04 no total, e o crédito
          ficava invisível na tela. Agora a discrição fica num lugar só.

          Sobrou uma linha só: o "Website designed by @valderramasvi" que ficava
          logo acima da faixa do HUD saiu a pedido. O crédito de assinatura do
          site continua no canto direito daquela faixa. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 text-[9px] leading-none tracking-[0.14em] text-white uppercase select-none sm:text-[10px]"
      >
        <span className="absolute top-20 left-6 opacity-[0.38] sm:top-24 sm:left-10 lg:left-14">
          © 2026 RHYTMO.
        </span>
      </div>
    </main>
  );
}
