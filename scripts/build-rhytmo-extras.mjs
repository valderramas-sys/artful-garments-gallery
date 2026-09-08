/**
 * Gera assets/fonts/RhytmoExtras.otf a partir do próprio Medium.otf.
 *
 * A saída é uma MASTER, não um arquivo servido: quem publica em public/fonts
 * é scripts/subset-fonts.mjs, que converte para .woff2. Rode os dois em
 * sequência depois de mexer aqui.
 *
 * Por que isto existe
 * -------------------
 * O Medium.otf tem 131 glifos e dois buracos que aparecem na tela:
 *
 *   1. Nenhum acento. O cmap dele mapeia todo codepoint acentuado para o
 *      glifo da letra SEM acento (ç -> glifo 71, que é o c; ã -> 69, que é
 *      o a). Como o codepoint "existe", o navegador nunca cai para a fonte
 *      seguinte da pilha — ele desenha a letra sem o acento, em silêncio.
 *
 *   2. Pontuação de mentira. Das 32 posições de pontuação ASCII, só !, . e ?
 *      têm desenho. As outras 29 apontam todas para o MESMO glifo provisório
 *      (avanço 430, bbox 41,0,389,750 — idêntico em todas). É por isso que
 *      "@THIAGOVSOUZA_" saía como ":THIAGOVSOUZA:" e "// 2026" como ":: 2026".
 *
 * A saída daqui cobre exatamente esses dois buracos, construída a partir das
 * medidas do próprio arquivo (haste = largura do I, altura de caixa alta =
 * topo do H), para nascer na mesma proporção do tipo. As letras normais
 * continuam vindo do Medium.otf original, intacto — inclusive o GPOS.
 *
 * Rodar:  node scripts/build-rhytmo-extras.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import opentype from "opentype.js";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "../assets/fonts/Medium.otf");
const OUT = resolve(here, "../assets/fonts/RhytmoExtras.otf");

const raw = readFileSync(SRC);
const font = opentype.parse(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));

// glyph.path está em unidades da fonte, y para cima. (glyph.getPath(x, y, size)
// inverte o y para a tela — usar aquele aqui devolve capHeight = 0.)
const box = (ch) => font.charToGlyph(ch).path.getBoundingBox();

const UPM = font.unitsPerEm; // 1000
const STEM = box("I").x2 - box("I").x1; // 227 — o I desta fonte é um retângulo puro
const CAP = box("H").y2; // 745
const DOT = font.charToGlyph("."); // o ponto é um dos três desenhos reais que sobraram

// ---------------------------------------------------------------- utilidades

function shift(path, dx, dy) {
  const out = new opentype.Path();
  out.commands = path.commands.map((c) => {
    const n = { ...c };
    for (const [ax, ay] of [
      ["x", "y"],
      ["x1", "y1"],
      ["x2", "y2"],
    ]) {
      if (n[ax] !== undefined) n[ax] += dx;
      if (n[ay] !== undefined) n[ay] += dy;
    }
    return n;
  });
  return out;
}

function join(...paths) {
  const out = new opentype.Path();
  out.commands = paths.flatMap((p) => p.commands);
  return out;
}

/** Retângulo, sentido horário (mesma direção dos contornos externos do Medium). */
function rect(x1, y1, x2, y2) {
  const p = new opentype.Path();
  p.moveTo(x1, y1);
  p.lineTo(x1, y2);
  p.lineTo(x2, y2);
  p.lineTo(x2, y1);
  p.close();
  return p;
}

/** Polígono a partir de pares [x, y]. */
function poly(pts) {
  const p = new opentype.Path();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  p.close();
  return p;
}

const K = 0.5522847498; // constante de aproximação de círculo por bézier

