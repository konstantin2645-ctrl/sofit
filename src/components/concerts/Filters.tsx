"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Opt = { value: string; label: string };

export function Filters({
  artists,
  cities,
  genres,
  months,
}: {
  artists: Opt[];
  cities: string[];
  genres: string[];
  months: { from: string; to: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const spQ = sp.get("q") ?? "";
  const [prevSpQ, setPrevSpQ] = useState(spQ);
  if (prevSpQ !== spQ) {
    setPrevSpQ(spQ);
    if (spQ.trim() !== q.trim()) setQ(spQ);
  }

  const onSearch = (v: string) => {
    setQ(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ q: v.trim() }), 280);
  };

  const active = ["q", "artist", "city", "genre", "from", "to"].filter((k) => sp.get(k)).length;
  const monthActive = (m: { from: string; to: string }) => sp.get("from") === m.from && sp.get("to") === m.to;

  return (
    <div className="space-y-5" aria-busy={pending}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="relative flex-1">
          <span className="sr-only">Поиск по артистам, площадкам и городам</span>
          <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-dim" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Артист, площадка или город"
            className="input !py-4 !pl-8 font-display !text-[clamp(1.1rem,2vw,1.6rem)] font-light"
            autoComplete="off"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost md:hidden"
            aria-expanded={open}
            aria-controls="filters-panel"
            onClick={() => setOpen((v) => !v)}
          >
            Фильтры{active ? ` (${active})` : ""}
          </button>
          {active > 0 && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                start(() => router.replace(pathname, { scroll: false }));
              }}
              className="btn btn-ghost"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      <div id="filters-panel" className={`${open ? "grid" : "hidden"} gap-5 md:grid md:grid-cols-5`}>
        <label className="field">
          <span>Артист</span>
          <select className="input" value={sp.get("artist") ?? ""} onChange={(e) => update({ artist: e.target.value })}>
            <option value="">Все артисты</option>
            {artists.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Город</span>
          <select className="input" value={sp.get("city") ?? ""} onChange={(e) => update({ city: e.target.value })}>
            <option value="">Все города</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Жанр</span>
          <select className="input" value={sp.get("genre") ?? ""} onChange={(e) => update({ genre: e.target.value })}>
            <option value="">Все жанры</option>
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>С даты</span>
          <input type="date" className="input" value={sp.get("from") ?? ""} onChange={(e) => update({ from: e.target.value })} />
        </label>
        <label className="field">
          <span>По дату</span>
          <input type="date" className="input" value={sp.get("to") ?? ""} min={sp.get("from") ?? undefined} onChange={(e) => update({ to: e.target.value })} />
        </label>
      </div>

      <div className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]" role="group" aria-label="Быстрый выбор месяца">
        {months.map((m) => {
          const on = monthActive(m);
          return (
            <button
              key={m.from}
              type="button"
              aria-pressed={on}
              onClick={() => update(on ? { from: "", to: "" } : { from: m.from, to: m.to })}
              className={`h-10 shrink-0 rounded-full border px-4 text-sm transition-colors ${
                on ? "border-spot bg-spot text-black" : "border-[var(--line-strong)] text-paper/85 hover:border-paper"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
