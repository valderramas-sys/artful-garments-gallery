import { useEffect, useRef, useState } from "react";
import { AnimatedGif } from "@/components/AnimatedGif";
import { ROBOT_STATES } from "@/lib/robot/robotAnimations";
import { useRobotStore, reactRobot } from "@/stores/robotStore";
import { useRobotReactions } from "@/hooks/useRobotReactions";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { playClick, playPopupOpen } from "@/lib/sound";

const WELCOME_KEY = "rhytmo:robot-welcomed-session";

/**
 * Quanto tempo depois da montagem a fala de boas-vindas entra. Tem de vir
 * DEPOIS da animação de entrada (420ms de espera + 640ms de percurso, ver
 * `.robot-character` em styles.css), senão o balão abre enquanto o robô ainda
 * está subindo e a fala parece deslocada do personagem.
 */
const WELCOME_DELAY_MS = 1240;

/**
 * Personagem-assistente: fica fixado no canto inferior da tela, reage ao
 * carrinho (ver useRobotReactions) e se apresenta ao aparecer. Reaproveita a
 * linguagem visual retro já existente (balão de diálogo, frame, sombra)
 * definida em styles.css.
 *
 * Só é montado fora da "/" (ver __root.tsx), então montar É o momento em que
 * ele aparece — normalmente a chegada ao /lab, vindo do PRESS START. Por isso
 * a entrada não precisa de estado nem de gatilho de rota: é uma animação CSS
 * disparada na montagem.
 */
export function Robot() {
  const state = useRobotStore((s) => s.state);
  const speech = useRobotStore((s) => s.speech);
  const soundEnabled = useRobotStore((s) => s.soundEnabled);
  const toggleSound = useRobotStore((s) => s.toggleSound);

  const [bubbleOpen, setBubbleOpen] = useState(false);
  const bubbleTimer = useRef<number | undefined>(undefined);

  useRobotReactions();
  const reducedMotion = usePrefersReducedMotion();

  // Boas-vindas uma vez por sessão, logo depois da animação de entrada.
  // Era uma vez por NAVEGADOR (localStorage), o que fazia a apresentação
  // acontecer no primeiro carregamento em qualquer rota — na prática, na tela
  // de abertura — e nunca mais. sessionStorage devolve a apresentação a cada
  // visita sem transformá-la em pop-up a cada volta ao menu.
  // A marca é gravada quando a fala DISPARA, não quando o efeito roda: o efeito
  // é executado duas vezes na montagem (monta, limpa, monta de novo), e marcar
  // na primeira passagem fazia a segunda desistir por causa da própria marca —
  // o timer da primeira já tinha sido cancelado pelo cleanup, então as
  // boas-vindas simplesmente nunca aconteciam.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(WELCOME_KEY)) return;
    } catch {
      // Modo privado / storage bloqueado: apresenta mesmo assim.
    }
    const id = window.setTimeout(() => {
      try {
        sessionStorage.setItem(WELCOME_KEY, "1");
      } catch {
        /* idem */
      }
      reactRobot("welcome");
    }, WELCOME_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  // Balão de fala some sozinho após alguns segundos — nunca fica aberto.
  useEffect(() => {
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    if (!speech) {
      setBubbleOpen(false);
      return;
    }
    playPopupOpen();
    setBubbleOpen(true);
    bubbleTimer.current = window.setTimeout(() => setBubbleOpen(false), 3200);
    return () => {
      if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    };
  }, [speech]);

  const config = ROBOT_STATES[state];

  return (
    <div className="welcome-robot fixed bottom-0 left-0 z-30 select-none">
      <div className="relative">
        {/* Everything visual about the character (shadow/frame/art/sound
            toggle) lives in its own filtered wrapper. The drop-shadow filter
            used to sit on the outer `.relative` group, which — per the CSS
            spec — makes any `position: fixed` descendant resolve against
            *this* small box instead of the viewport. That silently broke
            the speech bubble's mobile layout (see `.retro-dialogue`'s fixed
            positioning below): it rendered ~150px wide instead of spanning
            the screen. Keeping the filter scoped to just the character
            elements lets the dialogue escape to the real viewport. */}
        <div className="robot-character">
          <div className="robot-pixel-shadow" aria-hidden />

          {reducedMotion ? (
            <img
              src={config.staticSrc}
              alt=""
              aria-hidden
              decoding="async"
              className="welcome-robot-image pointer-events-none relative z-10 h-auto w-[var(--robot-w)] object-contain [image-rendering:pixelated]"
            />
          ) : (
            <AnimatedGif
              key={config.src}
              src={config.src}
              className="welcome-robot-image pointer-events-none relative z-10 h-auto w-[var(--robot-w)] object-contain [image-rendering:pixelated]"
            />
          )}

          <button
            type="button"
            className="robot-sound-toggle"
            aria-label={soundEnabled ? "Desativar som" : "Ativar som"}
            aria-pressed={soundEnabled}
            onClick={() => {
              toggleSound();
              if (!soundEnabled) playClick();
            }}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>

        <div className={`retro-dialogue ${bubbleOpen ? "is-open" : ""}`} aria-live="polite">
          <div className="retro-dialogue-window">
            <div className="retro-dialogue-topbar">
              <span className="retro-dialogue-name">RHYTMO</span>
              <span className="retro-dialogue-type">BOT // {state.toUpperCase()}</span>
            </div>
            <div className="retro-dialogue-body">
              <span className="retro-dialogue-copy rhytmo-pixel-text">{speech}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
