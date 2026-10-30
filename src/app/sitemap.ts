import type { MetadataRoute } from "next";
import { getProjects, getUpcomingEvents } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, projects] = await Promise.all([getUpcomingEvents(), getProjects()]);
  const pages = ["", "/concerts", "/services", "/portfolio", "/contacts"].map((p) => ({
    url: `${SITE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  return [
    ...pages,
    ...events.map((e) => ({ url: `${SITE}/concerts/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "daily" as const, priority: 0.9 })),
    ...projects.map((p) => ({ url: `${SITE}/portfolio/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
