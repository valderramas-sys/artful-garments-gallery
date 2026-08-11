import p01 from "@/assets/paradela-01-b.png.asset.json";
import p02 from "@/assets/paradela-02-c.png.asset.json";
import p03 from "@/assets/paradela-03-b.png.asset.json";
import p04 from "@/assets/paradela-04-b.png.asset.json";

/** Editorial second photo per beanie (never shared between products). */
export const SECOND_PHOTOS: Record<string, string> = {
  "0.1": p01.url,
  "0.2": p02.url,
  "0.3": p03.url,
  "0.4": p04.url,
};

/** Resolves the model photo that belongs to a given product, if any. */
export function secondPhoto(title: string, handle: string) {
  const key = Object.keys(SECOND_PHOTOS).find(
    (k) => title.includes(k) || handle.includes(k.replace(".", "-")) || handle.endsWith(k.slice(2)),
  );
  return key ? SECOND_PHOTOS[key] : null;
}
