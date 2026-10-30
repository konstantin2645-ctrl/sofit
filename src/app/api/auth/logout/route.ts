import type { NextRequest } from "next/server";
import { assertSameOrigin, handle, json } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
});
