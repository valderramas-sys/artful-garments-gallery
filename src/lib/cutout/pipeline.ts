/**
 * O recorte por pixel, sem nada de DOM.
 *
 * Vive separado do hook porque roda nos dois lados: em src/lib/cutout/worker.ts,
 * que é onde o trabalho de fato acontece, e na linha principal como plano B
 * quando o navegador não tem Worker ou OffscreenCanvas. As funções aqui só
 * tocam ImageData e arrays tipados — nada de `document`, nada de React.
 *
 * A explicação de CADA constante e de cada etapa do pipeline está nos
 * comentários abaixo; elas saíram de medição nas oito fotos do catálogo, não
 * de tentativa e erro.
 */

// Real per-pixel cutout (not a CSS blend trick): draws the product photo to
// an offscreen canvas and removes the backdrop with a small pipeline, not a
// single flood-fill pass — see the numbered steps in `cutoutMask` below.
// Shopify's CDN serves product images with permissive CORS, so this works
// without a proxy — if a browser ever refuses (tainted canvas, decode
// failure), we fail closed and hand back the original src with no bbox/mask.
//
// KNOWN LIMIT, not fixed by any of this: a product shot in the same colour
// as its own backdrop (e.g. a white beanie on white) is indistinguishable
// from the background by colour alone. No tolerance value or morphology
// pass below can recover that — it needs real segmentation, or a
// pre-cut source image. See AGENTS.md.
// Teto padrão do canvas de trabalho. As bolhas da loja processam quatro fotos
// de uma vez e nunca passam de ~340px na tela, então 900 é folga de sobra
// para elas — e o pipeline abaixo faz várias passagens sobre TODOS os pixels,
// então dobrar o lado quadruplica o custo. A página do produto passa um teto
// maior (ver PDP_CUTOUT_DIMENSION): lá é uma foto só, exibida grande, e a
// lente de zoom precisa de pixels de verdade para ampliar.
export const DEFAULT_MAX_DIMENSION = 900;

/** Teto usado na página de produto: processa as fotos no tamanho nativo
 *  (Shopify serve 1536×1920; as editoriais locais têm 896×1200), que é o que
 *  dá detalhe de verdade quando a lente amplia. */
export const PDP_CUTOUT_DIMENSION = 1920;

/** Teto das miniaturas: 5 por página, exibidas com 44px. */
export const THUMB_CUTOUT_DIMENSION = 256;

/**
 * Distância a partir da qual um canto é considerado OCUPADO PELO ASSUNTO e
 * descartado como amostra de fundo.
 *
 * Medido nas oito fotos do site: nas quatro de produto os quatro cantos
 * desviam 0 da mediana da borda; nas quatro editoriais os cantos de cima
 * desviam 0–5 e os de baixo 119–288, porque o enquadramento é fechado e o
 * cabelo da modelo preenche a base. Qualquer corte entre ~60 e ~110 separa os
 * dois casos; 60 é logo acima da própria tolerância do preenchimento.
 */
const CORNER_REJECT_DISTANCE = 60;

// Colour distance (squared, so no sqrt per pixel) a pixel may sit from its
// LOCAL backdrop estimate and still seed/join the background flood-fill.
// 18, e não os 34 originais. Medido: nas fotos editoriais a pele clara do
// colo fica a 68 de distância do branco do estúdio, e 34 por canal são 59 de
// distância euclidiana — margem de 15%, que a variação natural da pele
// atravessa. O resultado eram buracos no colo. A 18 (31 de distância) a pele
// fica com folga de 2,2× e o fundo real, que se afasta menos de 10, continua
// dentro. Varrido nas oito fotos do site: as de produto ficam idênticas em
// qualquer valor entre 14 e 34, então baixar não custa nada lá.
const CORE_TOLERANCE_SQUARED = 18 * 18 * 3;
// A second, looser band: pixels beyond the core tolerance but inside this
// one don't join the fill outright, but contribute to the soft edge (step
// 4) instead of being kept or cut outright at full strength.
const EDGE_TOLERANCE_SQUARED = 44 * 44 * 3;

