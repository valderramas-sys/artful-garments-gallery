import type { RobotPhraseEvent } from "./phrases";

export type RobotState =
  | "idle"
  | "welcome"
  | "happy"
  | "angry"
  | "curious"
  | "searching"
  | "processing"
  | "surprised"
  | "discovering";

/**
 * Quando a animação tem direito a abrir o balão.
 *
 * O robô falava em toda navegação — entrar na loja, abrir um produto, clicar
 * numa seta — e o balão virou ruído de fundo. A fala passou a ser um recurso
 * caro, gasto por evento e não por movimento:
 *
 * - `always`  — resposta direta a uma ação deliberada e rara do cliente
 *               (mexeu no carrinho, foi para o checkout). Sempre fala.
 * - `sparing` — comentário simpático mas dispensável. Só sai se já faz um bom
 *               tempo que ele não fala (SPEECH_COOLDOWN_MS em robotStore).
 * - `never`   — anima e cala. Tudo que dispara sozinho ao navegar.
 */
export type SpeechPolicy = "always" | "sparing" | "never";

type StateConfig = {
  /** Gif animado, servido de /public/robot. */
  src: string;
  /**
   * Primeiro frame do mesmo gif, extraído localmente — usado no lugar do
   * gif quando o usuário prefere menos movimento (prefers-reduced-motion,
   * seção 40 do briefing). Um gif não pode ser pausado via CSS, então a
   * alternativa é não tocá-lo.
   */
  staticSrc: string;
  /** Duração antes de retornar automaticamente ao idle. */
  durationMs: number;
  /**
   * Prioridade da reação: uma animação de prioridade maior pode interromper
   * uma de prioridade menor; uma igual ou menor é ignorada até a atual
   * terminar (ver seção 22 do briefing: nunca duas animações simultâneas).
   */
  priority: number;
  /** Evento de frase associado, quando a animação deve falar algo. */
  phraseEvent?: RobotPhraseEvent;
  /** Com que liberdade esta animação pode falar. Ausente = `never`. */
  speech?: SpeechPolicy;
};

export const ROBOT_STATES: Record<RobotState, StateConfig> = {
  idle: {
    // Was /robot-wave.gif — its raised-arm frames draw the hand fused
    // directly onto the visor rim with no forearm silhouette at all (not
    // a rendering clip, verified in the source frames pixel by pixel;
    // the unused alternate wave asset in the repo has the identical
    // defect). Since idle plays more than any other state, that's not an
    // occasional glitch, it's the default look of the character. Swapped
    // for a calm breathing-bob loop with no raised arm until a sprite
    // with the arm actually drawn exists.
    src: "/robot/idle-breathe.gif",
    staticSrc: "/robot/static/idle-breathe.png",
    durationMs: Infinity,
    priority: 0,
  },

  welcome: {
    src: "/robot/welcome.gif",
    staticSrc: "/robot/static/welcome.png",
    durationMs: 3200,
    priority: 5,
    phraseEvent: "welcome",
    // Uma vez por sessão, na chegada ao /lab: é a apresentação dele.
    speech: "always",
  },

  // Produto adicionado ao carrinho.
  happy: {
    src: "/robot/happy.gif",
    staticSrc: "/robot/static/happy.png",
    durationMs: 2400,
    priority: 4,
    phraseEvent: "productAdded",
    speech: "always",
  },

  // Produto removido do carrinho.
  angry: {
    src: "/robot/angry.gif",
    staticSrc: "/robot/static/angry.png",
    durationMs: 2400,
    priority: 4,
    phraseEvent: "productRemoved",
    speech: "always",
  },

  // Hover/curiosidade sobre um produto, dúvida, estranhamento.
  curious: {
    src: "/robot/curious.gif",
    staticSrc: "/robot/static/curious.png",
    durationMs: 2200,
    priority: 2,
    phraseEvent: "curiousHover",
    speech: "sparing",
  },

  // Exploração ativa: busca de produtos, sugestões.
  searching: {
    src: "/robot/searching.gif",
    staticSrc: "/robot/static/searching.png",
    durationMs: 2600,
    priority: 3,
    phraseEvent: "discovering",
    // Dispara sozinho toda vez que a loja carrega. Anima e cala.
    speech: "never",
  },

  // Atenção / processamento / análise (visor piscando).
  processing: {
    src: "/robot/processing.gif",
    staticSrc: "/robot/static/processing.png",
    durationMs: 1800,
    priority: 1,
    phraseEvent: "discovering",
    // Abrir uma página de produto e passar de peça pela seta caem aqui: são
    // dezenas por visita. O visor pisca, a boca fica fechada. Quem precisa de
    // fala neste estado (o checkout) pede a política na chamada.
    speech: "never",
  },

  // Carrinho crescendo rápido / evento inesperado.
  surprised: {
    src: "/robot/processing.gif",
    staticSrc: "/robot/static/processing.png",
    durationMs: 2000,
    priority: 3,
    phraseEvent: "cartGrowing",
    speech: "sparing",
  },

  // Alias semântico de "searching" para o contexto de descoberta de produtos
  // na navegação (mesma animação da lupa).
  discovering: {
    src: "/robot/searching.gif",
    staticSrc: "/robot/static/searching.png",
    durationMs: 2600,
    priority: 2,
    phraseEvent: "discovering",
    // Clicar numa bolha é intenção de verdade, então ele TEM direito a falar —
    // mas não em toda bolha, senão volta a tagarelar. O intervalo mínimo
    // resolve isso sem precisar tirar a fala do clique.
    speech: "sparing",
  },
};
