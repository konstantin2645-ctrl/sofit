"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HeroContent } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

type NextEvent = { slug: string; title: string; date: string; place: string; gel: string } | null;

/**
 * The house lights go down, a follow-spot finds the stage.
 * The spot follows the pointer (or drifts by itself on touch screens).
 */
export function Hero({ hero, next }: { hero: HeroContent; next: NextEvent }) {
  const root = useRef<HTMLElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = root.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Pointer-driven spotlight with easing
    const pos = { x: 0.62, y: 0.38, tx: 0.62, ty: 0.38, r: 0 };
    let raf = 0;
    let t0 = performance.now();
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      pos.tx = (e.clientX - b.left) / b.width;
      pos.ty = (e.clientY - b.top) / b.height;
      t0 = performance.now();
    };
    const loop = (now: number) => {
      if (!fine || now - t0 > 4000) {
        const t = now / 1000;
        pos.tx = 0.5 + Math.sin(t * 0.33) * 0.3;
        pos.ty = 0.36 + Math.sin(t * 0.51 + 1) * 0.14;
      }
      pos.x += (pos.tx - pos.x) * 0.06;
      pos.y += (pos.ty - pos.y) * 0.06;
      spot.current?.style.setProperty("--sx", `${(pos.x * 100).toFixed(2)}%`);
      spot.current?.style.setProperty("--sy", `${(pos.y * 100).toFixed(2)}%`);
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) raf = requestAnimationFrame(loop);
    el.addEventListener("pointermove", onMove);

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-reveal]", { opacity: 1, yPercent: 0 });
        gsap.set(spot.current, { "--sr": "38vmax" });
        return;
      }
      // House lights down → spot on → words rise.
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(spot.current, { "--sr": "0vmax" }, { "--sr": "34vmax", duration: 2.4, ease: "power3.inOut" }, 0.2)
        .fromTo("[data-line]", { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.09 }, 0.9)
        .fromTo("[data-reveal]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 1.4);

      // Leaving the stage: video drifts and the spot narrows.
      gsap.to(video.current, {
        scale: 1.12,
        yPercent: 8,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(spot.current, {
        "--sr": "12vmax",
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero-copy]", {
        yPercent: -18,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: { trigger: el, start: "40% top", end: "bottom top", scrub: true },
      });
    }, el);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  const words = hero.title.split(" ");
  // Two balanced lines for the headline
  const half = Math.ceil(words.length / 2);
  const lines = words.length > 2 ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : [hero.title];

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-black" aria-label="SOFIT">
      <video
        ref={video}
        className="absolute inset-0 h-full w-full origin-center object-cover"
        src={hero.video}
        poster={hero.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      {/* follow-spot: darkness everywhere except a soft circle of light */}
      <div
        ref={spot}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={
          {
            "--sx": "62%",
            "--sy": "38%",
            "--sr": "0vmax",
            background:
              "radial-gradient(circle at var(--sx) var(--sy), rgb(0 0 0 / 0) 0, rgb(0 0 0 / 0.18) calc(var(--sr) * 0.45), rgb(0 0 0 / 0.86) var(--sr), rgb(0 0 0 / 0.94) calc(var(--sr) * 1.8))",
          } as React.CSSProperties
        }
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 overflow-hidden" />

      <div data-hero-copy className="wrap relative flex h-full flex-col justify-end pb-[max(2.5rem,6vh)]">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="display text-[clamp(2.9rem,9.6vw,9.5rem)]">
              {lines.map((l, i) => (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                  <span data-line className="block will-change-transform">
                    {l}
                  </span>
                </span>
              ))}
            </h1>
            <p data-reveal className="lead mt-6 md:mt-8">
              {hero.lead}
            </p>
            <div data-reveal className="mt-8 flex flex-wrap gap-3">
              <Link href="/concerts" className="btn btn-light">
                {hero.primaryCta}
              </Link>
              <Link href="/contacts#form" className="btn btn-ghost">
                {hero.secondaryCta}
              </Link>
            </div>
          </div>

          {next && (
            <Link
              data-reveal
              href={`/concerts/${next.slug}`}
              className="group hidden max-w-sm justify-self-end border-l border-[var(--line-strong)] pl-6 lg:col-span-4 lg:block"
              style={{ "--gel": next.gel } as React.CSSProperties}
            >
              <span className="meta flex items-center gap-2">
                <span className="gel-dot" /> В центре внимания
              </span>
              <span className="h-card mt-3 block transition-colors group-hover:text-spot">{next.title}</span>
              <span className="meta mt-2 block">
                {next.date}, {next.place}
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
