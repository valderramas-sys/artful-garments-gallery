import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ShopifyProduct } from "@/lib/shopify";
import { bubbleLayout } from "@/lib/bubble-layout";
import { ProductBubble } from "./ProductBubble";

/**
 * Product discovery surface: single-line horizontal floating track.
 * All bubbles share the exact same unified diameter and sit on one single row.
 */
export function BubbleField({ products }: { products: ShopifyProduct[] }) {
  const navigate = useNavigate();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const layout = useMemo(
    () => products.map((product, i) => ({ product, ...bubbleLayout(product.node.id, i) })),
    [products],
  );

  const handlePop = useCallback(
    (product: ShopifyProduct) => {
      navigate({ to: "/shop/$handle", params: { handle: product.node.handle } });
    },
    [navigate],
  );

  // Wheel delegation: enables smooth horizontal exploration on mouse wheel
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft += e.deltaY;
        }
      }
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-6">
      <ul
        ref={trackRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPreviewingId(null);
        }}
        className="bubble-track mx-auto flex w-full max-w-full flex-nowrap items-center justify-start sm:justify-center gap-10 px-8 py-10 sm:gap-16 sm:px-12 lg:gap-20 lg:px-16 select-none"
      >
        {layout.map(({ product, animDelay, animDuration }) => (
          <ProductBubble
            key={product.node.id}
            product={product}
            animDelay={animDelay}
            animDuration={animDuration}
            isPreviewing={previewingId === product.node.id}
            onPreview={setPreviewingId}
            onPop={handlePop}
          />
        ))}
      </ul>
    </div>
  );
}
