import type { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { handle, json, requireAdmin } from "@/lib/api";

export const GET = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const rows = await db.select().from(s.leads).orderBy(desc(s.leads.createdAt));
  return json({ data: rows });
});
