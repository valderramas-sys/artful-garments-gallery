import { useEffect, useState } from "react";

import {
  cutoutMask,
  isAlreadyCutOut,
  measureProduct,
  DEFAULT_MAX_DIMENSION,
  MASK_SIZE,
  type CutoutResult,
} from "@/lib/cutout/pipeline";
import type { CutoutRequest, CutoutResponse } from "@/lib/cutout/worker";

export {
  PDP_CUTOUT_DIMENSION,
  THUMB_CUTOUT_DIMENSION,
  type CutoutResult,
} from "@/lib/cutout/pipeline";

/**
 * Coordena o recorte por pixel: cache, fila e a ponte com o worker.
 *
 * A matemática está em src/lib/cutout/pipeline.ts e roda em
 * src/lib/cutout/worker.ts. Aqui não se toca em pixel nenhum — este arquivo
 * decide QUANDO recortar, guarda o resultado e entrega para o React.
 */

const cache = new Map<string, CutoutResult>();
const inflight = new Map<string, Promise<CutoutResult>>();

const keyOf = (src: string, maxDimension: number) => `${maxDimension}|${src}`;

// --- O download, uma vez por foto ----------------------------------------

/**
 * Cada foto é baixada UMA vez e o Blob fica guardado por URL — não pela chave
 * do recorte.
 *
 * A distinção importa: o palco recorta a 1920 e a tira de miniaturas recorta a
 * mesma foto a 256, que são duas entradas diferentes em `cache`. Baixar por
 * recorte dobrava o tráfego de cada foto, e ainda somava o pedido da própria
 * `<img>` que a exibe — três viagens para um arquivo. Guardando o Blob, a
 * segunda passagem e a exibição saem daqui.
 */
type Loaded = { blob: Blob; url: string } | null;
const loaded = new Map<string, Promise<Loaded>>();

function loadPhoto(src: string): Promise<Loaded> {
  const hit = loaded.get(src);
  if (hit) return hit;
  const request = fetch(src, { mode: "cors", credentials: "omit" })
    .then(async (response) => {
      if (!response.ok) return null;
      const blob = await response.blob();
      return { blob, url: URL.createObjectURL(blob) };
    })
    .catch(() => null);
  loaded.set(src, request);
  return request;
}

// --- A ponte com o worker -------------------------------------------------

type Waiting = (response: CutoutResponse) => void;

let worker: Worker | null = null;
/** null = ainda não tentamos; false = tentamos e não dá (SSR, navegador sem suporte). */
let workerUsable: boolean | null = null;
const waiting = new Map<number, Waiting>();
let nextId = 1;

function getWorker() {
  if (workerUsable === false) return null;
  if (worker) return worker;
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    workerUsable = false;
    return null;
  }
  // OffscreenCanvas é o que o worker usa para desenhar; sem ele, o plano B
  // síncrono é a única saída.
  if (typeof OffscreenCanvas === "undefined") {
    workerUsable = false;
    return null;
  }
  try {
    worker = new Worker(new URL("../lib/cutout/worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<CutoutResponse>) => {
      const resolve = waiting.get(event.data.id);
      if (!resolve) return;
      waiting.delete(event.data.id);
      resolve(event.data);
    };
    // Um worker que morre não pode deixar promessas penduradas: todo mundo que
    // esperava recebe o resultado vazio, que os chamadores já sabem tratar
    // (mostrar a foto original, sem normalização de tamanho nem teste de acerto).
    worker.onerror = () => {
      workerUsable = false;
      worker = null;
      for (const [id, resolve] of waiting) {
        resolve({ id, blob: null, aspectRatio: 1, bbox: null, mask: null, maskSize: MASK_SIZE });
      }
      waiting.clear();
    };
    workerUsable = true;
    return worker;
  } catch {
    workerUsable = false;
    return null;
  }
}

async function cutoutInWorker(
  active: Worker,
  src: string,
  maxDimension: number,
): Promise<CutoutResult> {
  const photo = await loadPhoto(src);
  if (!photo) return { src, aspectRatio: 1, bbox: null, mask: null, maskSize: MASK_SIZE };

  return new Promise<CutoutResult>((resolve) => {
    const id = nextId;
    nextId += 1;
    waiting.set(id, (response) => {
      resolve({
        // Uma blob: URL, e não o data-URL de antes: o PNG de uma foto de
        // 1434×1920 vira alguns megabytes de string em base64, guardados no
        // cache do módulo pela sessão inteira. A blob: URL é uma referência.
        // Quando não houve recorte, a URL do próprio arquivo já baixado — que
        // poupa da `<img>` uma ida à rede.
        src: response.blob ? URL.createObjectURL(response.blob) : photo.url,
        aspectRatio: response.aspectRatio,
        bbox: response.bbox,
        mask: response.mask,
        maskSize: response.maskSize,
      });
    });
    active.postMessage({ id, blob: photo.blob, maxDimension } satisfies CutoutRequest);
  });
}

// --- Plano B: o mesmo pipeline, na linha principal ------------------------