/** Elipse fechada. `ccw` inverte a direção — usado para furar contra-formas. */
function ellipse(cx, cy, rx, ry, ccw = false) {
  const p = new opentype.Path();
  const ox = rx * K;
  const oy = ry * K;
  if (!ccw) {
    p.moveTo(cx, cy + ry);
    p.curveTo(cx + ox, cy + ry, cx + rx, cy + oy, cx + rx, cy);
    p.curveTo(cx + rx, cy - oy, cx + ox, cy - ry, cx, cy - ry);
    p.curveTo(cx - ox, cy - ry, cx - rx, cy - oy, cx - rx, cy);
    p.curveTo(cx - rx, cy + oy, cx - ox, cy + ry, cx, cy + ry);
  } else {
    p.moveTo(cx, cy + ry);
    p.curveTo(cx - ox, cy + ry, cx - rx, cy + oy, cx - rx, cy);
    p.curveTo(cx - rx, cy - oy, cx - ox, cy - ry, cx, cy - ry);
    p.curveTo(cx + ox, cy - ry, cx + rx, cy - oy, cx + rx, cy);
    p.curveTo(cx + rx, cy + oy, cx + ox, cy + ry, cx, cy + ry);
  }
  return p;
}

/** Anel: elipse externa + elipse interna invertida (regra non-zero fura o meio). */
const ring = (cx, cy, rx, ry, t) =>
  join(ellipse(cx, cy, rx, ry), ellipse(cx, cy, rx - t, ry - t, true));

/**
 * Faixa horizontal de espessura constante seguindo uma função y(x), com
 * terminais retos. Amostrada em vez de desenhada com béziers à mão: garante
 * simetria, que é o que faltava nas duas primeiras versões do til.
 */
function band(x0, x1, t, yOf, steps = 48) {
  const p = new opentype.Path();
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = yOf(x) + t / 2;
    i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const x = x0 + ((x1 - x0) * i) / steps;
    p.lineTo(x, yOf(x) - t / 2);
  }
  p.close();
  return p;
}

// ------------------------------------------------------- sinais diacríticos
//
// O Medium não tem NENHUM sinal solto para reaproveitar: ´ ¨ ¸ não estão no
// cmap, e ^ ` ~ estão, mas apontam para o glifo provisório. Todos abaixo são
// construídos a partir de STEM e CAP.

const MARK_GAP = CAP * 0.17; // folga entre a linha de caixa alta e o sinal
const MARK_TOP = CAP + MARK_GAP;

const MARK_W = STEM * 0.98;
const MARK_H = CAP * 0.26;

function acute(cx, top, dir = 1) {
  const slant = MARK_W * 0.52 * dir;
  return poly([
    [cx - MARK_W / 2 + slant, top],
    [cx - MARK_W / 2 - slant, top - MARK_H],
    [cx + MARK_W / 2 - slant, top - MARK_H],
    [cx + MARK_W / 2 + slant, top],
  ]);
}
const grave = (cx, top) => acute(cx, top, -1);

function circumflex(cx, top) {
  const w = MARK_W * 0.94;
  const spread = STEM * 0.82;
  return poly([
    [cx - spread - w / 2, top - MARK_H],
    [cx - spread + w / 2, top - MARK_H],
    [cx, top - MARK_H + (MARK_H - w * 0.42)],
    [cx + spread - w / 2, top - MARK_H],
    [cx + spread + w / 2, top - MARK_H],
    [cx, top],
  ]);
}

function dieresis(cx, top) {
  const w = MARK_W * 0.96;
  const h = CAP * 0.215;
  const gap = STEM * 0.9;
  return join(
    rect(cx - gap / 2 - w, top - h, cx - gap / 2, top),
    rect(cx + gap / 2, top - h, cx + gap / 2 + w, top),
  );
}

/**
 * Til: uma fita de espessura constante sobre um período de senoide, crista à
 * esquerda. As duas primeiras versões eram béziers escritas à mão e saíam
 * assimétricas, com um bico do lado direito.
 */
function tilde(cx, top) {
  const a = STEM * 1.95; // meia largura
  const t = STEM * 0.6; // espessura da fita
  const amp = CAP * 0.072; // amplitude da onda
  const yc = top - t / 2 - amp;
  return band(cx - a, cx + a, t, (x) => yc - amp * Math.sin((Math.PI * (x - cx)) / a));
}

