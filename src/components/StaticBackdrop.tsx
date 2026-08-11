import still from "@/assets/bg-still.jpg.asset.json";

/**
 * Static, heavily blurred backdrop used on every page except Home and Lab,
 * which keep the animated backdrop.
 */
export function StaticBackdrop({ className = "" }: { className?: string }) {
  return (
    <img
      src={still.url}
      alt=""
      aria-hidden
      decoding="async"
      className={`pointer-events-none h-full w-full scale-110 object-cover object-center blur-[64px] ${className}`}
    />
  );
}
