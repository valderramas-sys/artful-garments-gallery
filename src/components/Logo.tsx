import logoAsset from "@/assets/RhytmoPrincipal_Logo.svg.asset.json";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Rhytmo"
      className={`block bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${logoAsset.url})`,
        maskImage: `url(${logoAsset.url})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
