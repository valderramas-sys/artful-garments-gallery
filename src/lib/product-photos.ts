/**
 * Editorial second photo per beanie (never shared between products).
 *
 * Não são as masters do lookbook: são os recortes "do pescoço para cima"
 * gerados por scripts/crop-model-photos.mjs, que põem as quatro no mesmo
 * enquadramento da 0.3 (a única que já vinha fechada). As masters continuam em
 * public/images como entrada do script.
 *
 * As três primeiras passaram depois por remoção de fundo fora do projeto e já
 * chegam transparentes — useCutoutImage detecta isso e não as recorta de novo
 * (ver isAlreadyCutOut). A 0.3 ainda vem com o branco do estúdio e é recortada
 * no navegador como sempre.
 */
const SECOND_PHOTOS: Record<string, string> = {
  "0.1": "/images/paradela-01-head.webp",
  "0.2": "/images/paradela-02-head.webp",
  "0.3": "/images/paradela-03-head.webp",
  "0.4": "/images/paradela-04-head.webp",
};

/** Resolves the model photo that belongs to a given product, if any. */
export function secondPhoto(title: string, handle: string) {
  const key = Object.keys(SECOND_PHOTOS).find(
    (k) => title.includes(k) || handle.includes(k.replace(".", "-")) || handle.endsWith(k.slice(2)),
  );
  return key ? SECOND_PHOTOS[key] : null;
}
