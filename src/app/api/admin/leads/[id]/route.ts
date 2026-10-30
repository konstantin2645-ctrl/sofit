import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { handle, HttpError, json, parseBody, requireAdmin } from "@/lib/api";
import { leadPatch } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const id = Number((await ctx.params).id);
  const patch = await parseBody(req, leadPatch);
  const [row] = await db.update(s.leads).set({ ...patch, updatedAt: new Date() }).where(eq(s.leads.id, id)).returning();
  if (!row) throw new HttpError(404, "Заявка не найдена");
  return json({ data: row });
});

export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const id = Number((await ctx.params).id);
  const [row] = await db.delete(s.leads).where(eq(s.leads.id, id)).returning();
  if (!row) throw new HttpError(404, "Заявка не найдена");
  return json({ ok: true });
});
