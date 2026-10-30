import type { NextRequest } from "next/server";
import { getUpcomingEvents } from "@/lib/data";
import { filterEvents, readFilters } from "@/lib/filters";
import { handle, json } from "@/lib/api";

export const GET = handle(async (req: NextRequest) => {
  const filters = readFilters(Object.fromEntries(req.nextUrl.searchParams));
  const events = filterEvents(await getUpcomingEvents(), filters);
  return json({
    data: events.map((e) => ({
      slug: e.slug,
      title: e.title,
      subtitle: e.subtitle,
      startsAt: e.startsAt,
      genre: e.genre,
      status: e.status,
      cover: e.cover,
      artist: e.artist?.name ?? null,
      venue: e.venue ? { name: e.venue.name, city: e.venue.city, address: e.venue.address } : null,
      priceFrom: e.tiers.length ? Math.min(...e.tiers.map((t) => t.price)) : null,
    })),
  });
});
