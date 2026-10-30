"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHead } from "./AdminShell";
import { api, ApiError } from "./client";
import { GalleryField, GelField, ImageField, StatsField, TagsField, TiersField, type FieldDef } from "./fields";
import { RESOURCES, type Row } from "./resources";
import { useToast } from "./Toast";

function useLookups(keys: string[] = []) {
  const [lookup, setLookup] = useState<Record<string, Row[]>>({});
  const k = keys.join(",");
  useEffect(() => {
    if (!k) return;
    Promise.all(k.split(",").map((key) => api<{ data: Row[] }>(`/api/admin/${key}`).then((r) => [key, r.data] as const))).then((pairs) =>
      setLookup(Object.fromEntries(pairs)),
    );
  }, [k]);
  return lookup;
}

export function ResourceList({ resource }: { resource: string }) {
  const def = RESOURCES[resource];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lookup = useLookups(def?.lookups);

  useEffect(() => {
    if (!def) return;
    api<{ data: Row[] }>(`/api/admin/${def.key}`)
      .then((r) => setRows(r.data))
      .catch((e) => setError(e.message));
  }, [def]);

  const list = useMemo(() => {
    if (!rows) return [];
    const n = q.trim().toLowerCase();
    return n ? rows.filter((r) => def.search(r, { lookup }).toLowerCase().includes(n)) : rows;
  }, [rows, q, def, lookup]);

  if (!def) return <p>Раздел не найден</p>;

  return (
    <>
      <PageHead
        title={def.title}
        sub={def.sub}
        actions={
          <Link href={`/admin/${def.key}/new`} className="a-btn a-btn-primary">
            Добавить {def.single}
          </Link>
        }
      />
      <div className="a-panel overflow-hidden">
        <div className="border-b border-[var(--line)] p-3">
          <input className="a-input max-w-md" placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Поиск по списку" />
        </div>
        {error ? (
          <p className="p-8 text-danger">{error}</p>
        ) : !rows ? (
          <p className="p-8 text-dim">Загружаем…</p>
        ) : list.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-dim">{rows.length ? "Ничего не найдено. Измените запрос." : "Здесь пока пусто."}</p>
            {!rows.length && (
              <Link href={`/admin/${def.key}/new`} className="a-btn a-btn-primary mt-4">
                Добавить {def.single}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  {def.columns.map((c) => (
                    <th key={c.label}>{c.label}</th>
                  ))}
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    {def.columns.map((c) => (
                      <td key={c.label} className="max-w-[22rem]">
                        <Link href={`/admin/${def.key}/${r.id}`} className="block">
                          {c.render(r, { lookup })}
                        </Link>
                      </td>
                    ))}
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/admin/${def.key}/${r.id}`} className="a-btn !h-8 !px-3 text-xs">
                        Изменить
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const slugify = (input: string) => {
  const map: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
  return input.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
};

export function ResourceEditor({ resource, id }: { resource: string; id: string }) {
  const def = RESOURCES[resource];
  const isNew = id === "new";
  const router = useRouter();
  const toast = useToast();
  const [row, setRow] = useState<Row | null>(isNew ? { ...def?.defaults } : null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [dirty, setDirty] = useState(false);
  const lookup = useLookups(def?.fields.filter((f) => f.type === "select" && "source" in f && f.source).map((f) => (f as { source: string }).source));

  useEffect(() => {
    if (!def || isNew) return;
    api<{ data: Row }>(`/api/admin/${def.key}/${id}`)
      .then((r) => setRow(r.data))
      .catch((e) => toast(e.message, "error"));
  }, [def, id, isNew, toast]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!def) return <p>Раздел не найден</p>;
  if (!row) return <p className="text-dim">Загружаем…</p>;

  const set = (name: string, value: unknown) => {
    setDirty(true);
    setRow((r) => {
      const next = { ...r, [name]: value };
      const slugField = def.fields.find((f) => f.type === "slug") as { name: string; from?: string } | undefined;
      if (slugField && slugField.from === name && !slugTouched) next[slugField.name] = slugify(String(value));
      return next;
    });
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  const payload = () => {
    const out: Row = {};
    for (const f of def.fields) out[f.name] = row[f.name];
    return out;
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const r = await api<{ data: Row }>(isNew ? `/api/admin/${def.key}` : `/api/admin/${def.key}/${id}`, { method: isNew ? "POST" : "PUT", json: payload() });
      setDirty(false);
      toast(isNew ? "Создано" : "Изменения сохранены");
      if (isNew) router.replace(`/admin/${def.key}/${r.data.id}`);
      else setRow(r.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        toast(err.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Удалить «${row.title ?? row.name}»? Действие нельзя отменить.`)) return;
    try {
      await api(`/api/admin/${def.key}/${id}`, { method: "DELETE" });
      setDirty(false);
      toast("Удалено");
      router.replace(`/admin/${def.key}`);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const publicUrl = !isNew && def.publicPath ? def.publicPath(row) : null;

  return (
    <form onSubmit={save} noValidate>
      <PageHead
        title={isNew ? def.newTitle : row.title ?? row.name}
        sub={def.title}
        actions={
          <>
            <Link href={`/admin/${def.key}`} className="a-btn">
              К списку
            </Link>
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noreferrer" className="a-btn">
                Открыть на сайте
              </a>
            )}
            <button type="submit" className="a-btn a-btn-primary" disabled={saving}>
              {saving ? "Сохраняем…" : isNew ? "Создать" : "Сохранить"}
            </button>
          </>
        }
      />
      <div className="a-panel grid gap-6 p-5 md:grid-cols-2 md:p-8">
        {def.fields.map((f) => (
          <Field
            key={f.name}
            f={f}
            value={row[f.name]}
            error={errors[f.name] || Object.entries(errors).find(([k, v]) => k.startsWith(f.name + ".") && v)?.[1]}
            onChange={(v) => {
              if (f.type === "slug") setSlugTouched(true);
              set(f.name, v);
            }}
            lookup={lookup}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {!isNew ? (
          <button type="button" className="a-btn a-btn-danger" onClick={remove}>
            Удалить
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {dirty && <span className="text-sm text-dim">Есть несохранённые изменения</span>}
          <button type="submit" className="a-btn a-btn-primary" disabled={saving}>
            {saving ? "Сохраняем…" : isNew ? "Создать" : "Сохранить"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ f, value, onChange, error, lookup }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string; lookup: Record<string, Row[]> }) {
  const id = `f-${f.name}`;
  const span = f.span === 2 || ["image", "gallery", "tiers", "stats", "textarea", "tags", "gel"].includes(f.type) ? "md:col-span-2" : "";
  let control: React.ReactNode;
  switch (f.type) {
    case "text":
    case "url":
    case "slug":
      control = (
        <>
          <input id={id} className="a-input" value={(value as string) ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(f.type === "url" ? e.target.value || null : e.target.value)} aria-invalid={!!error} list={f.list ? `${id}-list` : undefined} required={f.required} />
          {f.list && (
            <datalist id={`${id}-list`}>
              {f.list.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          )}
        </>
      );
      break;
    case "textarea":
      control = <textarea id={id} className="a-input" rows={f.rows ?? 4} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />;
      break;
    case "number":
      control = (
        <input
          id={id}
          type="number"
          className="a-input"
          value={value === null || value === undefined ? "" : String(value)}
          min={f.min}
          max={f.max}
          step={f.step ?? 1}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          aria-invalid={!!error}
        />
      );
      break;
    case "select": {
      const opts = f.options ?? (f.source ? (lookup[f.source] ?? []).map((r) => ({ value: String(r.id), label: r.city ? `${r.name} (${r.city})` : r.name })) : []);
      control = (
        <select
          id={id}
          className="a-input"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : f.source ? Number(e.target.value) : e.target.value)}
          aria-invalid={!!error}
        >
          {f.nullable && <option value="">Не выбрано</option>}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    }
    case "datetime":
      control = (
        <input
          id={id}
          type="datetime-local"
          className="a-input"
          value={toLocalInput(value as string | null)}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          aria-invalid={!!error}
        />
      );
      break;
    case "checkbox":
      return (
        <label className={`flex items-center gap-3 self-end py-2 ${span}`}>
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-spot)]" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{f.label}</span>
        </label>
      );
    case "image":
      control = <ImageField id={id} value={(value as string) ?? null} onChange={onChange} />;
      break;
    case "gallery":
      control = <GalleryField id={id} value={(value as never[]) ?? []} onChange={onChange} />;
      break;
    case "tags":
      control = <TagsField id={id} value={(value as string[]) ?? []} onChange={onChange} placeholder={f.placeholder} />;
      break;
    case "tiers":
      control = <TiersField id={id} value={(value as never[]) ?? []} onChange={onChange} />;
      break;
    case "stats":
      control = <StatsField id={id} value={(value as never[]) ?? []} onChange={onChange} />;
      break;
    case "gel":
      control = <GelField id={id} value={(value as string) ?? "tungsten"} onChange={onChange} />;
      break;
  }
  const composite = ["image", "gallery", "tiers", "stats", "gel", "tags"].includes(f.type) && f.type !== "tags";
  const labelEl = composite ? (
    <p id={`${id}-label`} className="a-label">
      {f.label}
    </p>
  ) : (
    <label htmlFor={id} className="a-label">
      {f.label}
      {"required" in f && f.required ? <span className="text-spot"> *</span> : null}
    </label>
  );
  return (
    <div className={span} role={composite ? "group" : undefined} aria-labelledby={composite ? `${id}-label` : undefined}>
      {labelEl}
      {control}
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : "hint" in f && f.hint ? <p className="mt-1.5 text-xs text-mute">{f.hint}</p> : null}
    </div>
  );
}