const ringMark = (cx, top) => {
  // A primeira versão usava r = CAP*0.14 (104) com espessura STEM*0.52 (118):
  // raio interno negativo, o furo desaparecia e o Å saía como um ponto sólido.
  const r = CAP * 0.185;
  return ring(cx, top - r, r, r, r * 0.58);
};

/**
 * Cedilha. O primeiro protótipo virou um borrão porque o gancho era fechado
 * demais para o corpo do tipo; esta versão abre a curva e encosta o começo
 * dela na base da letra.
 */
function cedilla(cx, bottom) {
  const t = STEM * 0.62; // espessura do traço
  const h = CAP * 0.27; // profundidade total abaixo da base
  const w = STEM * 1.05; // largura do gancho
  const p = new opentype.Path();
  p.moveTo(cx - t / 2, bottom);
  p.lineTo(cx - t / 2, bottom - h * 0.38);
  p.curveTo(cx - t / 2, bottom - h * 0.72, cx + w, bottom - h * 0.62, cx + w * 0.62, bottom - h);
  p.lineTo(cx + w * 0.62 - t * 0.95, bottom - h + t * 0.62);
  p.curveTo(
    cx + w * 0.3,
    bottom - h * 0.72,
    cx + t / 2,
    bottom - h * 0.66,
    cx + t / 2,
    bottom - h * 0.38,
  );
  p.lineTo(cx + t / 2, bottom);
  p.close();
  return p;
}

// ------------------------------------------------------------ composição
const glyphs = [
  new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 500, path: new opentype.Path() }),
];

function accented(baseChar, markFn, unicode, name, below = false) {
  const base = font.charToGlyph(baseChar);
  const b = base.path.getBoundingBox();
  const cx = (b.x1 + b.x2) / 2;
  const mark = below ? markFn(cx, b.y1) : markFn(cx, MARK_TOP);
  glyphs.push(
    new opentype.Glyph({
      name,
      unicode,
      // Avanço copiado do original: nenhuma caixa de linha se desloca.
      advanceWidth: base.advanceWidth,
      path: join(base.path, mark),
    }),
  );
}

/** Copia um glifo real do Medium sem tocar em nada (! . ?). */
function copied(ch, name) {
  const g = font.charToGlyph(ch);
  glyphs.push(
    new opentype.Glyph({
      name,
      unicode: ch.codePointAt(0),
      advanceWidth: g.advanceWidth,
      path: g.path,
    }),
  );
}

function drawn(ch, name, advanceWidth, path) {
  glyphs.push(new opentype.Glyph({ name, unicode: ch.codePointAt(0), advanceWidth, path }));
}

