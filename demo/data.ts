/* Demo replacement for src/lib/data.ts: same API, synchronous reads from the browser store. */
import { defaultContent, type SiteContent } from "@/lib/content";
import { store, type Row } from "./store";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type EventView = any;

export const TAGS = { content: "content", events: "events", artists: "artists", venues: "venues", projects: "projects" } as const;

const withRel = (e: Row): EventView => {
  const s = store.get();
  return { ...e, artist: s.artists.find((a) => a.id === e.artistId) ?? null, venue: s.venues.find((v) => v.id === e.venueId) ?? null };
};

export function getContent(): SiteContent {
  return { ...defaultContent, ...store.get().settings } as SiteContent;
}

export function getUpcomingEvents(): EventView[] {
  const since = Date.now() - 6 * 3600 * 1000;
  return store
    .get()
    .events.filter((e) => (e.status === "published" || e.status === "sold_out") && new Date(e.startsAt).getTime() >= since)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map(withRel);
}

export function getEventBySlug(slug: string): EventView | null {
  const e = store.get().events.find((x) => x.slug === slug && x.status !== "draft");
  return e ? withRel(e) : null;
}

export function getEventSlugs() {
  return store.get().events.map((e) => e.slug);
}

export function getProjects(): any[] {
  return store
    .get()
    .projects.filter((p) => p.published)
    .sort((a, b) => a.position - b.position || b.year - a.year);
}

export function getProjectBySlug(slug: string): any {
  return getProjects().find((p) => p.slug === slug) ?? null;
}
