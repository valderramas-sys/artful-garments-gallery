/**
 * Gera o wordmark servido a partir da master em assets/logo.
 *
 * A master tem 6483 px de largura. O maior tamanho em que ela é desenhada em
 * qualquer lugar do site são os 460 px de `w-[min(72cqw,460px)]` da tela de
 * abertura — 1380 px de dispositivo numa tela de 3x, e 757 px foi o máximo
 * medido de fato. Era um PNG de 271 KB entregue para pintar menos de 1/8 da
 * própria largura, na primeira coisa que a landing mostra.
 *
 * WIDTH tem folga sobre esses 1380 de propósito: o custo de um pouco mais de
 * pixel aqui é baixo e ninguém quer descobrir um logo borrado numa tela nova.
 *
 *   node scripts/build-logo.mjs
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUT = path.join(ROOT, "assets", "logo", "RhytmoWordmark.png");
const OUTPUT = path.join(ROOT, "public", "logo", "RhytmoWordmark.webp");

const WIDTH = 1600;

const before = (await fs.stat(INPUT)).size;
const meta = await sharp(INPUT).metadata();

await sharp(INPUT)
  .resize({ width: WIDTH, fit: "inside", withoutEnlargement: true })
  // Alpha preservado: o wordmark é branco sobre o cenário, não sobre um fundo.
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toFile(OUTPUT);

const after = (await fs.stat(OUTPUT)).size;
console.log(
  `${meta.width}x${meta.height} ${(before / 1024).toFixed(1)} KB -> ${WIDTH}px ${(after / 1024).toFixed(1)} KB (-${((1 - after / before) * 100).toFixed(0)}%)`,
);
