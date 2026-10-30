import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { assertSameOrigin, handle, HttpError, json, parseBody, rateLimit } from "@/lib/api";
import { SESSION_COOKIE, SESSION_TTL, signSession } from "@/lib/session";
import { loginInput } from "@/lib/validation";

// Constant-time-ish dummy hash so unknown emails take as long as wrong passwords.
let dummy: string | undefined;
const dummyHash = () => (dummy ??= bcrypt.hashSync("not-a-real-password", 12));

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  rateLimit(req, "login", 8, 60_000);
  const { email, password } = await parseBody(req, loginInput);
  const [admin] = await db.select().from(s.admins).where(eq(s.admins.email, email)).limit(1);
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? dummyHash());
  if (!admin || !ok) throw new HttpError(401, "Неверная почта или пароль");
  await db.update(s.admins).set({ lastLoginAt: new Date() }).where(eq(s.admins.id, admin.id));
  const token = await signSession({ sub: String(admin.id), email: admin.email, name: admin.name });
  const res = json({ data: { email: admin.email, name: admin.name } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && !process.env.INSECURE_COOKIES,
    path: "/",
    maxAge: SESSION_TTL,
  });
  return res;
});
