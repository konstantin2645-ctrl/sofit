import type { Metadata } from "next";
import { Suspense } from "react";
import { EventCard } from "@/components/concerts/EventCard";
import { Filters } from "@/components/concerts/Filters";
import { getUpcomingEvents, type EventView } from "@/lib/data";
import { filterEvents, filterOptions, readFilters } from "@/lib/filters";
import { pluralRu, zoned } from "@/lib/format";

export const metadata: Metadata = {
  title: "Афиша концертов",
  description: "Все концерты, туры и фестивали SOFIT: поиск по артистам, городам, датам и жанрам. Покупка билетов онлайн.",
  alternates: { canonical: "/concerts" },
};

function monthsOf(events: EventView[]) {
  const seen = new Map<string, { from: string; to: string; label: string }>();
  const firstYear = events[0] ? zoned(events[0].startsAt).year : 0;
  for (const e of events) {
    const z = zoned(e.startsAt);
    const key = `${z.year}-${String(z.month + 1).padStart(2, "0")}`;
    if (seen.has(key)) continue;
    const last = new Date(Date.UTC(z.year, z.month + 1, 0)).getUTCDate();
    seen.set(key, { from: `${key}-01`, to: `${key}-${last}`, label: z.year === firstYear ? z.monthNom : `${z.monthNom} ${z.year}` });
  }
  return [...seen.values()];
}

async function Results({ searchParams }: { searchParams: PageProps<"/concerts">["searchParams"] }) {
  const [sp, events] = await Promise.all([searchParams, getUpcomingEvents()]);
  const filters = readFilters(sp);
  const list = filterEvents(events, filters);
  return (
    <>
      <p className="meta mb-8" aria-live="polite">
        {list.length
          ? `Найдено ${list.length} ${pluralRu(list.length, "событие", "события", "событий")}`
          : "Ничего не нашлось"}
      </p>
      {list.length ? (
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e, i) => (
            <EventCard key={e.id} e={e} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="border-y border-[var(--line)] py-20">
          <p className="h-card max-w-xl">По этим условиям концертов нет. Уберите часть фильтров или выберите другой месяц.</p>
        </div>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-sm bg-stage" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-stage" />
        </div>
      ))}
    </div>
  );
}

export default async function ConcertsPage(props: PageProps<"/concerts">) {
  const events = await getUpcomingEvents();
  const opts = filterOptions(events);
  return (
    <div className="wrap pb-28 pt-32 md:pt-44">
      <header className="mb-12 grid gap-6 md:mb-16 lg:grid-cols-12 lg:items-end">
        <h1 className="display text-[clamp(3.5rem,12vw,11rem)] lg:col-span-7">Афиша</h1>
        <p className="lead lg:col-span-5">
          {events.length} {pluralRu(events.length, "концерт", "концерта", "концертов")} в {opts.cities.length}{" "}
          {pluralRu(opts.cities.length, "городе", "городах", "городах")}. Билеты продаём сами — без наценок и посредников.
        </p>
      </header>
      <div className="mb-12">
        <Suspense fallback={<div className="h-[148px]" />}>
          <Filters artists={opts.artists} cities={opts.cities} genres={opts.genres} months={monthsOf(events)} />
        </Suspense>
      </div>
      <Suspense fallback={<GridSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
