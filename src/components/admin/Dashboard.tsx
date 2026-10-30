"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHead } from "./AdminShell";
import { api } from "./client";

type Stats = {
  upcoming: number; drafts: number; newLeads: number; orders: number; tickets: number; revenue: number;
  artists: number; venues: number; projects: number;
  sales: { id: number; title: string; slug: string; startsAt: string; status: string; total: number; sold: number }[];
};
type Lead = { id: number; name: string; company: string; type: string; createdAt: string; status: string; message: string };

const nf = new Intl.NumberFormat("ru-RU");
const LEAD_TYPES: Record<string, string> = { festival: "Концерт / фестиваль", artist: "Тур артиста", corporate: "Корпоратив", partnership: "Партнёрство", other: "Другое" };

export function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => {
    api<{ data: Stats }>("/api/admin/stats").then((r) => setS(r.data)).catch(() => {});
    api<{ data: Lead[] }>("/api/admin/leads").then((r) => setLeads(r.data.slice(0, 5))).catch(() => {});
  }, []);

  const cards = s
    ? [
        { label: "Предстоящих концертов", value: s.upcoming, href: "/admin/events", note: s.drafts ? `и ${s.drafts} в черновиках` : "" },
        { label: "Новых заявок", value: s.newLeads, href: "/admin/leads", note: "ждут ответа" },
        { label: "Билетов продано на сайте", value: nf.format(s.tickets), href: "/admin/orders", note: `${s.orders} заказов` },
        { label: "Выручка с сайта", value: `${nf.format(s.revenue)} ₽`, href: "/admin/orders", note: "без отменённых" },
      ]
    : [];

  return (
    <>
      <PageHead
        title="Обзор"
        sub="Что происходит с афишей, продажами и заявками"
        actions={
          <>
            <Link href="/admin/events/new" className="a-btn a-btn-primary">
              Добавить концерт
            </Link>
            <Link href="/admin/media" className="a-btn">
              Загрузить медиа
            </Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s
          ? cards.map((c) => (
              <Link key={c.label} href={c.href} className="a-panel block p-5 transition-colors hover:border-[var(--line-strong)]">
                <p className="text-sm text-dim">{c.label}</p>
                <p className="mt-3 font-display text-3xl font-light tabular-nums">{c.value}</p>
                <p className="mt-1 text-xs text-mute">{c.note}</p>
              </Link>
            ))
          : Array.from({ length: 4 }).map((_, i) => <div key={i} className="a-panel h-[124px] animate-pulse" />)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="a-panel p-5" aria-labelledby="sales-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="sales-h" className="font-medium">
              Продажи ближайших концертов
            </h2>
            <Link href="/admin/events" className="text-sm text-dim hover:text-paper">
              Все концерты
            </Link>
          </div>
          <ul className="space-y-4">
            {s?.sales.map((e) => {
              const pct = e.total ? Math.round((e.sold / e.total) * 100) : 0;
              return (
                <li key={e.id}>
                  <Link href={`/admin/events/${e.id}`} className="group block">
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="truncate group-hover:text-spot">{e.title}</span>
                      <span className="shrink-0 tabular-nums text-dim">
                        {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(e.startsAt))}, {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
                      <div className={`h-full rounded ${pct >= 90 ? "bg-ok" : "bg-spot"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="a-panel p-5" aria-labelledby="leads-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="leads-h" className="font-medium">
              Последние заявки
            </h2>
            <Link href="/admin/leads" className="text-sm text-dim hover:text-paper">
              Все заявки
            </Link>
          </div>
          {leads.length ? (
            <ul className="divide-y divide-[var(--line)]">
              {leads.map((l) => (
                <li key={l.id} className="py-3">
                  <Link href={`/admin/leads?open=${l.id}`} className="block">
                    <p className="flex items-center gap-2 text-sm">
                      {l.status === "new" && <span className="h-2 w-2 rounded-full bg-spot" aria-label="Новая" />}
                      <span className="font-medium">{l.name}</span>
                      {l.company && <span className="text-dim">, {l.company}</span>}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-dim">
                      {LEAD_TYPES[l.type] ?? l.type}: {l.message}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-dim">Заявок пока нет.</p>
          )}
        </section>
      </div>

      {s && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Артистов", s.artists, "/admin/artists"],
            ["Площадок", s.venues, "/admin/venues"],
            ["Проектов в портфолио", s.projects, "/admin/projects"],
          ].map(([l, v, h]) => (
            <Link key={l as string} href={h as string} className="a-panel flex items-center justify-between p-5 hover:border-[var(--line-strong)]">
              <span className="text-dim">{l}</span>
              <span className="font-display text-2xl font-light">{v}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
