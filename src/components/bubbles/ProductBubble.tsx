import { useEffect, useRef, useState } from "react";
import { productImage, sizedImage, type ShopifyProduct } from "@/lib/shopify";
import { useFloatMotion } from "@/hooks/useFloatMotion";
import { useCutoutImage } from "@/hooks/useCutoutImage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useI18n } from "@/lib/i18n";
import { playSettingsBeep } from "@/lib/sound";
import { reactRobot } from "@/stores/robotStore";

// Trigger → local "popping" animation plays → onPop fires at its midpoint,
// handing off to navigation while the bubble is still visually bursting.
// See Fase 1 plan (§5): a deliberate mid-transition cut, not a full wait.
const POP_HANDOFF_MS = 220;

// Every product photo shares the same frame, but not the same amount of
// that frame is actually garment — object-contain scales the PHOTO, so
// four photos with the product occupying a different fraction of their
// own frame render at four different apparent sizes even inside identical
// boxes. This is the smallest fraction measured across the current
// catalogue (the "gorro 0.4" photo, ~33.6% of its frame's height) — every
// bubble normalises DOWN to match it, never up, so nothing risks being
// scaled past its own box and clipped. A future product smaller than this
// would still look right; one bigger would (correctly) shrink to match.
const TARGET_PRODUCT_HEIGHT_FRACTION = 0.336;
const MIN_NORMALIZE_SCALE = 0.55;
const MAX_NORMALIZE_SCALE = 1.4;
const HOVER_SCALE = 1.05;
// Hit-test threshold on the 0–255 mask — must be comfortably above the
// soft-edge band's low end (see useCutoutImage) so the hover boundary
// reads as "over the product", not "over its last translucent pixels".
const MASK_HIT_THRESHOLD = 60;

