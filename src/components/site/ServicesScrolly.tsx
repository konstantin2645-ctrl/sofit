"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Service } from "@/lib/content";

/** Scrollytelling: the stage photo on the left changes as each service enters the light. */
export function ServicesScrolly({ services }: { services: Service[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="hidden lg:col-span-6 lg:block">
        <div className="sticky top-28 aspect-[4/5] max-h-[calc(100svh-9rem)] w-full overflow-hidden rounded-sm bg-stage">
          <div className="absolute inset-0">
          {services.map((s, i) => (
            <Image
              key={s.slug}
              src={s.image}
              alt=""
              fill
              sizes="50vw"
              className="object-cover transition-[opacity,transform,filter] duration-[1.1s] ease-[var(--ease-stage)]"
              style={{
                opacity: active === i ? 1 : 0,
                transform: active === i ? "scale(1)" : "scale(1.08)",
                filter: active === i ? "none" : "blur(6px)",
              }}
            />
          ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <p className="display absolute bottom-6 left-6 text-[clamp(3rem,6vw,6rem)] tabular-nums text-paper/90" aria-hidden>
            {String(active + 1).padStart(2, "0")}
            <span className="text-paper/30">/{String(services.length).padStart(2, "0")}</span>
          </p>
        </div>
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        {services.map((s, i) => (
          <section
            key={s.slug}
            id={s.slug}
            data-index={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`scroll-mt-28 border-t border-[var(--line)] py-14 transition-opacity duration-700 lg:flex lg:min-h-[80svh] lg:flex-col lg:justify-center ${
              active === i ? "lg:opacity-100" : "lg:opacity-30"
            }`}
          >
            <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-sm lg:hidden">
              <Image src={s.image} alt="" fill sizes="92vw" className="object-cover" />
            </div>
            <h2 lang="ru" className="h-section text-[clamp(1.7rem,2.6vw,2.5rem)] [hyphens:auto]">{s.title}</h2>
            <p className="lead mt-6">{s.lead}</p>
            <ul className="mt-8 space-y-3">
              {s.points.map((pt) => (
                <li key={pt} className="flex gap-4 text-paper/85">
                  <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-spot shadow-[0_0_10px_2px_rgb(255_197_110/.5)]" />
                  {pt}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
