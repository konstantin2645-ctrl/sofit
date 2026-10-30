"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PageHead } from "./AdminShell";
import { api } from "./client";
import { useToast } from "./Toast";

type Lead = {
  id: number; type: string; name: string; company: string; email: string; phone: string; budget: string; eventDate: string;
  message: string; status: "new" | "in_progress" | "done" | "archived"; note: string; createdAt: string;
};

const TYPES: Record<string, string> = { festival: "Концерт / фестиваль", artist: "Тур артиста", corporate: "Корпоратив", partnership: "Партнёрство", other: "Другое" };
const STATUSES: [Lead["status"], string, string][] = [
  ["new", "Новая", "border-spot/50 text-spot"],
  ["in_progress", "В работе", "border-[#7aa2ff]/50 text-[#9db8ff]"],
  ["done", "Закрыта", "border-ok/40 text-ok"],
  ["archived", "Архив", "text-dim"],
];
const label = (s: string) => STATUSES.find((x) => x[0] === s);
const when = (d: string) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export function Leads() {
  const sp = useSearchParams();
  const toast = useToast();
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [status, setStatus] = useState<string>("active");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(sp.get("open") ? Number(sp.get("open")) : null);

  useEffect(() => {
    api<{ data: Lead[] }>("/api/admin/leads").then((r) => setRows(r.data)).catch((e) => toast(e.message, "error"));
  }, [toast]);

  const list = useMemo(() => {
    const n = q.toLowerCase();
    return (rows ?? [])
      .filter((r) => (status === "active" ? r.status === "new" || r.status === "in_progress" : status === "all" ? true : r.status === status))
      .filter((r) => !n || [r.name, r.company, r.email, r.message, r.phone].join(" ").toLowerCase().includes(n));
  }, [rows, status, q]);

  const open = rows?.find((r) => r.id === openId) ?? null;

  const patch = async (id: number, body: Partial<Lead>) => {
    try {
      const r = await api<{ data: Lead }>(`/api/admin/leads/${id}`, { method: "PATCH", json: body });
      setRows((x) => x?.map((l) => (l.id === id ? r.data : l)) ?? null);
      toast("Сохранено");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };
  const remove = async (id: number) => {
    if (!confirm("Удалить заявку без возможности восстановления?")) return;
    await api(`/api/admin/leads/${id}`, { method: "DELETE" });
    setRows((x) => x?.filter((l) => l.id !== id) ?? null);
    setOpenId(null);
    toast("Заявка удалена");
  };

  const counts = (s: string) => (rows ?? []).filter((r) => r.status === s).length;

  return (
    <>
      <PageHead title="Заявки" sub="Запросы на сотрудничество с формы на сайте" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          ["active", `Активные (${counts("new") + counts("in_progress")})`],
          ["new", `Новые (${counts("new")})`],
          ["done", "Закрытые"],
          ["archived", "Архив"],
          ["all", "Все"],
        ].map(([v, l]) => (
          <button key={v} type="button" aria-pressed={status === v} className={`a-btn !h-9 ${status === v ? "a-btn-primary" : ""}`} onClick={() => setStatus(v)}>
            {l}
          </button>
        ))}
        <input className="a-input ml-auto !h-9 max-w-xs" placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Поиск по заявкам" />
      </div>

      <div className="a-panel overflow-hidden">
        {!rows ? (
          <p className="p-8 text-dim">Загружаем…</p>
        ) : list.length === 0 ? (
          <p className="p-10 text-center text-dim">Заявок с таким статусом нет.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {list.map((l) => {
              const st = label(l.status)!;
              return (
                <li key={l.id}>
                  <button type="button" onClick={() => setOpenId(l.id)} className="grid w-full gap-1 px-5 py-4 text-left hover:bg-white/[0.025] md:grid-cols-[1fr_12rem_8rem_7rem] md:items-center md:gap-4">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium">
                        {l.status === "new" && <span className="h-2 w-2 rounded-full bg-spot" />}
                        {l.name}
                        {l.company && <span className="font-normal text-dim">, {l.company}</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-dim">{l.message}</span>
                    </span>
                    <span className="text-sm text-paper/80">{TYPES[l.type] ?? l.type}</span>
                    <span className="text-sm tabular-nums text-dim">{when(l.createdAt)}</span>
                    <span>
                      <span className={`badge ${st[2]}`}>{st[1]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] flex justify-end bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setOpenId(null)}>
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`Заявка от ${open.name}`}
              className="h-full w-full max-w-lg overflow-y-auto border-l border-[var(--line)] bg-[#0b0b0b] p-6"
              initial={{ x: 60 }}
              animate={{ x: 0 }}
              exit={{ x: 60 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-dim">{TYPES[open.type] ?? open.type}, {when(open.createdAt)}</p>
                  <h2 className="mt-1 font-display text-2xl font-light">{open.name}</h2>
                  {open.company && <p className="text-dim">{open.company}</p>}
                </div>
                <button type="button" className="a-btn !px-3" onClick={() => setOpenId(null)} aria-label="Закрыть" autoFocus>
                  ×
                </button>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-dim">Почта</dt><dd><a className="link-underline" href={`mailto:${open.email}`}>{open.email}</a></dd></div>
                <div><dt className="text-dim">Телефон</dt><dd>{open.phone ? <a className="link-underline" href={`tel:${open.phone.replace(/[^\d+]/g, "")}`}>{open.phone}</a> : "—"}</dd></div>
                <div><dt className="text-dim">Бюджет</dt><dd>{open.budget || "—"}</dd></div>
                <div><dt className="text-dim">Когда</dt><dd>{open.eventDate || "—"}</dd></div>
              </dl>
              <div className="mt-6 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-black p-4 text-[0.95rem] leading-relaxed">{open.message}</div>
              <fieldset className="mt-6">
                <legend className="a-label">Статус</legend>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(([v, l]) => (
                    <button key={v} type="button" aria-pressed={open.status === v} className={`a-btn !h-9 ${open.status === v ? "a-btn-primary" : ""}`} onClick={() => patch(open.id, { status: v })}>
                      {l}
                    </button>
                  ))}
                </div>
              </fieldset>
              <NoteEditor key={open.id} initial={open.note} onSave={(note) => patch(open.id, { note })} />
              <div className="mt-8 flex flex-wrap gap-2 border-t border-[var(--line)] pt-6">
                <a className="a-btn a-btn-primary" href={`mailto:${open.email}?subject=${encodeURIComponent("SOFIT: ответ на вашу заявку")}`}>
                  Ответить письмом
                </a>
                <button type="button" className="a-btn a-btn-danger ml-auto" onClick={() => remove(open.id)}>
                  Удалить
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NoteEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="mt-6">
      <label htmlFor="lead-note" className="a-label">
        Заметка для команды
      </label>
      <textarea id="lead-note" className="a-input" rows={3} value={v} onChange={(e) => setV(e.target.value)} placeholder="Например: созвон в четверг, ждём техрайдер" />
      <button type="button" className="a-btn mt-2" disabled={v === initial} onClick={() => onSave(v)}>
        Сохранить заметку
      </button>
    </div>
  );
}
