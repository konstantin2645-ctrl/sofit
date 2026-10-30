import type { NextRequest } from "next/server";
import { db, schema as s } from "@/db";
import { bust, handle, json, parseBody, requireAdmin } from "@/lib/api";
import { defaultContent } from "@/lib/content";
import { TAGS } from "@/lib/data";
import { settingsInput } from "@/lib/validation";

export const GET = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const rows = await db.select().from(s.settings);
  const out: Record<string, unknown> = { ...defaultContent };
  for (const r of rows) out[r.key] = r.value;
  return json({ data: out });
});

export const PUT = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const patch = await parseBody(req, settingsInput);
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    await db
      .insert(s.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: s.settings.key, set: { value, updatedAt: new Date() } });
  }
  bust(TAGS.content);
  return json({ ok: true });
});
