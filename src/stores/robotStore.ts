import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ROBOT_STATES, type RobotState, type SpeechPolicy } from "@/lib/robot/robotAnimations";
import { pickPhrase, type RobotPhraseEvent } from "@/lib/robot/phrases";

type RobotStore = {
  state: RobotState;
  speech: string | null;
  soundEnabled: boolean;
  toggleSound: () => void;
  /**
   * Pede uma reação. Se já houver uma animação de prioridade igual ou maior
   * em andamento, o pedido é ignorado — garante que nunca haja duas
   * animações simultâneas e que o robô nunca fique "travado" trocando de
   * estado bruscamente (seção 22 do briefing).
   *
   * `phraseEvent` sobrepõe a frase padrão do estado — útil quando a mesma
   * animação (ex.: "processing") serve para eventos diferentes. `speech`
   * sobrepõe a política de fala do estado, pelo mesmo motivo: "processing" é
   * mudo por padrão, mas o checkout que o reaproveita precisa falar.
   */
  react: (state: RobotState, phraseEvent?: RobotPhraseEvent, speech?: SpeechPolicy) => void;
  returnToIdle: () => void;
};

let activePriority = 0;
let timer: number | undefined;

/**
 * Intervalo mínimo entre duas falas de política `sparing`.
 *
 * Animar é barato, falar não: o balão rouba a atenção da peça e some 3,2s
 * depois, então dois balões em sequência lêem como tagarelice. Com 45s o robô
 * comenta uma vez e depois acompanha em silêncio quem fica clicando de peça em
 * peça — que era exatamente a reclamação. Falas `always` (carrinho, checkout)
 * ignoram o intervalo, mas reiniciam a contagem: uma "boa escolha!!" não pode
 * ser seguida de um comentário de vitrine no clique seguinte.
 */
const SPEECH_COOLDOWN_MS = 45_000;
let lastSpokeAt = 0;

export const useRobotStore = create<RobotStore>()(
  persist(
    (set, get) => ({
      state: "idle",
      speech: null,
      soundEnabled: true,

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      react: (nextState, phraseEvent, speechPolicy) => {
        const config = ROBOT_STATES[nextState];
        if (nextState !== "idle" && config.priority < activePriority) return;

        if (timer) window.clearTimeout(timer);
        activePriority = config.priority;

        const event = phraseEvent ?? config.phraseEvent;
        const policy = speechPolicy ?? config.speech ?? "never";
        let speech: string | null = null;
        if (event && policy !== "never") {
          const now = Date.now();
          if (policy === "always" || now - lastSpokeAt >= SPEECH_COOLDOWN_MS) {
            speech = pickPhrase(event);
            lastSpokeAt = now;
          }
        }
        set({ state: nextState, speech });

        if (Number.isFinite(config.durationMs)) {
          timer = window.setTimeout(() => {
            activePriority = 0;
            get().returnToIdle();
          }, config.durationMs);
        }
      },

      returnToIdle: () => {
        activePriority = 0;
        set({ state: "idle", speech: null });
      },
    }),
    {
      name: "rhytmo-robot",
      // Só a preferência de som precisa sobreviver entre sessões.
      partialize: (s) => ({ soundEnabled: s.soundEnabled }),
    },
  ),
);

export function reactRobot(
  state: RobotState,
  phraseEvent?: RobotPhraseEvent,
  speech?: SpeechPolicy,
) {
  useRobotStore.getState().react(state, phraseEvent, speech);
}
