/**
 * Gera as fotos editoriais recortadas "do pescoço para cima".
 *
 * As quatro masters vêm do lookbook com enquadramentos diferentes: a 0.3 é um
 * retrato fechado que termina logo abaixo do queixo, e as outras três mostram
 * ombros, colo e o cabelo inteiro descendo até a base do quadro. Na página do
 * produto isso dava quatro tamanhos aparentes de cabeça e trazia para o palco
 * um monte de pele e cabelo que não é a peça — sem contar que é justamente no
 * cabelo comprido sobre o fundo branco que o recorte mais sofre.
 *
 * A regra abaixo põe as quatro no enquadramento da 0.3, medido nela mesma: o
 * queixo cai a 77,1% da altura do quadro, contada a partir do topo do gorro, e
 * sobra 4,2% de ar acima do gorro. Os números de topo-do-gorro e queixo de cada
 * foto foram lidos na régua (scripts/…/models-grid), não estimados: eles
 * dependem da pose e não há sinal automático confiável para o queixo — a
 * silhueta das modelas de cabelo comprido nunca estreita no pescoço.
 *
 *   node scripts/crop-model-photos.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** As masters do lookbook não são servidas: ficam fora de public. */
const SRC = path.join(ROOT, "assets", "images");
const OUT = path.join(ROOT, "public", "images");

/** Onde o queixo deve cair dentro do quadro final, medido na 0.3. */
const CHIN_AT = 0.771;
/** Ar acima do gorro, em frações do quadro final. Idem. */
const HEADROOM = 0.0417;

/** Topo do gorro e linha do queixo de cada master, em fração da própria altura. */
const LANDMARKS = [
  { from: "paradela-01-b.png", to: "paradela-01-head.webp", hatTop: 0.02, chin: 0.63 },
  { from: "paradela-02-c.png", to: "paradela-02-head.webp", hatTop: 0.04, chin: 0.62 },
  { from: "paradela-03-b.png", to: "paradela-03-head.webp", hatTop: 0.04, chin: 0.78 },
  { from: "paradela-04-b.png", to: "paradela-04-head.webp", hatTop: 0.02, chin: 0.62 },
];

/**
 * Uma saída que JÁ tem transparência foi recortada fora daqui (as três
 * editoriais passaram por remoção de fundo depois de cortadas) e não pode ser
 * sobrescrita: rodar o script de novo devolveria o fundo branco sem avisar.
 * Rode com `--force` só se a intenção for justamente refazer do zero.
 */
const force = process.argv.includes("--force");

for (const { from, to, hatTop, chin } of LANDMARKS) {
  const input = path.join(SRC, from);
  const output = path.join(OUT, to);

  if (!force) {
    // Pelo buffer, e não por caminho: `sharp(caminho)` mantém o arquivo aberto
    // de forma preguiçosa, e a escrita logo abaixo no MESMO caminho falhava com
    // "unable to open for write" quando a guarda deixava passar.
    const existing = await fs
      .readFile(output)
      .then((buf) => sharp(buf).metadata())
      .catch(() => null);
    if (existing?.hasAlpha) {
      console.log(`${to} já vem sem fundo — preservado (use --force para refazer)`);
      continue;
    }
  }

  const image = sharp(input);
  const { width, height } = await image.metadata();

  const frame = (chin - hatTop) / CHIN_AT;
  const top = Math.max(0, Math.round((hatTop - HEADROOM * frame) * height));
  const bottom = Math.min(height, Math.round((hatTop + frame) * height));

  await sharp(input)
    .extract({ left: 0, top, width, height: bottom - top })
    // WebP e não PNG: são fotos, e o recorte só precisa decodificar. As masters
    // 02 e 03 já eram WebP com extensão .png — aqui a extensão passa a dizer a
    // verdade.
    .webp({ quality: 90 })
    .toFile(output);

  console.log(
    `${from} ${width}x${height} -> ${to} ${width}x${bottom - top} (topo ${top}, base ${bottom})`,
  );
}