/**
 * Espessura máxima de barreira que o fundo consegue atravessar (px do canvas
 * de trabalho) — ver a etapa 1b.
 *
 * Separa dois brancos que a cor sozinha não separa: o vão entre fios de cabelo,
 * que é fundo de estúdio preso atrás de um fio de poucos pixels, e o branco que
 * está pintado no produto. Medido nas quatro editoriais: os bolsões de cabelo
 * ficam a 3–14px da silhueta, e o painel claro da estampa do gorro 0.4 — o
 * maior branco legítimo do catálogo — está a mais de 85px de qualquer borda.
 * 16 fica no meio dessa folga, com margem de 5× para o lado que importa.
 */
const BACKDROP_LEAK_RADIUS = 16;

// Side length of the downsampled hit-test mask returned alongside the
// cutout — coarse on purpose (this only needs to answer "is the pointer
// over product pixels or backdrop", not reproduce the edge).
export const MASK_SIZE = 48;

export type CutoutResult = {
  /**
   * blob: URL do PNG recortado — ou a própria src original quando a foto já
   * chegou sem fundo e quando o recorte falha.
   */
  src: string;
  /** Natural width / height of the working canvas (== the source photo's own, since every current product photo is already under MAX_DIMENSION). */
  aspectRatio: number;
  /**
   * Fractional bounding box (0–1, relative to the full image) of the
   * actual product silhouette — not the photo's own frame, which is what
   * every consumer used to size/scale against. Null when the cutout
   * failed and there's nothing to measure.
   */
  bbox: { x: number; y: number; width: number; height: number } | null;
  /** Downsampled alpha mask (MASK_SIZE × MASK_SIZE, row-major, 0–255) for pointer hit-testing. Null alongside a null bbox. */
  mask: Uint8ClampedArray | null;
  maskSize: number;
};

const cache = new Map<string, CutoutResult>();
const inflight = new Map<string, Promise<CutoutResult>>();

function medianOf(values: number[]) {
  if (values.length === 0) return 255;
  values.sort((a, b) => a - b);
  return values[values.length >> 1];
}

/**
 * Mediana da faixa de borda (2% do lado menor).
 *
 * É a estimativa robusta do fundo: aguenta o assunto encostar em uma ou duas
 * arestas sem se deslocar, porque a mediana ignora a minoria. Nas quatro
 * fotos editoriais o assunto ocupa a base inteira — 25 a 35% da borda — e
 * mesmo assim a mediana devolve o branco do estúdio.
 */
function borderMedian(data: Uint8ClampedArray, width: number, height: number) {
  const band = Math.max(3, Math.round(Math.min(width, height) * 0.02));
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  for (let y = 0; y < height; y += 1) {
    const edgeRow = y < band || y >= height - band;
    for (let x = 0; x < width; x += 1) {
      if (!edgeRow && x >= band && x < width - band) continue;
      const i = (y * width + x) * 4;
      r.push(data[i]);
      g.push(data[i + 1]);
      b.push(data[i + 2]);
    }
  }
  return [medianOf(r), medianOf(g), medianOf(b)] as [number, number, number];
}

/** Median of a small square sample in a corner of the image. */
function sampleCorner(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx0: number,
  cy0: number,
) {
  const size = Math.max(4, Math.round(Math.min(width, height) * 0.06));
  const x0 = Math.max(0, Math.min(width - 1, cx0));
  const y0 = Math.max(0, Math.min(height - 1, cy0));
  const xStep = cx0 === 0 ? 1 : -1;
  const yStep = cy0 === 0 ? 1 : -1;
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  for (let dy = 0; dy < size; dy += 1) {
    const y = y0 + dy * yStep;
    if (y < 0 || y >= height) continue;
    for (let dx = 0; dx < size; dx += 1) {
      const x = x0 + dx * xStep;
      if (x < 0 || x >= width) continue;
      const i = (y * width + x) * 4;
      r.push(data[i]);
      g.push(data[i + 1]);
      b.push(data[i + 2]);
    }
  }
  // Mediana, não média: um canto meio ocupado pelo assunto arrastava a média
  // para o meio do caminho e envenenava a referência sem ser detectável.
  return [medianOf(r), medianOf(g), medianOf(b)] as [number, number, number];
}

