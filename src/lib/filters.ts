import type { EventView } from "@/lib/data";

export type Filters = {
  q: string;
  artist: string;
  city: string;
  genre: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

const one = (v: unknown) => (Array.isArray(v) ? String(v[0] ?? "") : typeof v === "string" ? v : "").slice(0, 120);

export function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const date = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  return {
    q: one(sp.q).trim(),
    artist: one(sp.artist),
    city: one(sp.city),
    genre: one(sp.genre),
    from: date(one(sp.from)),
    to: date(one(sp.to)),
  };
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export function filterEvents(events: EventView[], f: Filters) {
  const from = f.from ? new Date(`${f.from}T00:00:00+03:00`).getTime() : -Infinity;
  const to = f.to ? new Date(`${f.to}T23:59:59+03:00`).getTime() : Infinity;
  const q = norm(f.q);
  return events.filter((e) => {
    if (f.artist && e.artist?.slug !== f.artist) return false;
    if (f.city && e.venue?.city !== f.city) return false;
    if (f.genre && e.genre !== f.genre) return false;
    const t = new Date(e.startsAt).getTime();
    if (t < from || t > to) return false;
    if (q) {
      const hay = norm([e.title, e.subtitle, e.artist?.name, e.venue?.name, e.venue?.city, e.genre, ...e.lineup].join(" "));
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

export function filterOptions(events: EventView[]) {
  const uniq = <T,>(arr: T[]) => [...new Set(arr)];
  const artists = new Map<string, string>();
  for (const e of events) if (e.artist) artists.set(e.artist.slug, e.artist.name);
  return {
    artists: [...artists].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "ru")),
    cities: uniq(events.map((e) => e.venue?.city).filter(Boolean) as string[]).sort((a, b) => a.localeCompare(b, "ru")),
    genres: uniq(events.map((e) => e.genre)).sort((a, b) => a.localeCompare(b, "ru")),
  };
}