async function cutoutOnMainThread(src: string, maxDimension: number): Promise<CutoutResult> {
  const photo = await loadPhoto(src);
  if (!photo) return { src, aspectRatio: 1, bbox: null, mask: null, maskSize: MASK_SIZE };

  return new Promise<CutoutResult>((resolve) => {
    const bail = (aspectRatio = 1) =>
      resolve({ src: photo.url, aspectRatio, bbox: null, mask: null, maskSize: MASK_SIZE });

    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("2D context unavailable");

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        if (isAlreadyCutOut(imageData.data, width * height)) {
          const alpha = new Float32Array(width * height);
          for (let i = 0; i < alpha.length; i += 1) alpha[i] = imageData.data[i * 4 + 3];
          const { bbox, mask } = measureProduct(alpha, width, height);
          resolve({ src: photo.url, aspectRatio: width / height, bbox, mask, maskSize: MASK_SIZE });
          return;
        }

        const { bbox, mask } = cutoutMask(imageData);
        ctx.putImageData(imageData, 0, 0);
        // WebP pelo mesmo motivo do worker: o recorte de uma foto em PNG passa
        // de 1 MB e fica guardado pela sessão. `toBlob` cai para PNG sozinho
        // quando o tipo pedido não existe no navegador.
        canvas.toBlob(
          (blob) => {
            resolve({
              src: blob ? URL.createObjectURL(blob) : photo.url,
              aspectRatio: width / height,
              bbox,
              mask,
              maskSize: MASK_SIZE,
            });
          },
          "image/webp",
          0.92,
        );
      } catch {
        // Decodificação falha. Contaminação de canvas não entra mais aqui: a
        // foto é desenhada a partir de uma blob: URL, que é sempre da mesma
        // origem, então nem a CDN da Shopify precisa colaborar com CORS.
        bail(img.naturalWidth / img.naturalHeight || 1);
      }
    };
    img.onerror = () => bail();
    img.src = photo.url;
  });
}

function cutoutBackground(src: string, maxDimension: number): Promise<CutoutResult> {
  // A chave inclui o teto: a mesma foto recortada a 900 e a 1920 são dois
  // resultados diferentes e não podem se sobrescrever no cache.
  const key = keyOf(src, maxDimension);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;

  const active = getWorker();
  const promise = (
    active ? cutoutInWorker(active, src, maxDimension) : cutoutOnMainThread(src, maxDimension)
  )
    .then((result) => {
      cache.set(key, result);
      return result;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/**
 * Roda o recorte de uma foto ANTES de ela ser exibida, só para deixá-lo no
 * cache.
 *
 * É o que faz a seta do palco trocar de produto sem um buraco no meio: quando
 * a foto vizinha entra em cena ela precisa já estar pronta. Não devolve nada e
 * nunca rejeita — é adiantamento de trabalho, não uma dependência de ninguém.
 */
export function prewarmCutout(src: string | null | undefined, maxDimension: number) {
  if (!src || typeof window === "undefined") return;
  if (cache.has(keyOf(src, maxDimension))) return;
  void cutoutBackground(src, maxDimension);
}

/**
 * Adianta uma FILA de fotos.
 *
 * A página do produto precisa de todas as fotos da collab prontas, não só das
 * duas vizinhas: as setas do palco andam por foto e por produto no mesmo
 * percurso, e uma foto fria no meio do caminho vira aquela travada entre a peça
 * sair de cena e a próxima entrar.
 *
 * Com o worker, as oito podem ser despachadas de uma vez: ele tem uma fila só
 * e processa em ordem, e a linha principal não paga nada por isso. `gapMs` só
 * tem efeito no plano B síncrono, onde disparar tudo junto travaria a página
 * por segundos seguidos — que era exatamente o problema antes do worker.
 *
 * Devolve a função que cancela o que ainda não começou.
 */
export function prewarmCutoutQueue(
  srcs: Array<string | null | undefined>,
  maxDimension: number,
  gapMs = 220,
) {
  if (typeof window === "undefined") return () => {};
  const pending = srcs.filter(
    (s): s is string => typeof s === "string" && s.length > 0 && !cache.has(keyOf(s, maxDimension)),
  );
  let cancelled = false;
  let timer: number | undefined;

  // A rede pode andar em paralelo com tudo, e o recorte não: dispara os
  // downloads todos de uma vez, para que quando a vez de cada foto chegar
  // sobre só o trabalho de pixel. É o MESMO Blob que o recorte usa depois —
  // loadPhoto guarda por URL, então isto não é um pedido a mais.
  for (const src of pending) void loadPhoto(src);

  if (getWorker()) {
    for (const src of pending) {
      if (cancelled) break;
      void cutoutBackground(src, maxDimension);
    }
    return () => {
      cancelled = true;
    };
  }

  const step = (at: number) => {
    if (cancelled || at >= pending.length) return;
    void cutoutBackground(pending[at], maxDimension).then(() => {
      if (cancelled) return;
      timer = window.setTimeout(() => step(at + 1), gapMs);
    });
  };
  step(0);

  return () => {
    cancelled = true;
    if (timer) window.clearTimeout(timer);
  };
}

/** Product photo with its background flood-cut away, once ready — plus the real product bounding box and a hit-test mask (see CutoutResult). */
export function useCutoutImage(
  src: string | null,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): CutoutResult | null {
  const [result, setResult] = useState<CutoutResult | null>(() =>
    src ? (cache.get(keyOf(src, maxDimension)) ?? null) : null,
  );

  useEffect(() => {
    if (!src) {
      setResult(null);
      return;
    }
    const cached = cache.get(keyOf(src, maxDimension));
    if (cached) {
      setResult(cached);
      return;
    }
    let cancelled = false;
    cutoutBackground(src, maxDimension).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [src, maxDimension]);

  return result;
}
