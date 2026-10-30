"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export type PortfolioItem = {
  slug: string;
  title: string;
  category: string;
  year: number;
  city: string;
  summary: string;
  cover: string | null;
  gel: string;
  hasVideo: boolean;
};

export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const cats = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const [cat, setCat] = useState<string | null>(null);
  const list = cat ? items.filter((i) => i.category === cat) : items;

  return (
    <>
      <div className="no-scrollbar -mx-[var(--gutter)] mb-12 flex gap-2 overflow-x-auto px-[var(--gutter)]" role="group" aria-label="Тип проекта">
        {[null, ...cats].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm transition-colors ${
              cat === c ? "border-spot bg-spot text-black" : "border-[var(--line-strong)] text-paper/85 hover:border-paper"
            }`}
          >
            {c ?? "Все проекты"}
          </button>
        ))}
      </div>
      <motion.ul layout className="grid gap-x-6 gap-y-16 md:grid-cols-12">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => {
            const wide = i % 3 === 0;
            return (
              <motion.li
                layout
                key={p.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={wide ? "md:col-span-12" : "md:col-span-6"}
                style={{ "--gel": p.gel } as React.CSSProperties}
              >
                <Link href={`/portfolio/${p.slug}`} className="group block">
                  <div className={`relative overflow-hidden rounded-sm bg-stage ${wide ? "aspect-[4/3] md:aspect-[21/9]" : "aspect-[4/3]"}`}>
                    {p.cover && (
                      <Image
                        src={p.cover}
                        alt={p.title}
                        fill
                        sizes={wide ? "100vw" : "(min-width:768px) 50vw, 100vw"}
                        priority={i === 0}
                        className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-stage)] group-hover:scale-[1.04]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                    {p.hasVideo && (
                      <span className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs backdrop-blur">
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
                          <path d="M2 1l9 5-9 5z" />
                        </svg>
                        Видео
                      </span>
                    )}
                  </div>
                  <div className={`mt-5 grid gap-3 ${wide ? "md:grid-cols-12" : ""}`}>
                    <div className={wide ? "md:col-span-6" : ""}>
                      <h2 className="h-card text-[clamp(1.35rem,2.2vw,2rem)] transition-colors group-hover:text-spot">{p.title}</h2>
                      <p className="meta mt-2 flex items-center gap-2">
                        <span className="gel-dot !h-2 !w-2" />
                        {p.category}, {p.city}, {p.year}
                      </p>
                    </div>
                    <p className={`text-dim ${wide ? "md:col-span-5 md:col-start-8" : ""}`}>{p.summary}</p>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </>
  );
}
