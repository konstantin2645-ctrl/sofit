import type { EventView } from "@/lib/data";
import { currencyFor, formatPrice, GEL_COLORS, zoned } from "@/lib/format";
import type { ProgrammeRow } from "@/components/home/Programme";

export function priceFrom(e: EventView) {
  if (!e.tiers.length) return null;
  const min = Math.min(...e.tiers.map((t) => t.price));
  return formatPrice(min, currencyFor(e.venue?.country));
}

export function toProgrammeRow(e: EventView): ProgrammeRow {
  const z = zoned(e.startsAt, e.venue?.timezone);
  return {
    slug: e.slug,
    title: e.title,
    subtitle: e.subtitle,
    day: String(z.day).padStart(2, "0"),
    month: z.monthGen,
    weekday: z.weekday,
    time: z.time,
    city: e.venue?.city ?? "",
    venue: e.venue?.name ?? "",
    priceFrom: priceFrom(e),
    soldOut: e.status === "sold_out",
    gel: GEL_COLORS[e.gel],
    cover: e.cover,
  };
}
