import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError, type ZodType } from "zod";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** Rejects cross-site state-changing requests (defence in depth on top of SameSite cookies). */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, "Запрос с другого домена отклонён");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(403, "Некорректный заголовок Origin");
  }
}

export async function requireAdmin(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) throw new HttpError(401, "Требуется вход в админ-панель");
  if (req.method !== "GET") assertSameOrigin(req);
  return session;
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Тело запроса должно быть JSON");
  }
  return schema.parse(raw);
}

export function handle<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      unstable_rethrow(e); // let Next.js handle its own control-flow errors (prerender bail-outs etc.)
      if (e instanceof HttpError) return fail(e.message, e.status, e.details);
      if (e instanceof ZodError) {
        return fail("Проверьте заполнение полей", 422, e.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
      }
      const code = (e as { code?: string })?.code ?? (e as { cause?: { code?: string } })?.cause?.code;
      if (code === "23505") return fail("Запись с таким адресом (slug) уже существует", 409);
      console.error(e);
      return fail("Внутренняя ошибка сервера", 500);
    }
  };
}

export function bust(...tags: string[]) {
  for (const t of tags) revalidateTag(t, { expire: 0 });
}

// --- tiny in-memory rate limiter (per process) ---
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(req: NextRequest, scope: string, limit: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > limit) throw new HttpError(429, "Слишком много запросов. Попробуйте через минуту.");
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
}
