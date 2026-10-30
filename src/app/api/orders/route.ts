import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { assertSameOrigin, bust, handle, HttpError, json, parseBody, rateLimit } from "@/lib/api";
import { TAGS } from "@/lib/data";
import { orderInput } from "@/lib/validation";

function code() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "SF-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  rateLimit(req, "order", 10, 10 * 60_000);
  const input = await parseBody(req, orderInput);

  const order = await db.transaction(async (tx) => {
    const [event] = await tx
      .select()
      .from(s.events)
      .where(eq(s.events.id, input.eventId))
      .for("update");
    if (!event || event.status !== "published") throw new HttpError(409, "Продажа билетов на это событие закрыта");
    if (event.startsAt.getTime() < Date.now()) throw new HttpError(409, "Событие уже прошло");
    const tiers = [...event.tiers];
    const idx = tiers.findIndex((t) => t.name === input.tier);
    if (idx < 0) throw new HttpError(422, "Такой категории билетов нет");
    const left = tiers[idx].total - tiers[idx].sold;
    if (left < input.quantity) {
      throw new HttpError(409, left > 0 ? `Осталось только ${left} билет(а) в этой категории` : "Билеты этой категории закончились");
    }
    tiers[idx] = { ...tiers[idx], sold: tiers[idx].sold + input.quantity };
    const soldOut = tiers.every((t) => t.sold >= t.total);
    await tx
      .update(s.events)
      .set({ tiers, status: soldOut ? "sold_out" : event.status, updatedAt: sql`now()` })
      .where(eq(s.events.id, event.id));
    const [row] = await tx
      .insert(s.orders)
      .values({
        code: code(),
        eventId: event.id,
        tier: input.tier,
        quantity: input.quantity,
        amount: tiers[idx].price * input.quantity,
        name: input.name,
        email: input.email,
        phone: input.phone,
      })
      .returning();
    return row;
  });

  bust(TAGS.events);
  return json({ data: { code: order.code, amount: order.amount, quantity: order.quantity, tier: order.tier } }, 201);
});
