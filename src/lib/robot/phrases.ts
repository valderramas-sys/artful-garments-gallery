/**
 * Frases do robô, organizadas por evento/contexto.
 *
 * Fonte: "Frases Robo.txt". Cada frase mantém o kaomoji original — eles
 * carregam parte da emoção e são exibidos junto ao texto no balão de fala.
 */

export type RobotPhraseEvent =
  | "welcome"
  | "productAdded"
  | "productRemoved"
  | "cartGrowing"
  | "checkoutStarted"
  | "purchaseComplete"
  | "discovering"
  | "curiousHover"
  | "idlePrompt"
  | "error";

const PHRASES: Record<RobotPhraseEvent, string[]> = {
  welcome: ["「Opa?!」 (๑°⌓°๑)"],

  productAdded: [
    "「Boa escolha!!」 (≧▽≦)",
    "「Mais um pro carrinho!!」 ヽ(>∀<☆)ノ",
    "「Aí sim!!」 (ง •̀_•́)ง",
    "「Gostei dessa escolha...」 (￣▽￣)b",
    "「Hehe... sabia que você ia gostar.」 (¬‿¬)",
    "「Você encontrou uma boa!」 (｡•̀ᴗ-)✧",
    "「Olha só isso!!」 ✨(ﾉ◕ヮ◕)ﾉ",
    "「Gostou desse, né?」 (〃▽〃)",
    "「Eu sabia!!」 (≧ω≦)",
    "「Mais um!!」 ヽ(≧▽≦)ﾉ",
    "「Opa, temos um comprador!!」 (°ロ°)☝",
  ],

  productRemoved: [
    "「Você removeu?!」 (╥﹏╥)",
    "「Nããão...」 (｡•́︿•̀｡)",
    "「Ele estava tão feliz no carrinho...」 (つ﹏⊂)",
  ],

  // Disparadas quando o carrinho cresce bastante (ex.: 4+ itens distintos ou
  // quantidade alta) — tom brincalhão, nunca bloqueante.
  cartGrowing: [
    "「O carrinho está crescendo...」 (；￣Д￣)",
    "「Você vai levar tudo?!」 Σ(°ロ°)",
    "「Calma aí!!」 ヽ(°◇° )ノ",
    "「Esse também?!」 (⊙_⊙;)",
    "「Tem certeza disso?」 (・_・;)",
    "「Não vai se arrepender, hein...」 (¬‿¬)",
    "「Eita!!」 Σ(°△°|||)",
    "「Está ficando sério...」 (￣▽￣;)",
    "「Agora não tem volta...」 (⊙_⊙;)",
  ],

  checkoutStarted: ["「Vamos para o checkout?!」 (ง'̀-'́)ง"],

  purchaseComplete: [
    "「Compra confirmada!!」 ヽ(≧▽≦)ﾉ",
    "「Missão concluída!!」 (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
    "「Obrigado pela compra!!」 (´｡• ᵕ •｡`) ♡",
    "「Até a próxima!!」 (｡•̀ᴗ-)✧",
  ],

  // Usadas com a animação da lupa: busca/descoberta de produtos.
  discovering: [
    "「Estou procurando...」 (｀・ω・´)",
    "「Encontrei!!」 Σ(°ロ°)",
    "「Deixa comigo!!」 (ง •̀_•́)ง",
    "「Hmm... interessante...」 (・ω・)",
    "「Estou de olho...」 👀 (¬‿¬)",
  ],

  // Usadas com a animação do visor piscando: curiosidade ao passar o mouse
  // sobre um produto/bolha.
  curiousHover: ["「Esse é bonito, hein...」 (¬‿¬)", "「Você escolheu esse?!」 (⊙_⊙)"],

  // Disparada com moderação após um período longo de inatividade — nunca
  // deve virar pop-up insistente (ver RobotStore: cooldown + limite por sessão).
  idlePrompt: ["「Você ainda está aí?」 (・_・;)"],

  error: ["「Opa! Algo deu errado...」 (⊙_⊙;)", "「Calma! Eu resolvo isso!!」 (ง •̀_•́)ง"],
};

// Evita repetir a mesma frase duas vezes seguidas dentro de um mesmo evento.
const lastIndexByEvent = new Map<RobotPhraseEvent, number>();

export function pickPhrase(event: RobotPhraseEvent): string {
  const list = PHRASES[event];
  if (list.length === 1) return list[0];

  const last = lastIndexByEvent.get(event);
  let index = Math.floor(Math.random() * list.length);
  if (index === last) index = (index + 1) % list.length;

  lastIndexByEvent.set(event, index);
  return list[index];
}
