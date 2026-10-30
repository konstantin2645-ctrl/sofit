"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ProgrammeRow = {
  slug: string;
  title: string;
  subtitle: string;
  day: string;
  month: string;
  weekday: string;
  time: string;
  city: string;
  venue: string;
  priceFrom: string | null;
  soldOut: boolean;
  gel: string;
  cover: string | null;
};

/** The afisha as a theatre programme: rows of dates; on desktop the photo follows the cursor. */
export function Programme({ rows }: { rows: ProgrammeRow[] }) {
  const list = useRef<HTMLUListElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = list.current;
    const pv = preview.current;
    if (!el || !pv) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const p = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    const move = (e: PointerEvent) => {
      p.tx = e.clientX;
      p.ty = e.clientY;
    };
    const loop = () => {
      p.x += (p.tx - p.x) * 0.14;
      p.y += (p.ty - p.y) * 0.14;
      const vx = (p.tx - p.x) * 0.04;
      pv.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) rotate(${Math.max(-8, Math.min(8, vx))}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div className="relative">
      <ul ref={list} className="border-t border-[var(--line)]" onPointerLeave={() => setActive(null)}>
        {rows.map((r, i) => (
          <li key={r.slug} style={{ "--gel": r.gel } as React.CSSProperties}>
            <Link
              href={`/concerts/${r.slug}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={`group relative grid grid-cols-[4.25rem_1fr] items-center gap-x-4 gap-y-1.5 border-b border-[var(--line)] py-5 transition-[opacity,color] duration-500 md:grid-cols-[9rem_1fr_14rem_10rem] md:gap-x-8 md:py-7 ${
                active !== null && active !== i ? "md:opacity-35" : ""
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--gel)_18%,transparent),transparent_70%)] transition-transform duration-700 ease-[var(--ease-stage)] group-hover:scale-x-100"
              />
              <span className="relative row-span-3 flex flex-col self-start md:row-span-1 md:flex-row md:items-baseline md:gap-2 md:self-center">
                <span className="display text-[2.6rem] tabular-nums md:text-[clamp(2.4rem,4.6vw,4.25rem)]">{r.day}</span>
                <span className="mt-1 text-xs leading-tight text-dim md:mt-0 md:text-sm">
                  {r.month}
                  <br />
                  {r.weekday}
                </span>
              </span>
              <span className="relative min-w-0">
                <span className="h-card block truncate transition-colors group-hover:text-spot">{r.title}</span>
                <span className="mt-1 block truncate text-dim">{r.subtitle}</span>
              </span>
              <span className="relative flex min-w-0 items-center gap-2 text-sm text-paper/80 md:text-base">
                <span className="gel-dot" />
                <span className="truncate">
                  {r.city}, {r.venue}
                </span>
              </span>
              <span className="relative col-start-2 text-sm md:col-start-auto md:text-right md:text-base">
                {r.soldOut ? (
                  <span className="text-dim">Билеты проданы</span>
                ) : r.priceFrom ? (
                  <span>от {r.priceFrom}</span>
                ) : null}
                <span className="text-dim md:hidden">{r.soldOut || r.priceFrom ? ", " : ""}начало в {r.time}</span>
                <span className="hidden text-sm text-dim md:block">начало в {r.time}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 hidden aspect-[4/5] w-[min(22vw,320px)] overflow-hidden rounded-sm md:block"
        style={{ opacity: active === null ? 0 : 1, transition: "opacity .35s ease" }}
      >
        {rows.map((r, i) =>
          r.cover ? (
            <Image
              key={r.slug}
              src={r.cover}
              alt=""
              fill
              sizes="320px"
              className="object-cover transition-[opacity,transform] duration-500"
              style={{ opacity: active === i ? 1 : 0, transform: active === i ? "scale(1)" : "scale(1.12)" }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
