import { unlink } from "node:fs/promises";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { handle, HttpError, json, requireAdmin } from "@/lib/api";
import { resolveUpload } from "@/lib/storage";

export const DELETE = handle(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin(req);
  const id = Number((await ctx.params).id);
  const [row] = await db.delete(s.media).where(eq(s.media.id, id)).returning();
  if (!row) throw new HttpError(404, "Файл не найден");
  const file = resolveUpload(row.url.replace(/^\/uploads\//, "").split("/"));
  if (file) await unlink(file).catch(() => {});
  return json({ ok: true });
});
