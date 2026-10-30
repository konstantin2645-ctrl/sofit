import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { handle, json, requireAdmin } from "@/lib/api";

export const GET = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const rows = await db
    .select({ order: s.orders, eventTitle: s.events.title, eventSlug: s.events.slug, startsAt: s.events.startsAt })
    .from(s.orders)
    .leftJoin(s.events, eq(s.orders.eventId, s.events.id))
    .orderBy(desc(s.orders.createdAt));
  return json({ data: rows.map((r) => ({ ...r.order, eventTitle: r.eventTitle, eventSlug: r.eventSlug, startsAt: r.startsAt })) });
});