// -- acentuados: todo o intervalo Latin-1 que o site usa ---------------------
// As minúsculas reaproveitam os MESMOS contornos em caixa alta que esta fonte
// desenha para a-z (é um tipo de caixa única), então o par continua idêntico
// ao resto do texto — que é exatamente o pedido.
const UPPER = [
  ["A", grave, 0x00c0, "Agrave"],
  ["A", acute, 0x00c1, "Aacute"],
  ["A", circumflex, 0x00c2, "Acircumflex"],
  ["A", tilde, 0x00c3, "Atilde"],
  ["A", dieresis, 0x00c4, "Adieresis"],
  ["A", ringMark, 0x00c5, "Aring"],
  ["C", cedilla, 0x00c7, "Ccedilla", true],
  ["E", grave, 0x00c8, "Egrave"],
  ["E", acute, 0x00c9, "Eacute"],
  ["E", circumflex, 0x00ca, "Ecircumflex"],
  ["E", dieresis, 0x00cb, "Edieresis"],
  ["I", grave, 0x00cc, "Igrave"],
  ["I", acute, 0x00cd, "Iacute"],
  ["I", circumflex, 0x00ce, "Icircumflex"],
  ["I", dieresis, 0x00cf, "Idieresis"],
  ["N", tilde, 0x00d1, "Ntilde"],
  ["O", grave, 0x00d2, "Ograve"],
  ["O", acute, 0x00d3, "Oacute"],
  ["O", circumflex, 0x00d4, "Ocircumflex"],
  ["O", tilde, 0x00d5, "Otilde"],
  ["O", dieresis, 0x00d6, "Odieresis"],
  ["U", grave, 0x00d9, "Ugrave"],
  ["U", acute, 0x00da, "Uacute"],
  ["U", circumflex, 0x00db, "Ucircumflex"],
  ["U", dieresis, 0x00dc, "Udieresis"],
  ["Y", acute, 0x00dd, "Yacute"],
];
const LOWER = [
  ["a", grave, 0x00e0],
  ["a", acute, 0x00e1],
  ["a", circumflex, 0x00e2],
  ["a", tilde, 0x00e3],
  ["a", dieresis, 0x00e4],
  ["a", ringMark, 0x00e5],
  ["c", cedilla, 0x00e7, true],
  ["e", grave, 0x00e8],
  ["e", acute, 0x00e9],
  ["e", circumflex, 0x00ea],
  ["e", dieresis, 0x00eb],
  ["i", grave, 0x00ec],
  ["i", acute, 0x00ed],
  ["i", circumflex, 0x00ee],
  ["i", dieresis, 0x00ef],
  ["n", tilde, 0x00f1],
  ["o", grave, 0x00f2],
  ["o", acute, 0x00f3],
  ["o", circumflex, 0x00f4],
  ["o", tilde, 0x00f5],
  ["o", dieresis, 0x00f6],
  ["u", grave, 0x00f9],
  ["u", acute, 0x00fa],
  ["u", circumflex, 0x00fb],
  ["u", dieresis, 0x00fc],
  ["y", acute, 0x00fd],
  ["y", dieresis, 0x00ff],
];

for (const [ch, fn, cp, name, below] of UPPER) accented(ch, fn, cp, name, below === true);
for (const [ch, fn, cp, below] of LOWER)
  accented(ch, fn, cp, `uni${cp.toString(16).toUpperCase()}`, below === true);

// -- pontuação --------------------------------------------------------------
// Os três desenhos reais entram copiados, para o intervalo desta fonte poder
// cobrir o bloco inteiro sem devolver ! . ? para outra família.
copied("!", "exclam");
copied(".", "period");
copied("?", "question");

const dotW = box(".").x2 - box(".").x1; // 201
const dotH = box(".").y2; // 154
const dotLead = box(".").x1; // 32
const periodAdv = font.charToGlyph(".").advanceWidth; // 266

// dois pontos: o ponto do Medium repetido, o de cima alinhado pela altura-x
drawn(":", "colon", periodAdv, join(DOT.path, shift(DOT.path, 0, CAP - dotH)));

// vírgula: o ponto do Medium com uma cauda descendo à esquerda
const commaTail = poly([
  [dotLead + dotW * 0.16, 0],
  [dotLead + dotW * 0.9, 0],
  [dotLead + dotW * 0.34, -CAP * 0.25],
  [dotLead - dotW * 0.06, -CAP * 0.25],
]);
const comma = join(DOT.path, commaTail);
drawn(",", "comma", periodAdv, comma);
drawn(";", "semicolon", periodAdv, join(comma, shift(DOT.path, 0, CAP - dotH)));

// apóstrofo e aspas: hastes curtas penduradas na linha de caixa alta
const tickW = STEM * 0.82;
const tickH = CAP * 0.34;
const tick = (x) => rect(x, CAP - tickH, x + tickW, CAP);
drawn("'", "quotesingle", tickW + 2 * 68, tick(68));
drawn(
  '"',
  "quotedbl",
  tickW * 2 + STEM * 0.62 + 2 * 62,
  join(tick(62), tick(62 + tickW + STEM * 0.62)),
);

