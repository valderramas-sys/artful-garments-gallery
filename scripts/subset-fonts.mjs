/**
 * Gera as fontes servidas (public/fonts/*.woff2) a partir das masters em
 * assets/fonts.
 *
 * Dois problemas resolvidos aqui, nessa ordem de importância:
 *
 * 1. A NotoSans-SemiBold vinha inteira: 631 KB, 4503 glifos. Ela entra em
 *    --font-sans como "Rhytmo Symbols", cujo unicode-range começa em
 *    U+0021-002F — ou seja, o primeiro ponto final da página dispara o
 *    download inteiro, em toda visita, em todas as rotas. O recorte abaixo
 *    mantém exatamente as faixas declaradas no @font-face e joga fora o
 *    resto, que aquela família nunca teria como desenhar.
 *
 * 2. Todas eram .otf/.ttf cru. WOFF2 é o mesmo arquivo com compressão
 *    própria e suporte universal desde 2016; converter é ganho sem perda.
 *
 * A HSJandari (coreano) e a Coolvetica não são recortadas por conteúdo: a
 * primeira precisa cobrir qualquer string que a tradução venha a usar, e a
 * segunda é a última da pilha, então pega o que as anteriores não cobrem.
 * Nas duas o ganho vem só do WOFF2.
 *
 * Precisa de fontTools com brotli:  pip install fonttools brotli
 *
 *   node scripts/subset-fonts.mjs
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets", "fonts");
const OUT = path.join(ROOT, "public", "fonts");

/**
 * `unicodes` espelha o unicode-range do @font-face correspondente em
 * styles.css. Se um daqueles ranges mudar, este tem que mudar junto — o
 * navegador não pede um codepoint fora do range, então um glifo a mais aqui
 * é peso morto e um a menos é um retângulo vazio na tela.
 */
const FONTS = [
  {
    from: "Medium.otf",
    to: "Medium.woff2",
    // Pilha inteira do corpo do texto; sem recorte.
  },
  {
    from: "Coolvetica_Rg.otf",
    to: "Coolvetica_Rg.woff2",
  },
  {
    from: "RhytmoExtras.otf",
    to: "RhytmoExtras.woff2",
  },
  {
    from: "NotoSans-SemiBold.ttf",
    to: "NotoSans-Symbols.woff2",
    unicodes: [
      "U+0021-002F",
      "U+003A-0040",
      "U+005B-0060",
      "U+007B-007E",
      "U+00A1-00FF",
      "U+2000-206F",
      "U+2070-209F",
      "U+20A0-20BF",
      "U+2100-214F",
      "U+2150-218F",
      "U+2190-21FF",
      "U+2200-22FF",
      "U+2300-23FF",
      "U+25A0-25FF",
      "U+2600-26FF",
      "U+2700-27BF",
      "U+2B00-2BFF",
      "U+3001-303F",
      "U+FF01-FF0F",
      "U+FF1A-FF20",
    ].join(","),
  },
  {
    from: "HSJandari-Regular.ttf",
    to: "HSJandari-Regular.woff2",
  },
];

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

for (const { from, to, unicodes } of FONTS) {
  const input = path.join(SRC, from);
  const output = path.join(OUT, to);
  const before = (await fs.stat(input)).size;

  const args = [
    input,
    `--output-file=${output}`,
    "--flavor=woff2",
    // Sem recorte declarado = a fonte inteira, só reempacotada.
    unicodes ? `--unicodes=${unicodes}` : "--unicodes=*",
    // Kerning e ligaduras ficam; é o desenho do texto.
    "--layout-features=*",
    "--name-IDs=*",
    // Hinting da master não vale o peso: o alvo é tela em DPI moderno, onde
    // o rasterizador ignora quase tudo dele.
    "--no-hinting",
    "--desubroutinize",
  ];

  // Via `python -m`, e não pelo executável solto: no Windows o `pyftsubset` é
  // um .exe de atalho que só o shell encontra, e passar argumentos por shell
  // faz o Node avisar (com razão) que nada aqui é escapado.
  await run(process.env.PYTHON ?? "python", ["-m", "fontTools.subset", ...args]);

  const after = (await fs.stat(output)).size;
  const cut = (1 - after / before) * 100;
  console.log(
    `${from.padEnd(24)} ${kb(before).padStart(9)} -> ${to.padEnd(26)} ${kb(after).padStart(9)}  (-${cut.toFixed(0)}%)`,
  );
}
