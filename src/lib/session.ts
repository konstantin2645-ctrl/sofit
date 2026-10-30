// Edge/Node-safe session helpers (used by proxy and route handlers).
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "sofit_session";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = { sub: string; email: string; name: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set and at least 32 characters long");
  return new TextEncoder().encode(secret);
}

export async function signSession(p: SessionPayload) {
  return new SignJWT({ email: p.email, name: p.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return { sub: String(payload.sub), email: String(payload.email), name: String(payload.name) };
  } catch {
    return null;
  }
}
