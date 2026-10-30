import type { NextRequest } from "next/server";
import { and, count, eq, gte, inArray, ne, sum } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { handle, json, requireAdmin } from "@/lib/api";

export const GET = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const now = new Date();
  const [[upcoming], [drafts], [newLeads], [orders], [artists], [venues], [projects]] = await Promise.all([
    db.select({ n: count() }).from(s.events).where(and(inArray(s.events.status, ["published", "sold_out"]), gte(s.events.startsAt, now))),
    db.select({ n: count() }).from(s.events).where(eq(s.events.status, "draft")),
    db.select({ n: count() }).from(s.leads).where(eq(s.leads.status, "new")),
    db.select({ n: count(), revenue: sum(s.orders.amount), tickets: sum(s.orders.quantity) }).from(s.orders).where(ne(s.orders.status, "cancelled")),
    db.select({ n: count() }).from(s.artists),
    db.select({ n: count() }).from(s.venues),
    db.select({ n: count() }).from(s.projects),
  ]);
  const sales = await db
    .select({ id: s.events.id, title: s.events.title, slug: s.events.slug, startsAt: s.events.startsAt, tiers: s.events.tiers, status: s.events.status })
    .from(s.events)
    .where(and(inArray(s.events.status, ["published", "sold_out"]), gte(s.events.startsAt, now)))
    .orderBy(s.events.startsAt)
    .limit(8);
  return json({
    data: {
      upcoming: upcoming.n,
      drafts: drafts.n,
      newLeads: newLeads.n,
      orders: orders.n,
      tickets: Number(orders.tickets ?? 0),
      revenue: Number(orders.revenue ?? 0),
      artists: artists.n,
      venues: venues.n,
      projects: projects.n,
      sales: sales.map((e) => {
        const total = e.tiers.reduce((a, t) => a + t.total, 0);
        const sold = e.tiers.reduce((a, t) => a + t.sold, 0);
        return { id: e.id, title: e.title, slug: e.slug, startsAt: e.startsAt, status: e.status, total, sold };
      }),
    },
  });
});