/**
 * A studio backdrop is usually lit unevenly enough that one flat average
 * colour drifts from the actual backdrop across the frame — that drift is
 * exactly what let the old flood-fill "walk" into the product along a
 * smooth gradient. Bilinear interpolation between the four corners
 * approximates the gradient instead of flattening it away.
 */
function makeLocalBackdropSampler(data: Uint8ClampedArray, width: number, height: number) {
  // Um canto só serve de amostra de fundo se ele FOR fundo. Nas fotos
  // editoriais o enquadramento é fechado e os dois cantos de baixo são o
  // cabelo da modelo: usá-los puxava a referência para a cor do cabelo, e aí
  // o preenchimento comia o cabelo (que passava a "casar" com a referência) e
  // deixava blocos de branco reais intactos. O canto reprovado cai para a
  // mediana da borda, que continua sendo fundo limpo.
  const median = borderMedian(data, width, height);
  const far = (c: [number, number, number]) =>
    Math.hypot(c[0] - median[0], c[1] - median[1], c[2] - median[2]) > CORNER_REJECT_DISTANCE;
  const pick = (c: [number, number, number]) => (far(c) ? median : c);

  const tl = pick(sampleCorner(data, width, height, 0, 0));
  const tr = pick(sampleCorner(data, width, height, width - 1, 0));
  const bl = pick(sampleCorner(data, width, height, 0, height - 1));
  const br = pick(sampleCorner(data, width, height, width - 1, height - 1));
  const w1 = Math.max(1, width - 1);
  const h1 = Math.max(1, height - 1);
  return (x: number, y: number): [number, number, number] => {
    const u = x / w1;
    const v = y / h1;
    const topR = tl[0] + (tr[0] - tl[0]) * u;
    const topG = tl[1] + (tr[1] - tl[1]) * u;
    const topB = tl[2] + (tr[2] - tl[2]) * u;
    const botR = bl[0] + (br[0] - bl[0]) * u;
    const botG = bl[1] + (br[1] - bl[1]) * u;
    const botB = bl[2] + (br[2] - bl[2]) * u;
    return [topR + (botR - topR) * v, topG + (botG - topG) * v, topB + (botB - topB) * v];
  };
}

/** Squared colour distance from a pixel to a local backdrop estimate. */
function backdropDistanceSquared(
  data: Uint8ClampedArray,
  i: number,
  ref: [number, number, number],
): number {
  const pi = i * 4;
  const dr = data[pi] - ref[0];
  const dg = data[pi + 1] - ref[1];
  const db = data[pi + 2] - ref[2];
  return dr * dr + dg * dg + db * db;
}

/** One erosion or dilation pass over a binary mask (4-connectivity). */
function morphPass(
  mask: Uint8Array<ArrayBufferLike>,
  width: number,
  height: number,
  grow: boolean,
): Uint8Array<ArrayBufferLike> {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      let v = mask[i];
      const check = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
        const ni = ny * width + nx;
        if (grow) {
          if (mask[ni]) v = 1;
        } else if (!mask[ni]) {
          v = 0;
        }
      };
      check(x - 1, y);
      check(x + 1, y);
      check(x, y - 1);
      check(x, y + 1);
      out[i] = v;
    }
  }
  return out;
}

/**
 * Distância de cada pixel ao pixel de fundo mais próximo, por chanfro 3-4 em
 * duas varreduras — O(2n), em vez das N dilatações que a mesma resposta
 * custaria. O resultado vem em terços de pixel (3 = 1px, 4 ≈ diagonal).
 */
