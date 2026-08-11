/**
 * Purely decorative hint that a surface can be dragged horizontally.
 * Never receives pointer events, so existing swipe/click handlers are intact.
 * `tone="dark"` renders a dark translucent glass variant for use over photos.
 */
export function SwipeHint({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const arrow = dark ? "text-white/85" : "text-white";
  const dot = dark ? "bg-white/60" : "bg-white/70";

  return (
    <div
      aria-hidden
      className={`${dark ? "swipe-hint-dark" : "swipe-hint"} pointer-events-none inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`swipe-hint-arrow-left h-3 w-3 ${arrow}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 6 9 12l6 6" />
      </svg>
      <span className={`swipe-hint-dot h-1 w-1 rounded-full ${dot}`} />
      <svg
        viewBox="0 0 24 24"
        className={`swipe-hint-arrow-right h-3 w-3 ${arrow}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </div>
  );
}
