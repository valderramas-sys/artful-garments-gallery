import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import hueAsset from "@/assets/perfect_hue_1.jpg.asset.json";
import bubblesAsset from "@/assets/bubbles_10.png.asset.json";

export function Hero() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOffset(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToProducts = () => {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-24 pb-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[22%] left-1/2 h-[85vh] w-[85vh] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background: "var(--gradient-sheen)",
          transform: `translate3d(-50%, ${offset * 0.12}px, 0)`,
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1600px] flex-1 grid-rows-[auto_1fr_auto] gap-10 px-5 sm:px-8">
        <div className="flex items-start justify-between">
          <p className="label-xs max-w-[16ch] text-muted-foreground">
            Autoral streetwear
            <br />
            Studio edition
          </p>
          <p className="label-xs text-right text-blue">
            SS/26
            <br />
            <span className="text-pink">Limited 120</span>
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div
            className="relative w-full max-w-[880px] overflow-hidden rounded-sm"
            style={{ transform: `translate3d(0, ${offset * -0.05}px, 0)` }}
          >
            <img
              src={hueAsset.url}
              alt="Rhytmo campaign environment: luminous glass corridor with green foliage"
              width={1920}
              height={1080}
              className="h-[38vh] w-full object-cover sm:h-[46vh]"
            />
            <img
              src={bubblesAsset.url}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-6 -bottom-10 w-40 opacity-90 mix-blend-screen sm:w-56"
              style={{ transform: `translate3d(0, ${offset * 0.18}px, 0)` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex items-end justify-between gap-6">
            <Logo className="h-8 w-40 text-foreground sm:h-12 sm:w-64" />
            <button
              type="button"
              onClick={scrollToProducts}
              className="label-xs rounded-full bg-green px-8 py-4 text-primary-foreground transition-all duration-250 hover:bg-green-deep hover:tracking-[0.24em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
            >
              Shop
            </button>
          </div>
          <h1 className="display text-[16vw] leading-[0.82] sm:text-[13vw]">
            Air<span className="text-blue">/</span>Form
          </h1>
        </div>
      </div>
    </section>
  );
}