function distanceToBackground(bg: Uint8Array<ArrayBufferLike>, width: number, height: number) {
  const INF = 1 << 28;
  const d = new Int32Array(bg.length);
  for (let i = 0; i < bg.length; i += 1) d[i] = bg[i] ? 0 : INF;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      let v = d[i];
      if (x > 0 && d[i - 1] + 3 < v) v = d[i - 1] + 3;
      if (y > 0 && d[i - width] + 3 < v) v = d[i - width] + 3;
      if (x > 0 && y > 0 && d[i - width - 1] + 4 < v) v = d[i - width - 1] + 4;
      if (x < width - 1 && y > 0 && d[i - width + 1] + 4 < v) v = d[i - width + 1] + 4;
      d[i] = v;
    }
  }
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const i = y * width + x;
      let v = d[i];
      if (x < width - 1 && d[i + 1] + 3 < v) v = d[i + 1] + 3;
      if (y < height - 1 && d[i + width] + 3 < v) v = d[i + width] + 3;
      if (x < width - 1 && y < height - 1 && d[i + width + 1] + 4 < v) v = d[i + width + 1] + 4;
      if (x > 0 && y < height - 1 && d[i + width - 1] + 4 < v) v = d[i + width - 1] + 4;
      d[i] = v;
    }
  }
  return d;
}

/** Separable box blur over a single-channel float buffer, a few passes ≈ Gaussian. */
function boxBlur(
  values: Float32Array,
  width: number,
  height: number,
  radius: number,
  passes: number,
) {
  let src = values;
  for (let p = 0; p < passes; p += 1) {
    const tmp = new Float32Array(src.length);
    // Horizontal
    for (let y = 0; y < height; y += 1) {
      const row = y * width;
      let sum = 0;
      for (let x = -radius; x <= radius; x += 1)
        sum += src[row + Math.max(0, Math.min(width - 1, x))];
      for (let x = 0; x < width; x += 1) {
        tmp[row + x] = sum / (radius * 2 + 1);
        const nextIn = Math.max(0, Math.min(width - 1, x + radius + 1));
        const nextOut = Math.max(0, Math.min(width - 1, x - radius));
        sum += src[row + nextIn] - src[row + nextOut];
      }
    }
    const out = new Float32Array(tmp.length);
    // Vertical
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let y = -radius; y <= radius; y += 1)
        sum += tmp[Math.max(0, Math.min(height - 1, y)) * width + x];
      for (let y = 0; y < height; y += 1) {
        out[y * width + x] = sum / (radius * 2 + 1);
        const nextIn = Math.max(0, Math.min(height - 1, y + radius + 1));
        const nextOut = Math.max(0, Math.min(height - 1, y - radius));
        sum += tmp[nextIn * width + x] - tmp[nextOut * width + x];
      }
    }
    src = out;
  }
  return src;
}

/**
 * A foto JÁ chega sem fundo.
 *
 * As três editoriais novas vieram recortadas de fora (Photoroom), e passá-las
 * pelo pipeline não seria só desperdício: seria estrago. O preenchimento
 * começa pela borda e a referência de fundo é a mediana dela — numa imagem já
 * transparente essa borda lê RGB (0,0,0), então "fundo" viraria sinônimo de
 * "escuro" e a passagem comeria o cabelo e as partes pretas da estampa que
 * encostam na silhueta. Fora que o alfa original, com meio-tom nas bordas, seria
 * jogado fora e substituído por um recorte pior.
 *
 * O corte de 2% separa com folga os dois casos medidos: as fotos de estúdio da
 * Shopify chegam com 0% de pixel translúcido e as recortadas, com 46 a 52%.
 */
export function isAlreadyCutOut(data: Uint8ClampedArray, count: number) {
  let clear = 0;
  for (let i = 0; i < count; i += 1) {
    if (data[i * 4 + 3] < 250) clear += 1;
  }
  return clear / count > 0.02;
}

/** Bounding box (fractional) and a downsampled hit-test mask from the final alpha channel. */
export function measureProduct(alpha: Float32Array, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { bbox: null, mask: null };

  const bbox = {
    x: minX / width,
    y: minY / height,
    width: (maxX - minX + 1) / width,
    height: (maxY - minY + 1) / height,
  };

  const mask = new Uint8ClampedArray(MASK_SIZE * MASK_SIZE);
  for (let my = 0; my < MASK_SIZE; my += 1) {
    const sy = Math.min(height - 1, Math.floor(((my + 0.5) / MASK_SIZE) * height));
    for (let mx = 0; mx < MASK_SIZE; mx += 1) {
      const sx = Math.min(width - 1, Math.floor(((mx + 0.5) / MASK_SIZE) * width));
      mask[my * MASK_SIZE + mx] = alpha[sy * width + sx];
    }
  }
  return { bbox, mask };
}

