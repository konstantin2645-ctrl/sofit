/* In-browser implementation of the SOFIT REST API for the standalone demo.
   Mirrors src/app/api/** (same validation, same responses) on top of the local store. */
import { ZodError, type ZodType } from "zod";
import {
  artistInput,
  eventInput,
  leadInput,
  leadPatch,
  loginInput,
  orderInput,
  orderPatch,
  projectInput,
  settingsInput,
  venueInput,
} from "@/lib/validation";
import { defaultContent } from "@/lib/content";
import { store, type Row, type State } from "./store";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const DEMO_ADMIN = { email: "admin@sofit.live", password: "sofit-admin-2026", name: "Администратор" };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const now = () => new Date().toISOString();
// JSON round-trip turns Date objects produced by zod into ISO strings, like the real API.
const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function parse<T>(schema: ZodType<T>, body: unknown): T {
  return schema.parse(body);
}
function requireAdmin() {
  if (!store.get().session) throw new HttpError(401, "Требуется вход в админ-панель");
}

const RES: Record<string, { table: keyof State; input: ZodType<Record<string, unknown>> }> = {
  events: { table: "events", input: eventInput as never },
  artists: { table: "artists", input: artistInput as never },
  venues: { table: "venues", input: venueInput as never },
  projects: { table: "projects", input: projectInput as never },
};

