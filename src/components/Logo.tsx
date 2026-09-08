// Gerado por scripts/build-logo.mjs; a master de 6483 px vive em assets/logo.
const LOGO_URL = "/logo/RhytmoWordmark.webp";

// Full two-line lockup — the RHYTMO wordmark on top, a katakana subtitle
// beneath it. A previous pass cropped the subtitle out to keep the
// wordmark large inside a short header; reversed on feedback ("a logo
// não aparece inteira"). No more crop wrapper needed — the whole image
// renders, sized by height alone (aspect-ratio computes the width).
const IMAGE_RATIO = 6483 / 1404;

// No built-in w-auto/h-auto here on purpose: the header constrains height
// and needs width free to follow, the home panel (index.tsx) constrains
// width instead. Baking in a sizing axis would fight whichever caller
// needs the other one, and — since both classes would carry equal
// Tailwind specificity — the winner would depend on internal utility
// ordering, not on which one appears later in `className`.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="RHYTMO"
      className={`block shrink-0 transition-[filter] duration-250 ease-[var(--ease-out-soft)] group-hover:brightness-125 ${className}`}
      style={{ aspectRatio: IMAGE_RATIO }}
    />
  );
}
