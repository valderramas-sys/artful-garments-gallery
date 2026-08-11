import mp4 from "@/assets/hero.mp4.asset.json";
import webm from "@/assets/hero.webm.asset.json";
import poster from "@/assets/hero-poster.webp.asset.json";

export const backdropPoster = poster.url;

/**
 * Same animated blue artwork as before, delivered as a compressed looping
 * video instead of a 13 MB GIF. Visually identical, ~60x lighter.
 */
export function Backdrop({ className = "" }: { className?: string }) {
  return (
    <video
      aria-hidden
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster.url}
      disablePictureInPicture
      className={`pointer-events-none h-full w-full object-cover object-center ${className}`}
    >
      <source src={webm.url} type="video/webm" />
      <source src={mp4.url} type="video/mp4" />
    </video>
  );
}