async function route(method: string, path: string, body: unknown): Promise<Response> {
  const s = store.get();
  let m: RegExpMatchArray | null;

  // --- auth
  if (path === "/api/auth/login" && method === "POST") {
    const { email, password } = parse(loginInput, body);
    await new Promise((r) => setTimeout(r, 350));
    if (email !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) throw new HttpError(401, "Неверная почта или пароль");
    store.update((st) => (st.session = { email, name: DEMO_ADMIN.name }));
    return json({ data: { email, name: DEMO_ADMIN.name } });
  }
  if (path === "/api/auth/logout") {
    store.update((st) => (st.session = null));
    return json({ ok: true });
  }
  if (path === "/api/auth/me") {
    requireAdmin();
    return json({ data: s.session });
  }

  // --- public
  if (path === "/api/leads" && method === "POST") {
    const { consent, website, ...data } = parse(leadInput, body);
    void consent;
    if (website) return json({ ok: true }, 201);
    const id = store.nextId("leads");
    store.update((st) => st.leads.push({ id, ...data, status: "new", note: "", createdAt: now(), updatedAt: now() }));
    return json({ ok: true, id }, 201);
  }
  if (path === "/api/orders" && method === "POST") {
    const input = parse(orderInput, body);
    const event = s.events.find((e) => e.id === input.eventId);
    if (!event || event.status !== "published") throw new HttpError(409, "Продажа билетов на это событие закрыта");
    if (new Date(event.startsAt).getTime() < Date.now()) throw new HttpError(409, "Событие уже прошло");
    const tiers = event.tiers.map((t: Row) => ({ ...t }));
    const tier = tiers.find((t: Row) => t.name === input.tier);
    if (!tier) throw new HttpError(422, "Такой категории билетов нет");
    const left = tier.total - tier.sold;
    if (left < input.quantity) throw new HttpError(409, left > 0 ? `Осталось только ${left} билет(а) в этой категории` : "Билеты этой категории закончились");
    tier.sold += input.quantity;
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = "SF-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => alphabet[b % alphabet.length]).join("");
    const order = {
      id: store.nextId("orders"), code, eventId: event.id, tier: input.tier, quantity: input.quantity, amount: tier.price * input.quantity,
      name: input.name, email: input.email, phone: input.phone, status: "reserved", createdAt: now(), updatedAt: now(),
    };
    store.update((st) => {
      const e = st.events.find((x) => x.id === event.id)!;
      e.tiers = tiers;
      if (tiers.every((t: Row) => t.sold >= t.total)) e.status = "sold_out";
      st.orders.push(order);
    });
    return json({ data: { code, amount: order.amount, quantity: order.quantity, tier: order.tier } }, 201);
  }

  // --- admin
  if (!path.startsWith("/api/admin/")) throw new HttpError(404, "Не найдено");
  requireAdmin();

  if ((m = path.match(/^\/api\/admin\/(events|artists|venues|projects)(?:\/(\d+))?$/))) {
    const { table, input } = RES[m[1]];
    const rows = s[table] as Row[];
    const id = m[2] ? Number(m[2]) : null;
    if (id === null && method === "GET") return json({ data: rows });
    if (id === null && method === "POST") {
      const data = plain(parse(input, body));
      if (rows.some((r) => r.slug === data.slug)) throw new HttpError(409, "Запись с таким адресом (slug) уже существует");
      const row = { id: store.nextId(table), ...data, createdAt: now(), updatedAt: now() };
      store.update((st) => (st[table] as Row[]).push(row));
      return json({ data: row }, 201);
    }
    const existing = rows.find((r) => r.id === id);
    if (!existing) throw new HttpError(404, "Запись не найдена");
    if (method === "GET") return json({ data: existing });
    if (method === "PUT") {
      const data = plain(parse(input, body));
      if (rows.some((r) => r.slug === data.slug && r.id !== id)) throw new HttpError(409, "Запись с таким адресом (slug) уже существует");
      const row = { ...existing, ...data, updatedAt: now() };
      store.update((st) => ((st[table] as Row[])[(st[table] as Row[]).findIndex((r) => r.id === id)] = row));
      return json({ data: row });
    }
    if (method === "DELETE") {
      store.update((st) => {
        (st as Record<string, unknown>)[table] = (st[table] as Row[]).filter((r) => r.id !== id);
        if (table === "events") st.orders = st.orders.filter((o) => o.eventId !== id);
        if (table === "artists") st.events.forEach((e) => e.artistId === id && (e.artistId = null));
        if (table === "venues") st.events.forEach((e) => e.venueId === id && (e.venueId = null));
      });
      return json({ ok: true });
    }
  }

  if (path === "/api/admin/media" && method === "GET") return json({ data: [...s.media].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) });
  if ((m = path.match(/^\/api\/admin\/media\/(\d+)$/)) && method === "DELETE") {
    store.update((st) => (st.media = st.media.filter((x) => x.id !== Number(m![1]))));
    return json({ ok: true });
  }

  if (path === "/api/admin/leads") return json({ data: [...s.leads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) });
  if ((m = path.match(/^\/api\/admin\/leads\/(\d+)$/))) {
    const id = Number(m[1]);
    if (!s.leads.some((l) => l.id === id)) throw new HttpError(404, "Заявка не найдена");
    if (method === "DELETE") {
      store.update((st) => (st.leads = st.leads.filter((l) => l.id !== id)));
      return json({ ok: true });
    }
    const patch = parse(leadPatch, body);
    let row: Row = {};
    store.update((st) => {
      const l = st.leads.find((x) => x.id === id)!;
      Object.assign(l, patch, { updatedAt: now() });
      row = { ...l };
    });
    return json({ data: row });
  }

  if (path === "/api/admin/orders") {
    const data = [...s.orders]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((o) => {
        const e = s.events.find((x) => x.id === o.eventId);
        return { ...o, eventTitle: e?.title ?? null, eventSlug: e?.slug ?? null, startsAt: e?.startsAt ?? null };
      });
    return json({ data });
  }
  if ((m = path.match(/^\/api\/admin\/orders\/(\d+)$/)) && method === "PATCH") {
    const id = Number(m[1]);
    const { status } = parse(orderPatch, body);
    const order = s.orders.find((o) => o.id === id);
    if (!order) throw new HttpError(404, "Заказ не найден");
    if (order.status !== status) {
      const delta = status === "cancelled" ? -order.quantity : order.status === "cancelled" ? order.quantity : 0;
      const event = s.events.find((e) => e.id === order.eventId);
      if (delta && event) {
        const tiers = event.tiers.map((t: Row) => (t.name === order.tier ? { ...t, sold: Math.max(0, t.sold + delta) } : t));
        const t = tiers.find((x: Row) => x.name === order.tier);
        if (t && t.sold > t.total) throw new HttpError(409, "Мест в этой категории больше нет — восстановить заказ нельзя");
        const soldOut = tiers.every((x: Row) => x.sold >= x.total);
        store.update(() => {
          event.tiers = tiers;
          if (event.status === "sold_out" && !soldOut) event.status = "published";
          else if (soldOut && event.status === "published") event.status = "sold_out";
        });
      }
      store.update(() => Object.assign(order, { status, updatedAt: now() }));
    }
    return json({ data: order });
  }

  if (path === "/api/admin/settings") {
    if (method === "GET") return json({ data: { ...defaultContent, ...s.settings } });
    const patch = plain(parse(settingsInput, body)) as Record<string, unknown>;
    store.update((st) => {
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) st.settings[k] = v;
    });
    return json({ ok: true });
  }

  if (path === "/api/admin/stats") {
    const t = Date.now();
    const upcomingEv = s.events
      .filter((e) => (e.status === "published" || e.status === "sold_out") && new Date(e.startsAt).getTime() >= t)
      .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
    const live = s.orders.filter((o) => o.status !== "cancelled");
    return json({
      data: {
        upcoming: upcomingEv.length,
        drafts: s.events.filter((e) => e.status === "draft").length,
        newLeads: s.leads.filter((l) => l.status === "new").length,
        orders: live.length,
        tickets: live.reduce((a, o) => a + o.quantity, 0),
        revenue: live.reduce((a, o) => a + o.amount, 0),
        artists: s.artists.length,
        venues: s.venues.length,
        projects: s.projects.length,
        sales: upcomingEv.slice(0, 8).map((e) => ({
          id: e.id, title: e.title, slug: e.slug, startsAt: e.startsAt, status: e.status,
          total: e.tiers.reduce((a: number, x: Row) => a + x.total, 0),
          sold: e.tiers.reduce((a: number, x: Row) => a + x.sold, 0),
        })),
      },
    });
  }

  throw new HttpError(404, "Не найдено");
}