export function ProductBubble({
  product,
  animDelay = 0,
  animDuration = 7,
  isPreviewing,
  onPreview,
  onPop,
}: {
  product: ShopifyProduct;
  animDelay?: number;
  animDuration?: number;
  isPreviewing: boolean;
  onPreview: (id: string | null) => void;
  onPop: (product: ShopifyProduct) => void;
}) {
  const { localize } = useI18n();
  const isMobile = useIsMobile();
  const floatStyle = useFloatMotion(product.node.id);
  const [phase, setPhase] = useState<"idle" | "popping">("idle");
  const rootRef = useRef<HTMLLIElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(true);
  // Whether the pointer is over actual product pixels right now — distinct
  // from `isPreviewing`, which the parent still owns and which keyboard
  // focus also sets. See handlePointerMove for how this gets decided.
  const [isOverProduct, setIsOverProduct] = useState(false);

  const node = product.node;
  const image = productImage(product);
  const rawSrc = sizedImage(image, 700) ?? image;
  // Real per-pixel cutout of the (usually white) Shopify photo background —
  // shows the raw photo immediately, then swaps in the transparent version
  // once the canvas pass finishes (see useCutoutImage for how/why). Also
  // carries the product's own bounding box + a hit-test mask, since the
  // same per-pixel pass already has to find the silhouette to cut it out.
  const cutout = useCutoutImage(rawSrc);
  const name = localize(node.title);

  const normalizeScale = cutout?.bbox
    ? Math.max(
        MIN_NORMALIZE_SCALE,
        Math.min(
          MAX_NORMALIZE_SCALE,
          TARGET_PRODUCT_HEIGHT_FRACTION / Math.max(cutout.bbox.height, 0.01),
        ),
      )
    : 1;

  // Pause the ambient float animation for bubbles scrolled out of view —
  // keeps the "not too many things moving at once" restraint from the brief
  // and saves compositor work below the fold.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const triggerPop = () => {
    if (phase === "popping") return;
    setPhase("popping");
    playSettingsBeep();
    reactRobot("discovering");
    window.setTimeout(() => onPop(product), POP_HANDOFF_MS);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // e.detail === 0 means the click was synthesized from a keyboard
    // activation (Enter/Space), not a real pointer click — keyboard users
    // never get a "second tap" requirement.
    const isKeyboardActivation = e.detail === 0;
    if (!isKeyboardActivation && isMobile && !isPreviewing) {
      onPreview(node.id);
      return;
    }
    triggerPop();
  };

  // "Hover" now means over the product's own pixels, not the whole
  // circular button — the button stays fully clickable/focusable at its
  // full size (that's unrelated to this: shrinking the click target would
  // just make the product hard to hit), only the PREVIEW (name reveal +
  // zoom) is gated on the pointer actually being over the garment. The
  // img renders via object-contain inside a square box, so a photo
  // narrower than the box (every current product is portrait, ~0.8:1)
  // is pillarboxed — mapping a pointer position to the mask has to
  // account for that letterboxing, not just the element's own rect.
  const handlePointerMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) return;
    const img = imgRef.current;
    const mask = cutout?.mask;
    if (!img || !mask || !cutout) {
      // No mask yet (still cutting out) — fail open rather than block
      // the preview while the canvas pass finishes.
      if (!isOverProduct) {
        setIsOverProduct(true);
        onPreview(node.id);
      }
      return;
    }
    const rect = img.getBoundingClientRect();
    const boxAspect = rect.width / rect.height;
    const contentAspect = cutout.aspectRatio;
    let renderedW = rect.width;
    let renderedH = rect.height;
    if (contentAspect > boxAspect) {
      renderedH = rect.width / contentAspect;
    } else {
      renderedW = rect.height * contentAspect;
    }
    const offsetX = (rect.width - renderedW) / 2;
    const offsetY = (rect.height - renderedH) / 2;
    const localX = e.clientX - rect.left - offsetX;
    const localY = e.clientY - rect.top - offsetY;
    const fx = localX / renderedW;
    const fy = localY / renderedH;

    let hot = false;
    if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
      const mx = Math.min(cutout.maskSize - 1, Math.floor(fx * cutout.maskSize));
      const my = Math.min(cutout.maskSize - 1, Math.floor(fy * cutout.maskSize));
      hot = mask[my * cutout.maskSize + mx] > MASK_HIT_THRESHOLD;
    }

    // Sem reação do robô aqui: passar o mouse pelos produtos disparava fala a
    // cada bolha e ele ficava tagarelando o tempo todo. Ele agora só fala no
    // clique (ver triggerPop). O hover continua revelando o nome e o zoom.
    if (hot && !isOverProduct) {
      setIsOverProduct(true);
      onPreview(node.id);
    } else if (!hot && isOverProduct) {
      setIsOverProduct(false);
      onPreview(null);
    }
  };

  const handlePointerLeave = () => {
    if (isMobile) return;
    setIsOverProduct(false);
    onPreview(null);
  };

  return (
    <li ref={rootRef} className="relative shrink-0 list-none">
      <button
        type="button"
        onClick={handleClick}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onFocus={() => onPreview(node.id)}
        onBlur={() => onPreview(null)}
        aria-label={name}
        style={
          inView
            ? {
                animationDelay: `${animDelay}s`,
                animationDuration: `${animDuration}s`,
                ...floatStyle,
              }
            : undefined
        }
        className={`bubble-outer bubble-size relative block rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink ${inView ? "animate-bubble-float" : ""}`}
      >
        {/* Sem casca de vidro: o produto flutua solto no cenário. O recorte
            por canvas (useCutoutImage) é o que torna isso possível — a foto
            já vem sem fundo, então não precisa de um invólucro para
            disfarçar a borda. */}
        <span
          data-phase={phase}
          className="group/bubble absolute inset-0 grid place-items-center data-[phase=popping]:animate-bubble-pop"
        >
          {image ? (
            <img
              ref={imgRef}
              src={cutout?.src ?? rawSrc}
              alt=""
              loading="lazy"
              decoding="async"
              className="product-photo relative z-10 h-full w-full object-contain transition-transform duration-350 ease-[var(--ease-out-soft)]"
              style={{ transform: `scale(${normalizeScale * (isOverProduct ? HOVER_SCALE : 1)})` }}
            />
          ) : (
            <div className="relative z-10 h-[60%] w-[60%] rounded-full bg-surface-2/40" />
          )}
        </span>

        <span
          aria-hidden
          className={`bubble-label pointer-events-none absolute top-full left-1/2 z-20 mt-2 w-max max-w-[min(88vw,20.5rem)] -translate-x-1/2 rounded-2xl px-3 py-1.5 text-center text-[11px] leading-snug font-semibold tracking-tight text-white transition-all duration-250 ease-[var(--ease-out-soft)] ${
            isPreviewing && phase === "idle"
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-0"
          }`}
        >
          {name}
        </span>
      </button>
    </li>
  );
}
