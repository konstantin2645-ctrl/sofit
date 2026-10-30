"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MediaItem } from "@/db/schema";

/** Photo + video gallery with a keyboard/swipe friendly lightbox. */
export function Gallery({ items, title }: { items: MediaItem[]; title: string }) {
  const [idx, setIdx] = useState<number | null>(null);
  const close = useCallback(() => setIdx(null), []);
  const go = useCallback((d: number) => setIdx((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (idx === null) return;
    window.__lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      window.__lenis?.start();
    };
  }, [idx, close, go]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
        {items.map((m, i) => {
          // 6-col rhythm: big (4×2) + two small, then wide (4) + small — rows always close.
          const k = i % 5;
          const span = k === 0 ? "col-span-2 md:col-span-4 md:row-span-2" : k === 3 ? "col-span-2 md:col-span-4" : k === 4 ? "col-span-2 md:col-span-2" : "col-span-1 md:col-span-2";
          return (
            <li key={i} className={span}>
              <button
                type="button"
                onClick={() => setIdx(i)}
                className="group relative block h-full min-h-[10rem] w-full overflow-hidden rounded-sm bg-stage"
                aria-label={`Открыть ${m.type === "video" ? "видео" : "фото"} ${i + 1} из ${items.length}`}
              >
                <div className={`relative w-full ${k === 0 ? "aspect-[4/3] md:h-full md:aspect-auto" : k === 3 ? "aspect-[4/3] md:aspect-[21/10]" : k === 4 ? "aspect-[4/3] md:h-full md:aspect-auto" : "aspect-[4/3]"}`}>
                  <Image
                    src={m.type === "video" ? (m.poster ?? "/media/hero-poster.jpg") : m.src}
                    alt={m.caption ?? `${title}, ${i + 1}`}
                    fill
                    sizes={k === 0 || k === 3 ? "(min-width:768px) 66vw, 100vw" : "(min-width:768px) 33vw, 50vw"}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                {m.type === "video" && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-paper text-black transition-transform duration-500 group-hover:scale-110">
                      <svg viewBox="0 0 12 12" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M2 1l9 5-9 5z" />
                      </svg>
                    </span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {idx !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр медиа"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <motion.div
              key={idx}
              className="relative h-[78vh] w-[92vw]"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) go(1);
                else if (info.offset.x > 80) go(-1);
              }}
            >
              {items[idx].type === "video" ? (
                <video src={items[idx].src} poster={items[idx].poster} controls autoPlay playsInline className="h-full w-full object-contain" />
              ) : (
                <Image src={items[idx].src} alt={items[idx].caption ?? title} fill sizes="92vw" className="object-contain" />
              )}
            </motion.div>
            <p className="meta absolute bottom-6 left-1/2 -translate-x-1/2 tabular-nums">
              {idx + 1} / {items.length}
              {items[idx].caption ? `, ${items[idx].caption}` : ""}
            </p>
            <button type="button" onClick={close} autoFocus className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full border border-[var(--line-strong)]" aria-label="Закрыть">
              <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M5 5l14 14M19 5 5 19" />
              </svg>
            </button>
            <button type="button" onClick={() => go(-1)} className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[var(--line-strong)] md:grid" aria-label="Предыдущее">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[var(--line-strong)] md:grid" aria-label="Следующее">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
