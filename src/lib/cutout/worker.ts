/**
 * O recorte, fora da linha principal.
 *
 * Motivo, medido antes de escrever isto: a página do produto acumulava 2,8 s
 * de bloqueio no carregamento, com uma única tarefa de 649 ms. É o pipeline de
 * pipeline.ts, que é síncrono e passa várias vezes por alguns milhões de
 * pixels — e a fila de adiantamento faz isso oito vezes, uma por parada do
 * rolo. Enquanto rodava na linha principal, nada respondia: nem clique, nem
 * rolagem, nem animação. Aqui, o custo continua o mesmo e some da percepção.
 *
 * O canal é um pedido por mensagem, casado por `id`; quem coordena é
 * src/hooks/useCutoutImage.ts, que mantém o cache e a fila.
 */
/// <reference lib="webworker" />
import { cutoutMask, isAlreadyCutOut, measureProduct, MASK_SIZE } from "./pipeline";

// O tsconfig do projeto carrega a lib "DOM", então `self` chegaria aqui tipado
// como Window — o que rejeita o terceiro argumento de postMessage (a lista de
// transferência) e esconderia erros de verdade.
declare const self: DedicatedWorkerGlobalScope;

/**
 * A foto chega como Blob, já baixada. Quem baixa é a linha principal, uma vez
 * por URL: o palco e a tira de miniaturas recortam a MESMA foto em tetos
 * diferentes (1920 e 256), e um `fetch` aqui dentro por recorte fazia dois
 * downloads do mesmo arquivo — mais o da `<img>` que o exibe.
 */
export type CutoutRequest = { id: number; blob: Blob; maxDimension: number };

export type CutoutResponse = {
  id: number;
  /** PNG do recorte, ou null quando a foto já veio sem fundo e o original serve. */
  blob: Blob | null;
  aspectRatio: number;
  bbox: { x: number; y: number; width: number; height: number } | null;
  mask: Uint8ClampedArray | null;
  maskSize: number;
};

self.onmessage = async (event: MessageEvent<CutoutRequest>) => {
  const { id, blob: source, maxDimension } = event.data;

  const fail = (aspectRatio = 1) =>
    self.postMessage({
      id,
      blob: null,
      aspectRatio,
      bbox: null,
      mask: null,
      maskSize: MASK_SIZE,
    } satisfies CutoutResponse);

  try {
    const bitmap = await createImageBitmap(source);

    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fail(bitmap.width / bitmap.height);

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const imageData = ctx.getImageData(0, 0, width, height);

    let blob: Blob | null = null;
    let bbox: CutoutResponse["bbox"];
    let mask: Uint8ClampedArray | null;

    if (isAlreadyCutOut(imageData.data, width * height)) {
      // Nada a recortar. Ainda assim medimos: o bbox e a máscara são o que
      // enquadra a peça no palco e responde ao ponteiro. Devolver blob null
      // faz o chamador reaproveitar a URL original, que o navegador já tem.
      const alpha = new Float32Array(width * height);
      for (let i = 0; i < alpha.length; i += 1) alpha[i] = imageData.data[i * 4 + 3];
      ({ bbox, mask } = measureProduct(alpha, width, height));
    } else {
      ({ bbox, mask } = cutoutMask(imageData));
      ctx.putImageData(imageData, 0, 0);
      // WebP, e não PNG. O recorte fica guardado pela sessão inteira, e em PNG
      // a foto da modelo 0.3 — a única editorial que ainda é recortada aqui —
      // dava 1,1 MB, porque PNG é compressão sem perda de fotografia. O mesmo
      // recorte em WebP a 0,92 fica na casa das dezenas de KB, com o canal
      // alfa preservado. Os gorros, que são formas chapadas sobre transparência,
      // já eram pequenos em PNG e continuam pequenos aqui.
      blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
      // Navegador sem codificador WebP em worker devolve PNG mesmo assim; se
      // devolver outra coisa qualquer, o PNG é o caminho garantido.
      if (!blob || (blob.type !== "image/webp" && blob.type !== "image/png")) {
        blob = await canvas.convertToBlob({ type: "image/png" });
      }
    }

    const message: CutoutResponse = {
      id,
      blob,
      aspectRatio: width / height,
      bbox,
      mask,
      maskSize: MASK_SIZE,
    };
    // A máscara vai por transferência: 48×48 é pouco, mas são oito por sessão
    // e copiar não serve para nada — este lado não olha mais para ela.
    self.postMessage(message, mask ? [mask.buffer] : []);
  } catch {
    // Canvas contaminado por CORS, decodificação falha, rede fora: o chamador
    // trata bbox null como "mostre a foto original e pule a normalização".
    fail();
  }
};
