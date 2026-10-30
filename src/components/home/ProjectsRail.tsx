"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type RailProject = {
  slug: string;
  title: string;
  category: string;
  year: number;
  city: string;
  cover: string | null;
  gel: string;
  stat?: { value: string; label: string };
};

/** Desktop: the page pins and the projects travel sideways like a camera dolly. Mobile: native swipe. */
export function ProjectsRail({ projects, heading }: { projects: RailProject[]; heading: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const t = track.current!;
      const distance = () => t.scrollWidth - window.innerWidth;
      const tween = gsap.to(t, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]", t).forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -8 },
          {
            xPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} className="relative overflow-hidden py-20 lg:flex lg:h-[100svh] lg:items-center lg:py-0" aria-labelledby="projects-title">
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] lg:snap-none lg:gap-8 lg:overflow-visible">
        <div className="flex w-[82vw] shrink-0 snap-start flex-col justify-end pb-2 sm:w-[60vw] lg:w-[34vw] lg:pr-10">{heading}</div>
        {projects.map((p, i) => (
          <Link
            key={p.slug}
            href={`/portfolio/${p.slug}`}
            className="group relative block w-[82vw] shrink-0 snap-start sm:w-[60vw] lg:w-[46vw]"
            style={{ "--gel": p.gel } as React.CSSProperties}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-stage lg:aspect-[16/10]">
              {p.cover && (
                <div data-parallax className="absolute inset-[-8%]">
                  <Image
                    src={p.cover}
                    alt={p.title}
                    fill
                    sizes="(min-width:1024px) 46vw, 82vw"
                    className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-stage)] group-hover:scale-[1.04]"
                    priority={i < 2}
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              {p.stat && (
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <span className="display text-[clamp(2rem,4vw,3.5rem)] text-paper">{p.stat.value}</span>
                  <span className="max-w-[12rem] text-right text-sm text-paper/80">{p.stat.label}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-start justify-between gap-6">
              <h3 className="h-card transition-colors group-hover:text-spot">{p.title}</h3>
              <span className="meta shrink-0 pt-1 tabular-nums">{p.year}</span>
            </div>
            <p className="meta mt-1 flex items-center gap-2">
              <span className="gel-dot !h-2 !w-2" />
              {p.category}, {p.city}
            </p>
          </Link>
        ))}
        <div className="w-px shrink-0 lg:w-[8vw]" aria-hidden />
      </div>
    </section>
  );
}
