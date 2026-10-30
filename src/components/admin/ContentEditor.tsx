"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { PageHead } from "./AdminShell";
import { api, ApiError } from "./client";
import { ImageField, StatsField, TagsField } from "./fields";
import { MediaPicker } from "./Media";
import { useToast } from "./Toast";

const TABS: [keyof SiteContent, string][] = [
  ["hero", "Главный экран"],
  ["about", "О компании"],
  ["services", "Услуги"],
  ["contacts", "Контакты"],
  ["partners", "Партнёры"],
];

function Text({ label, value, onChange, area, rows, hint }: { label: string; value: string | number; onChange: (v: string) => void; area?: boolean; rows?: number; hint?: string }) {
  const id = `c-${label}`;
  return (
    <div>
      <label htmlFor={id} className="a-label">
        {label}
      </label>
      {area ? (
        <textarea id={id} className="a-input" rows={rows ?? 4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="a-input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="mt-1.5 text-xs text-mute">{hint}</p>}
    </div>
  );
}

export function ContentEditor() {
  const toast = useToast();
  const [data, setData] = useState<SiteContent | null>(null);
  const [tab, setTab] = useState<keyof SiteContent>("hero");
  const [saving, setSaving] = useState(false);
  const [videoPicker, setVideoPicker] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  useEffect(() => {
    api<{ data: SiteContent }>("/api/admin/settings").then((r) => setData(r.data)).catch((e) => toast(e.message, "error"));
  }, [toast]);

  if (!data) return <p className="text-dim">Загружаем…</p>;

  function upd<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setData((d) => (d ? { ...d, [key]: value } : d));
    setDirty((s) => new Set(s).add(key));
  }

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/admin/settings", { method: "PUT", json: { [tab]: data[tab] } });
      setDirty((s) => {
        const n = new Set(s);
        n.delete(tab);
        return n;
      });
      toast("Сохранено. Изменения уже на сайте.");
    } catch (e) {
      const err = e as ApiError;
      const first = Object.entries(err.fields ?? {})[0];
      toast(first ? `${err.message}: ${first[0]} — ${first[1]}` : err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const { hero, about, services, contacts, partners } = data;

  return (
    <>
      <PageHead
        title="Содержимое сайта"
        sub="Тексты, цифры и контакты на страницах сайта"
        actions={
          <button type="button" className="a-btn a-btn-primary" onClick={save} disabled={saving || !dirty.has(tab)}>
            {saving ? "Сохраняем…" : "Сохранить раздел"}
          </button>
        }
      />
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`a-btn !h-9 shrink-0 ${tab === k ? "a-btn-primary" : ""}`}>
            {l}
            {dirty.has(k) && <span className="h-1.5 w-1.5 rounded-full bg-spot" aria-label="есть изменения" />}
          </button>
        ))}
      </div>

      <div className="a-panel space-y-6 p-5 md:p-8" role="tabpanel">
        {tab === "hero" && (
          <>
            <Text label="Заголовок" value={hero.title} onChange={(v) => upd("hero", { ...hero, title: v })} hint="Разбивается на строки автоматически" />
            <Text label="Описание компании" value={hero.lead} area rows={3} onChange={(v) => upd("hero", { ...hero, lead: v })} />
            <div className="grid gap-6 md:grid-cols-2">
              <Text label="Текст основной кнопки" value={hero.primaryCta} onChange={(v) => upd("hero", { ...hero, primaryCta: v })} />
              <Text label="Текст второй кнопки" value={hero.secondaryCta} onChange={(v) => upd("hero", { ...hero, secondaryCta: v })} />
            </div>
            <div>
              <p className="a-label">Фоновое видео</p>
              <div className="flex flex-wrap items-start gap-4">
                <video src={hero.video} poster={hero.poster} muted loop autoPlay playsInline className="aspect-video w-72 rounded-lg border border-[var(--line)] object-cover" />
                <div className="space-y-2">
                  <button type="button" className="a-btn" onClick={() => setVideoPicker(true)}>
                    Выбрать видео
                  </button>
                  <p className="max-w-xs text-xs text-mute">MP4 (H.264) до 10–15 секунд, без звука, 1280–1920 px по ширине. Видео зациклится.</p>
                </div>
              </div>
              <MediaPicker
                open={videoPicker}
                kind="any"
                onClose={() => setVideoPicker(false)}
                onPick={(rows) => {
                  const r = rows[0];
                  if (!r) return;
                  if (!r.mime.startsWith("video/")) return toast("Выберите видеофайл", "error");
                  upd("hero", { ...hero, video: r.url });
                }}
              />
            </div>
            <div>
              <p className="a-label">Постер (показывается, пока видео загружается)</p>
              <ImageField id="hero-poster" value={hero.poster} onChange={(v) => upd("hero", { ...hero, poster: v ?? "" })} />
            </div>
          </>
        )}

        {tab === "about" && (
          <>
            <Text label="Манифест (подсвечивается при прокрутке)" value={about.manifesto} area rows={4} onChange={(v) => upd("about", { ...about, manifesto: v })} />
            <Text label="О команде" value={about.text} area rows={4} onChange={(v) => upd("about", { ...about, text: v })} />
            <div>
              <p className="a-label">Цифры</p>
              <StatsField id="about-stats" value={about.stats} onChange={(v) => upd("about", { ...about, stats: v })} />
            </div>
          </>
        )}

        {tab === "services" && (
          <>
            {services.map((s, i) => {
              const set = (patch: Partial<typeof s>) => upd("services", services.map((x, k) => (k === i ? { ...x, ...patch } : x)));
              return (
                <fieldset key={i} className="space-y-4 rounded-xl border border-[var(--line)] p-5">
                  <legend className="px-2 text-sm text-dim">Услуга {i + 1}</legend>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Text label="Название" value={s.title} onChange={(v) => set({ title: v })} />
                    <Text label="Якорь (латиница)" value={s.slug} onChange={(v) => set({ slug: v })} hint={`Ссылка: /services#${s.slug}`} />
                  </div>
                  <Text label="Описание" value={s.lead} area rows={2} onChange={(v) => set({ lead: v })} />
                  <div>
                    <p className="a-label">Что входит</p>
                    <TagsField id={`svc-${i}`} value={s.points} onChange={(v) => set({ points: v })} />
                  </div>
                  <div>
                    <p className="a-label">Изображение</p>
                    <ImageField id={`svc-img-${i}`} value={s.image} onChange={(v) => set({ image: v ?? "" })} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="a-btn" disabled={i === 0} onClick={() => { const n = [...services]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; upd("services", n); }}>
                      Выше
                    </button>
                    <button type="button" className="a-btn" disabled={i === services.length - 1} onClick={() => { const n = [...services]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; upd("services", n); }}>
                      Ниже
                    </button>
                    <button type="button" className="a-btn a-btn-danger ml-auto" onClick={() => upd("services", services.filter((_, k) => k !== i))}>
                      Удалить услугу
                    </button>
                  </div>
                </fieldset>
              );
            })}
            <button type="button" className="a-btn" onClick={() => upd("services", [...services, { slug: `service-${services.length + 1}`, title: "Новая услуга", lead: "", points: [], image: "/media/stage-01.jpg" }])}>
              Добавить услугу
            </button>
          </>
        )}

        {tab === "contacts" && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Text label="Телефон" value={contacts.phone} onChange={(v) => upd("contacts", { ...contacts, phone: v })} />
              <Text label="Часы работы" value={contacts.hours} onChange={(v) => upd("contacts", { ...contacts, hours: v })} />
              <Text label="Почта для сотрудничества" value={contacts.email} onChange={(v) => upd("contacts", { ...contacts, email: v })} />
              <Text label="Почта для прессы" value={contacts.pressEmail} onChange={(v) => upd("contacts", { ...contacts, pressEmail: v })} />
              <Text label="Адрес офиса" value={contacts.address} onChange={(v) => upd("contacts", { ...contacts, address: v })} />
              <Text label="Город" value={contacts.city} onChange={(v) => upd("contacts", { ...contacts, city: v })} />
              <Text label="Широта (для карты)" value={contacts.lat} onChange={(v) => upd("contacts", { ...contacts, lat: Number(v) || 0 })} />
              <Text label="Долгота (для карты)" value={contacts.lng} onChange={(v) => upd("contacts", { ...contacts, lng: Number(v) || 0 })} />
            </div>
            <div>
              <p className="a-label">Соцсети</p>
              <div className="space-y-3">
                {contacts.socials.map((s, i) => (
                  <div key={i} className="grid grid-cols-[10rem_1fr_auto] gap-3">
                    <input className="a-input" value={s.name} aria-label="Название" onChange={(e) => upd("contacts", { ...contacts, socials: contacts.socials.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
                    <input className="a-input" value={s.url} aria-label="Ссылка" onChange={(e) => upd("contacts", { ...contacts, socials: contacts.socials.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)) })} />
                    <button type="button" className="a-btn a-btn-danger !px-3" aria-label="Удалить" onClick={() => upd("contacts", { ...contacts, socials: contacts.socials.filter((_, k) => k !== i) })}>
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="a-btn" onClick={() => upd("contacts", { ...contacts, socials: [...contacts.socials, { name: "", url: "https://" }] })}>
                  Добавить соцсеть
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "partners" && (
          <div className="space-y-3">
            {partners.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <input className="a-input" value={p.name} placeholder="Название" aria-label="Название партнёра" onChange={(e) => upd("partners", partners.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                <input className="a-input" value={p.kind} placeholder="Роль, например «Медиапартнёр»" aria-label="Роль партнёра" onChange={(e) => upd("partners", partners.map((x, k) => (k === i ? { ...x, kind: e.target.value } : x)))} />
                <button type="button" className="a-btn a-btn-danger !px-3" aria-label="Удалить" onClick={() => upd("partners", partners.filter((_, k) => k !== i))}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="a-btn" onClick={() => upd("partners", [...partners, { name: "", kind: "" }])}>
              Добавить партнёра
            </button>
          </div>
        )}
      </div>
    </>
  );
}
