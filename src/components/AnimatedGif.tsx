import { useEffect, useRef, useState } from "react";

/**
 * Renders an animated GIF that always restarts playing after a page refresh,
 * bfcache restore, or when the tab becomes visible again on mobile Safari.
 * The source file is untouched — only the <img> element is re-primed.
 */
export function AnimatedGif({
  src,
  className = "",
  fetchPriority,
}: {
  src: string;
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const restart = () => setNonce((n) => n + 1);

    // Initial prime after hydration so a cached, already-decoded GIF
    // (which Safari can paint frozen on its first frame) starts over.
    restart();

    const onVisible = () => {
      if (document.visibilityState === "visible") restart();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) restart();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // Same bytes, distinct URL per prime → the decoder restarts from frame 0.
  const url = nonce === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}p=${nonce}`;

  return (
    <img
      ref={ref}
      key={nonce}
      src={url}
      alt=""
      aria-hidden
      decoding="async"
      fetchPriority={fetchPriority}
      className={className}
    />
  );
}
