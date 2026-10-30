"use client";

import { useState } from "react";
import { MediaPicker, type MediaRow } from "./Media";

export type Option = { value: string; label: string };

export type FieldDef =
  | { name: string; label: string; type: "text" | "url" | "slug"; required?: boolean; placeholder?: string; hint?: string; from?: string; list?: string[]; span?: 1 | 2 }
  | { name: string; label: string; type: "textarea"; rows?: number; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: "number"; min?: number; max?: number; step?: number; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: "select"; options?: Option[]; source?: string; nullable?: boolean; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: "datetime"; hint?: string; required?: boolean; span?: 1 | 2 }
  | { name: string; label: string; type: "checkbox"; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: "image"; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: "gallery"; hint?: string; span?: 1 | 2 }
  | { name: string; label: string; type: "tags"; hint?: string; placeholder?: string; span?: 1 | 2 }
  | { name: string; label: string; type: "tiers"; span?: 1 | 2 }
  | { name: string; label: string; type: "stats"; span?: 1 | 2 }
  | { name: string; label: string; type: "gel"; span?: 1 | 2 };

type Props<V> = { value: V; onChange: (v: V) => void; invalid?: boolean; id: string };

export function ImageField({ value, onChange, id }: Props<string | null>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-4">
      <div className="relative aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-black">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-xs text-mute">Нет изображения</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button id={id} type="button" className="a-btn" onClick={() => setOpen(true)}>
          {value ? "Заменить" : "Выбрать из медиатеки"}
        </button>
        {value && (
          <button type="button" className="a-btn a-btn-danger" onClick={() => onChange(null)}>
            Убрать
          </button>
        )}
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(rows: MediaRow[]) => onChange(rows[0]?.url ?? null)} />
    </div>
  );
}

type GalleryItem = { type: "image" | "video"; src: string; poster?: string; caption?: string };

export function GalleryField({ value, onChange, id }: Props<GalleryItem[]>) {
  const [open, setOpen] = useState(false);
  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((m, i) => (
            <li key={i} className="overflow-hidden rounded-lg border border-[var(--line)] bg-black">
              <div className="relative aspect-video">
                {m.type === "video" ? (
                  <video src={m.src} poster={m.poster} muted className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.src} alt="" className="h-full w-full object-cover" />
                )}
                {m.type === "video" && <span className="badge absolute left-1.5 top-1.5 bg-black/70">видео</span>}
              </div>
              <input
                className="w-full border-t border-[var(--line)] bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-mute"
                placeholder="Подпись"
                value={m.caption ?? ""}
                onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))}
              />
              <div className="flex border-t border-[var(--line)] text-xs">
                <button type="button" className="flex-1 py-1.5 hover:bg-white/5" onClick={() => move(i, -1)} aria-label="Левее">
                  ←
                </button>
                <button type="button" className="flex-1 py-1.5 hover:bg-white/5" onClick={() => move(i, 1)} aria-label="Правее">
                  →
                </button>
                <button type="button" className="flex-1 py-1.5 text-danger hover:bg-white/5" onClick={() => onChange(value.filter((_, k) => k !== i))}>
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button id={id} type="button" className="a-btn" onClick={() => setOpen(true)}>
        Добавить фото или видео
      </button>
      <MediaPicker
        open={open}
        multiple
        kind="any"
        onClose={() => setOpen(false)}
        onPick={(rows) => onChange([...value, ...rows.map((r) => ({ type: r.mime.startsWith("video/") ? ("video" as const) : ("image" as const), src: r.url }))])}
      />
    </div>
  );
}

export function TagsField({ value, onChange, id, placeholder }: Props<string[]> & { placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="a-input flex !h-auto min-h-11 flex-wrap items-center gap-2 !py-1.5">
      {value.map((t) => (
        <span key={t} className="badge gap-2 bg-white/5">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Убрать ${t}`} className="text-dim hover:text-danger">
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        placeholder={placeholder ?? "Введите и нажмите Enter"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        className="min-w-[10rem] flex-1 bg-transparent outline-none placeholder:text-mute"
      />
    </div>
  );
}

type Tier = { name: string; price: number; total: number; sold: number; note?: string };

export function TiersField({ value, onChange }: Props<Tier[]>) {
  const set = (i: number, patch: Partial<Tier>) => onChange(value.map((t, k) => (k === i ? { ...t, ...patch } : t)));
  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 px-1 text-xs text-dim md:grid">
          <span>Категория</span>
          <span>Цена</span>
          <span>Всего мест</span>
          <span>Продано</span>
          <span className="w-9" />
        </div>
      )}
      {value.map((t, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--line)] p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:border-0 md:p-0">
          <input className="a-input col-span-2 md:col-span-1" placeholder="Например, Танцпартер" value={t.name} onChange={(e) => set(i, { name: e.target.value })} aria-label="Название категории" />
          <input className="a-input" type="number" min={0} value={t.price} onChange={(e) => set(i, { price: Number(e.target.value) })} aria-label="Цена" />
          <input className="a-input" type="number" min={0} value={t.total} onChange={(e) => set(i, { total: Number(e.target.value) })} aria-label="Всего мест" />
          <input className="a-input" type="number" min={0} value={t.sold} onChange={(e) => set(i, { sold: Number(e.target.value) })} aria-label="Продано" />
          <button type="button" className="a-btn a-btn-danger !px-3" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Удалить категорию">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="a-btn" onClick={() => onChange([...value, { name: "", price: 0, total: 100, sold: 0 }])}>
        Добавить категорию билетов
      </button>
    </div>
  );
}

type Stat = { value: string; label: string };

export function StatsField({ value, onChange }: Props<Stat[]>) {
  return (
    <div className="space-y-3">
      {value.map((s, i) => (
        <div key={i} className="grid grid-cols-[8rem_1fr_auto] gap-3">
          <input className="a-input" placeholder="12 000" value={s.value} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} aria-label="Значение" />
          <input className="a-input" placeholder="зрителей" value={s.label} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} aria-label="Подпись" />
          <button type="button" className="a-btn a-btn-danger !px-3" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Удалить">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="a-btn" onClick={() => onChange([...value, { value: "", label: "" }])}>
        Добавить показатель
      </button>
    </div>
  );
}

const GELS: [string, string, string][] = [
  ["tungsten", "Тёплый белый", "#F5D3A0"],
  ["amber", "Янтарь", "#FFA531"],
  ["red", "Красный", "#FF4433"],
  ["magenta", "Маджента", "#FF2E93"],
  ["violet", "Фиолетовый", "#A666FF"],
  ["congo", "Синий конго", "#5B4BFF"],
  ["cyan", "Циан", "#1CC8E6"],
  ["green", "Зелёный", "#3EEB9A"],
];

export function GelField({ value, onChange, id }: Props<string>) {
  return (
    <div id={id} role="radiogroup" className="flex flex-wrap gap-2">
      {GELS.map(([v, label, color]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`flex h-10 items-center gap-2 rounded-full border px-3 text-sm transition-colors ${value === v ? "border-paper bg-white/10" : "border-[var(--line)] hover:border-white/40"}`}
        >
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
          {label}
        </button>
      ))}
    </div>
  );
}
