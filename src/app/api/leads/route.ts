import type { NextRequest } from "next/server";
import { db, schema as s } from "@/db";
import { assertSameOrigin, handle, json, parseBody, rateLimit } from "@/lib/api";
import { leadInput } from "@/lib/validation";

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  rateLimit(req, "lead", 5, 10 * 60_000);
  const { consent, website, ...data } = await parseBody(req, leadInput);
  void consent;
  // Bots fill the hidden field — pretend success, store nothing.
  if (website) return json({ ok: true }, 201);
  const [row] = await db.insert(s.leads).values(data).returning({ id: s.leads.id });
  return json({ ok: true, id: row.id }, 201);
});