export function cutoutMask(imageData: ImageData) {
  const { data, width, height } = imageData;
  const count = width * height;
  const localRef = makeLocalBackdropSampler(data, width, height);

  // Cache each pixel's own local reference once — it's read several times
  // below (fill, soft edge, decontamination) and bilinear lerp isn't free.
  const refR = new Float32Array(count);
  const refG = new Float32Array(count);
  const refB = new Float32Array(count);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const [r, g, b] = localRef(x, y);
      refR[i] = r;
      refG[i] = g;
      refB[i] = b;
    }
  }
  const refAt = (i: number): [number, number, number] => [refR[i], refG[i], refB[i]];

  // Quem PARECE fundo, pixel a pixel, sem olhar conectividade. O preenchimento
  // abaixo lê daqui em vez de recalcular a distância a cada visita, e a etapa
  // 1b precisa do mapa inteiro, inclusive das partes que a borda não alcança.
  const nearBg = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) {
    if (backdropDistanceSquared(data, i, refAt(i)) <= CORE_TOLERANCE_SQUARED) nearBg[i] = 1;
  }

  // --- 1. Flood-fill from the border, tolerant only within CORE_TOLERANCE,
  // against each pixel's own local reference instead of one global average.
  const visited = new Uint8Array(count);
  let bg: Uint8Array<ArrayBufferLike> = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0;
  let tail = 0;
  const seed = (x: number, y: number) => {
    const i = y * width + x;
    if (visited[i]) return;
    visited[i] = 1;
    if (nearBg[i]) {
      bg[i] = 1;
      queue[tail] = i;
      tail += 1;
    }
  };
  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }
  while (head < tail) {
    const i = queue[head];
    head += 1;
    const x = i % width;
    const y = (i / width) | 0;
    const tryNeighbor = (nx: number, ny: number) => {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
      const ni = ny * width + nx;
      if (visited[ni]) return;
      visited[ni] = 1;
      if (nearBg[ni]) {
        bg[ni] = 1;
        queue[tail] = ni;
        tail += 1;
      }
    };
    tryNeighbor(x - 1, y);
    tryNeighbor(x + 1, y);
    tryNeighbor(x, y - 1);
    tryNeighbor(x, y + 1);
  }

  // --- 1b. Fundo visto ATRÁS de uma barreira fina.
  //
  // O passo 1 só alcança o que está ligado à borda, e entre os fios de cabelo
  // louro das fotos editoriais sobram bolsões do branco do estúdio inteiramente
  // cercados por cabelo — era esse o branco que continuava aparecendo no
  // cabelo. Cor não distingue esses bolsões do branco que está PINTADO no
  // produto: os dois são o mesmo branco. O que distingue é a geometria — um
  // bolsão desses é, por definição, fundo separado do fundo por uma barreira
  // fina, o fio; o branco da estampa está no meio da peça, longe de qualquer
  // borda. Daí a régua ser a distância à silhueta (ver BACKDROP_LEAK_RADIUS).
  //
  // A propagação percorre o bolsão inteiro a partir de qualquer ponto dele que
  // esteja ao alcance, e não só os pixels ao alcance: cortar metade de um
  // bolsão deixaria uma borda serrilhada no lugar de um buraco limpo.
  const distance = distanceToBackground(bg, width, height);
  const leakLimit = BACKDROP_LEAK_RADIUS * 3;
  const leak = new Uint8Array(count);
  head = 0;
  tail = 0;
  for (let i = 0; i < count; i += 1) {
    if (!bg[i] && nearBg[i] && distance[i] <= leakLimit) {
      leak[i] = 1;
      queue[tail] = i;
      tail += 1;
    }
  }
  while (head < tail) {
    const i = queue[head];
    head += 1;
    const x = i % width;
    const y = (i / width) | 0;
    const spread = (nx: number, ny: number) => {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
      const ni = ny * width + nx;
      if (leak[ni] || bg[ni] || !nearBg[ni]) return;
      leak[ni] = 1;
      queue[tail] = ni;
      tail += 1;
    };
    spread(x - 1, y);
    spread(x + 1, y);
    spread(x, y - 1);
    spread(x, y + 1);
  }
  for (let i = 0; i < count; i += 1) if (leak[i]) bg[i] = 1;

  // --- 2. Close thin leaks: a 1px-wide bridge of near-backdrop pixels can
  // let the fill above carve into the product along it. Eroding then
  // dilating the background mask (a morphological "opening") snaps any
  // protrusion no wider than that back to solid foreground, without
  // measurably moving the real, wide backdrop boundary.
  // Duas passagens, e não uma: com a tolerância mais estreita sobram
  // intrusões um pouco maiores do fundo dentro do assunto (as reentrâncias
  // que apareciam no colo), e um raio de 1px não fechava todas.
  bg = morphPass(bg, width, height, false);
  bg = morphPass(bg, width, height, false);
  bg = morphPass(bg, width, height, true);
  bg = morphPass(bg, width, height, true);

  // --- 3. Erode the background mask outward by one more pixel — i.e.
  // shrink the KEPT product by 1px at its edge. That outer ring is where
  // the original studio photo's own anti-aliasing already blended product
  // and backdrop before this ever reached a browser; keeping it produces
  // a faint fringe no local-reference fill can distinguish from product.
  bg = morphPass(bg, width, height, true);

  // --- 4. Soft edge: within ~2px of the bg/foreground boundary, alpha
  // eases between the two tolerance bands instead of cutting at 0/1.
  const alpha = new Float32Array(count);
  for (let i = 0; i < count; i += 1) alpha[i] = bg[i] ? 0 : 255;

  const isBoundary = new Uint8Array(count);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const here = bg[i];
      const differs =
        (x > 0 && bg[i - 1] !== here) ||
        (x < width - 1 && bg[i + 1] !== here) ||
        (y > 0 && bg[i - width] !== here) ||
        (y < height - 1 && bg[i + width] !== here);
      if (differs) isBoundary[i] = 1;
    }
  }
  // Grow the boundary ring by one so the soft band is a few pixels wide,
  // not a single-pixel seam.
  const band = morphPass(isBoundary, width, height, true);
  for (let i = 0; i < count; i += 1) {
    if (!band[i]) continue;
    const d = Math.sqrt(backdropDistanceSquared(data, i, refAt(i)));
    const t = Math.sqrt(EDGE_TOLERANCE_SQUARED);
    const c = Math.sqrt(CORE_TOLERANCE_SQUARED);
    // d <= core -> 0 (background); d >= edge tolerance -> 255 (kept);
    // between the two, ease linearly.
    const eased = Math.max(0, Math.min(1, (d - c) / Math.max(1, t - c)));
    alpha[i] = eased * 255;
  }

  // --- 5. Real feather: a couple of box-blur passes over the alpha
  // channel (radius 1) approximate a soft Gaussian edge, replacing the
  // old one-shot "subtract alpha per background neighbour" hack.
  const blurred = boxBlur(alpha, width, height, 1, 2);

  // --- 6. Colour decontamination: for any pixel that ended up partially
  // transparent, its own RGB is still a blend with the backdrop (that's
  // what made it partially transparent in the first place, or how the
  // source photo anti-aliased it originally). Unmix it against the local
  // reference so the kept sliver of colour is the product's, not a pale
  // wash of the backdrop bleeding through — that wash is the "amateur
  // cutout" halo.
  for (let i = 0; i < count; i += 1) {
    const a = blurred[i] / 255;
    if (a <= 0.02 || a >= 0.98) continue;
    const pi = i * 4;
    const [rr, rg, rb] = refAt(i);
    data[pi] = Math.max(0, Math.min(255, rr + (data[pi] - rr) / a));
    data[pi + 1] = Math.max(0, Math.min(255, rg + (data[pi + 1] - rg) / a));
    data[pi + 2] = Math.max(0, Math.min(255, rb + (data[pi + 2] - rb) / a));
  }
  for (let i = 0; i < count; i += 1) {
    data[i * 4 + 3] = Math.round(blurred[i]);
  }

  // --- 7. Measure the actual product silhouette this pass produced — the
  // bounding box and hit-test mask every consumer wants instead of
  // guessing from the photo's own frame (see CutoutResult).
  return measureProduct(blurred, width, height);
}
