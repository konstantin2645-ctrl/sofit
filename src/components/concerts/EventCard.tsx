import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { EventView } from "@/lib/data";
import { GEL_COLORS, zoned } from "@/lib/format";
import { priceFrom } from "@/lib/view";
import { TiltCard } from "@/components/concerts/TiltCard";

export function EventCard({ e, priority = false }: { e: EventView; priority?: boolean }) {
  const z = zoned(e.startsAt, e.venue?.timezone);
  const price = priceFrom(e);
  return (
    <article style={{ "--gel": GEL_COLORS[e.gel] } as React.CSSProperties}>
      <Link href={`/concerts/${e.slug}`} className="group block" aria-label={`${e.title}, ${z.day} ${z.monthGen}, ${e.venue?.city ?? ""}`}>
        <TiltCard>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-stage">
            {e.cover && (
              <ViewTransition name={`event-cover-${e.slug}`}>
                <Image
                  src={e.cover}
                  alt=""
                  fill
                  priority={priority}
                  sizes="(min-width:1280px) 30vw, (min-width:768px) 45vw, 92vw"
                  className="object-cover transition-transform duration-[1.1s] ease-[var(--ease-stage)] group-hover:scale-[1.06]"
                />
              </ViewTransition>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
            <div
              aria-hidden
              className="absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-700 group-hover:opacity-100"
              style={{ background: "radial-gradient(circle at var(--px,50%) var(--py,30%), color-mix(in oklab, var(--gel) 45%, transparent), transparent 55%)" }}
            />
            <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
              <span className="flex items-baseline gap-2">
                <span className="display text-[3.25rem] leading-none tabular-nums">{String(z.day).padStart(2, "0")}</span>
                <span className="text-sm leading-tight text-paper/85">
                  {z.monthGen}
                  <br />
                  {z.weekday}, {z.time}
                </span>
              </span>
              {e.status === "sold_out" ? (
                <span className="rounded-full border border-paper/40 px-3 py-1 text-xs text-paper/85">Солд-аут</span>
              ) : e.status === "cancelled" ? (
                <span className="rounded-full bg-danger px-3 py-1 text-xs text-black">Отменён</span>
              ) : (
                <span className="text-xs text-paper/70">{e.ageLimit}+</span>
              )}
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="mb-2 flex items-center gap-2 text-sm text-paper/80">
                <span className="gel-dot" />
                {e.genre}
              </p>
              <h2 className="h-card text-[clamp(1.35rem,2vw,1.75rem)]">{e.title}</h2>
            </div>
          </div>
        </TiltCard>
        <div className="mt-4 flex items-start justify-between gap-4">
          <p className="min-w-0 text-paper/85">
            <span className="block truncate">{e.venue?.name}</span>
            <span className="block text-sm text-dim">{e.venue?.city}</span>
          </p>
          <p className="shrink-0 text-right">
            {e.status === "sold_out" ? <span className="text-dim">Нет билетов</span> : price ? <span>от {price}</span> : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