async function handle(method: string, path: string, body: unknown) {
  try {
    return await route(method, path, body);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    if (e instanceof ZodError)
      return json({ error: "Проверьте заполнение полей", details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, 422);
    console.error(e);
    return json({ error: "Внутренняя ошибка" }, 500);
  }
}

// --- install: intercept fetch("/api/...")
const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const u = new URL(url, location.href);
  const apiPath = u.pathname.match(/\/api\/.*/)?.[0];
  if (u.origin === location.origin && apiPath && (typeof input === "string" ? input.startsWith("/api/") : true)) {
    let body: unknown = undefined;
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        return json({ error: "Тело запроса должно быть JSON" }, 400);
      }
    }
    await new Promise((r) => setTimeout(r, 120));
    return handle((init?.method ?? "GET").toUpperCase(), apiPath, body);
  }
  return realFetch(input, init);
};

// --- uploads: the admin uploader uses XMLHttpRequest with multipart FormData
async function fileToUrl(file: File): Promise<{ url: string; width: number | null; height: number | null }> {
  if (file.type.startsWith("video/")) return { url: URL.createObjectURL(file), width: null, height: null };
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return { url: c.toDataURL("image/jpeg", 0.82), width: bmp.width, height: bmp.height };
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "video/mp4", "video/webm"];

export class DemoXHR {
  status = 0;
  responseText = "";
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  open() {}
  async send(fd: FormData) {
    const done = (status: number, body: unknown) => {
      this.status = status;
      this.responseText = JSON.stringify(body);
      this.onload?.();
    };
    if (!store.get().session) return done(401, { error: "Требуется вход в админ-панель" });
    const files = fd.getAll("file").filter((f): f is File => f instanceof File);
    const saved: Row[] = [];
    for (const [i, f] of files.entries()) {
      if (!ALLOWED.includes(f.type)) return done(415, { error: `Формат ${f.type || "файла"} не поддерживается. Можно JPG, PNG, WebP, AVIF, GIF, MP4, WebM.` });
      this.upload.onprogress?.({ lengthComputable: true, loaded: i, total: files.length });
      try {
        const { url, width, height } = await fileToUrl(f);
        saved.push({ id: store.nextId("media") + i, url, filename: f.name, mime: f.type, size: f.size, width, height, alt: "", createdAt: now() });
      } catch {
        return done(415, { error: `Файл «${f.name}» повреждён или не является изображением` });
      }
    }
    store.update((st) => st.media.push(...saved));
    this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 1 });
    done(201, { data: saved });
  }
}

// In-page confirmation (the host blocks window.confirm).
export function demoConfirm(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "fixed inset-0 z-[200] grid place-items-center bg-black/75 p-4";
    wrap.innerHTML = `<div role="alertdialog" aria-modal="true" class="a-panel w-full max-w-sm p-6">
      <p class="text-[0.95rem] leading-relaxed"></p>
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" class="a-btn" data-v="0">Отмена</button>
        <button type="button" class="a-btn a-btn-primary" data-v="1">Удалить</button>
      </div></div>`;
    wrap.querySelector("p")!.textContent = text;
    const close = (v: boolean) => {
      wrap.remove();
      resolve(v);
    };
    wrap.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest("button");
      if (b) close(b.dataset.v === "1");
      else if (e.target === wrap) close(false);
    });
    document.body.appendChild(wrap);
    (wrap.querySelector('[data-v="1"]') as HTMLElement).focus();
  });
}

declare global {
  interface Window {
    __DemoXHR: typeof DemoXHR;
    __confirm: typeof demoConfirm;
  }
}
window.__DemoXHR = DemoXHR;
window.__confirm = demoConfirm;