// hífen: barra na metade da altura de caixa alta
const hyphenT = STEM * 0.86;
drawn("-", "hyphen", 520, rect(70, CAP / 2 - hyphenT / 2, 450, CAP / 2 + hyphenT / 2));

// underline: barra abaixo da linha de base, ocupando o avanço inteiro —
// é este glifo que faltava em "@thiagovsouza_"
drawn("_", "underscore", 620, rect(0, -CAP * 0.28, 620, -CAP * 0.28 + STEM * 0.66));

// barra: haste inclinada, da descendente ao topo da caixa alta
const slashT = STEM * 0.88;
const slashSkew = 150;
drawn(
  "/",
  "slash",
  620,
  poly([
    [110, -CAP * 0.11],
    [110 + slashSkew * 2, CAP * 1.03],
    [110 + slashSkew * 2 + slashT, CAP * 1.03],
    [110 + slashT, -CAP * 0.11],
  ]),
);

// parênteses: arco com a espessura de haste da fonte. A primeira versão saiu
// fina como um colchete de outro tipo — o problema era a espessura ser aplicada
// na diagonal em vez de na horizontal.
const PAREN_ADV = 560;
function paren(dir) {
  const t = STEM * 0.9; // espessura horizontal do arco
  const top = CAP * 1.03;
  const bot = -CAP * 0.19;
  const mid = (top + bot) / 2;
  const near = dir > 0 ? 350 : PAREN_ADV - 350; // extremidade reta (topo/base)
  const far = dir > 0 ? 120 : PAREN_ADV - 120; // ponto de maior curvatura
  const p = new opentype.Path();
  // borda externa, de cima para baixo
  p.moveTo(near, top);
  p.curveTo(
    near - (near - far) * dir * 0 + (far - near) * 0.66,
    top,
    far,
    mid + (top - mid) * 0.55,
    far,
    mid,
  );
  p.curveTo(far, mid - (top - mid) * 0.55, near + (far - near) * 0.66, bot, near, bot);
  // borda interna, de baixo para cima
  p.lineTo(near + t * dir, bot);
  p.curveTo(
    near + t * dir + (far - near) * 0.66,
    bot,
    far + t * dir,
    mid - (top - mid) * 0.55,
    far + t * dir,
    mid,
  );
  p.curveTo(
    far + t * dir,
    mid + (top - mid) * 0.55,
    near + t * dir + (far - near) * 0.66,
    top,
    near + t * dir,
    top,
  );
  p.close();
  return p;
}
drawn("(", "parenleft", PAREN_ADV, paren(1));
drawn(")", "parenright", PAREN_ADV, paren(-1));

// A arroba NÃO entra aqui, de propósito. Tentei duas construções (anel fechado
// recortado, e arco aberto com cauda) e as duas leram como um alvo ou como um
// "Œ" — a espiral do @ não se reduz às formas geométricas desta fonte sem virar
// outra coisa. U+0040 fica de fora do unicode-range e cai na "Rhytmo Symbols"
// (NotoSans), que já cobre U+003A–0040. A 7px do HUD a troca não se percebe, e
// vale mais um @ legível de outro tipo do que um desenho ruim deste.

// ------------------------------------------------------------------- saída
const out = new opentype.Font({
  familyName: "Rhytmo Extras",
  styleName: "Regular",
  unitsPerEm: UPM,
  ascender: font.ascender,
  descender: font.descender,
  glyphs,
});
writeFileSync(OUT, Buffer.from(out.toArrayBuffer()));

const cps = glyphs
  .slice(1)
  .map((g) => g.unicode)
  .sort((a, b) => a - b);
console.log(`Medium.otf → haste ${STEM}, caixa alta ${CAP}, unitsPerEm ${UPM}`);
console.log(`RhytmoExtras.otf escrito: ${glyphs.length - 1} glifos`);
console.log(
  "unicode-range:\n  " +
    cps.map((c) => "U+" + c.toString(16).toUpperCase().padStart(4, "0")).join(", "),
);
