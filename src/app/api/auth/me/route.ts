import type { NextRequest } from "next/server";
import { handle, json, requireAdmin } from "@/lib/api";

export const GET = handle(async (req: NextRequest) => {
  const session = await requireAdmin(req);
  return json({ data: { email: session.email, name: session.name } });
});
