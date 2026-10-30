import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { defaultContent, type SiteContent } from "@/lib/content";

export type EventView = s.Event & { artist: s.Artist | null; venue: s.Venue | null };

export const TAGS = {
  content: "content",
  events: "events",
  artists: "artists",
  venues: "venues",
  projects: "projects",
} as const;

async function withRelations(rows: s.Event[]): Promise<EventView[]> {
  const artistIds = [...new Set(rows.map((r) => r.artistId).filter((v): v is number => v != null))];
  const venueIds = [...new Set(rows.map((r) => r.venueId).filter((v): v is number => v != null))];
  const [artists, venues] = await Promise.all([
    artistIds.length ? db.select().from(s.artists).where(inArray(s.artists.id, artistIds)) : [],
    venueIds.length ? db.select().from(s.venues).where(inArray(s.venues.id, venueIds)) : [],
  ]);
  return rows.map((r) => ({
    ...r,
    artist: artists.find((a) => a.id === r.artistId) ?? null,
    venue: venues.find((v) => v.id === r.venueId) ?? null,
  }));
}

export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.content);
  const rows = await db.select().from(s.settings);
  const out = { ...defaultContent } as SiteContent;
  for (const r of rows) {
    if (r.key in out) (out as Record<string, unknown>)[r.key] = r.value;
  }
  return out;
}

/** Published & sold-out events that have not finished yet, soonest first. */
export async function getUpcomingEvents(): Promise<EventView[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events, TAGS.artists, TAGS.venues);
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(s.events)
    .where(and(inArray(s.events.status, ["published", "sold_out"]), gte(s.events.startsAt, since)))
    .orderBy(asc(s.events.startsAt));
  return withRelations(rows);
}

export async function getEventBySlug(slug: string): Promise<EventView | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events, `event:${slug}`);
  const rows = await db
    .select()
    .from(s.events)
    .where(and(eq(s.events.slug, slug), inArray(s.events.status, ["published", "sold_out", "cancelled"])))
    .limit(1);
  if (!rows.length) return null;
  return (await withRelations(rows))[0];
}

export async function getEventSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events);
  const rows = await db
    .select({ slug: s.events.slug })
    .from(s.events)
    .where(inArray(s.events.status, ["published", "sold_out", "cancelled"]));
  return rows.map((r) => r.slug);
}

export async function getProjects(): Promise<s.Project[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.projects);
  return db.select().from(s.projects).where(eq(s.projects.published, true)).orderBy(asc(s.projects.position), desc(s.projects.year));
}

export async function getProjectBySlug(slug: string): Promise<s.Project | null> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.projects);
  const rows = await db
    .select()
    .from(s.projects)
    .where(and(eq(s.projects.slug, slug), eq(s.projects.published, true)))
    .limit(1);
  return rows[0] ?? null;
}
