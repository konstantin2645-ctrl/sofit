import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { bust, handle, HttpError, json, parseBody, requireAdmin } from "@/lib/api";
import { TAGS } from "@/lib/data";
import { orderPatch } from "@/lib/validation";

export const PATCH = handle(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin(req);
  const id = Number((await ctx.params).id);
  const { status } = await parseBody(req, orderPatch);
  const row = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(s.orders).where(eq(s.orders.id, id)).for("update");
    if (!order) throw new HttpError(404, "Заказ не найден");
    if (order.status === status) return order;
    // Return or re-take seats when an order is cancelled / restored.
    const delta = status === "cancelled" ? -order.quantity : order.status === "cancelled" ? order.quantity : 0;
    if (delta) {
      const [event] = await tx.select().from(s.events).where(eq(s.events.id, order.eventId)).for("update");
      if (event) {
        const tiers = event.tiers.map((t) => (t.name === order.tier ? { ...t, sold: Math.max(0, t.sold + delta) } : t));
        const t = tiers.find((x) => x.name === order.tier);
        if (t && t.sold > t.total) throw new HttpError(409, "Мест в этой категории больше нет — восстановить заказ нельзя");
        const soldOut = tiers.every((x) => x.sold >= x.total);
        const nextStatus = event.status === "sold_out" && !soldOut ? "published" : soldOut && event.status === "published" ? "sold_out" : event.status;
        await tx.update(s.events).set({ tiers, status: nextStatus, updatedAt: new Date() }).where(eq(s.events.id, event.id));
      }
    }
    const [updated] = await tx.update(s.orders).set({ status, updatedAt: new Date() }).where(eq(s.orders.id, id)).returning();
    return updated;
  });
  bust(TAGS.events);
  return json({ data: row });
});
