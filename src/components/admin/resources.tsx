"use client";

import type { FieldDef } from "./fields";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;

export type ResourceDef = {
  key: string;
  title: string;
  single: string;
  newTitle: string;
  sub: string;
  publicPath?: (r: Row) => string | null;
  defaults: Row;
  fields: FieldDef[];
  columns: { label: string; render: (r: Row, ctx: { lookup: Record<string, Row[]> }) => React.ReactNode; className?: string }[];
  search: (r: Row, ctx: { lookup: Record<string, Row[]> }) => string;
  lookups?: string[];
};

const GEL_HEX: Record<string, string> = {
  tungsten: "#F5D3A0", amber: "#FFA531", red: "#FF4433", magenta: "#FF2E93", violet: "#A666FF", congo: "#5B4BFF", cyan: "#1CC8E6", green: "#3EEB9A",
};

const STATUS: Record<string, [string, string]> = {
  draft: ["Черновик", "text-dim"],
  published: ["Опубликован", "text-ok border-ok/40"],
  sold_out: ["Солд-аут", "text-spot border-spot/40"],
  cancelled: ["Отменён", "text-danger border-danger/40"],
};

const thumb = (src?: string | null) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
  ) : (
    <span className="h-10 w-14 shrink-0 rounded bg-white/5" />
  );

const dt = (v: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v));

const TIMEZONES = [
  "Europe/Kaliningrad", "Europe/Moscow", "Europe/Samara", "Asia/Yekaterinburg", "Asia/Omsk", "Asia/Novosibirsk", "Asia/Krasnoyarsk",
  "Asia/Irkutsk", "Asia/Vladivostok", "Asia/Almaty", "Asia/Dubai", "Asia/Yerevan", "Asia/Tbilisi", "Europe/Belgrade", "Europe/Istanbul",
].map((v) => ({ value: v, label: v }));

const GENRES = ["Рок", "Инди-поп", "Поп", "Электроника", "Техно", "Хип-хоп", "Джаз", "Неоклассика", "Симфонический", "Фолк", "Пост-рок", "Синтвейв", "Латин-джаз", "Инди-рок", "Фестиваль", "Хоровая музыка"];

export const RESOURCES: Record<string, ResourceDef> = {
  events: {
    key: "events",
    newTitle: "Новый концерт",
    title: "Концерты",
    single: "концерт",
    sub: "Афиша, билеты и страницы событий",
    publicPath: (r) => (r.status === "draft" ? null : `/concerts/${r.slug}`),
    lookups: ["artists", "venues"],
    defaults: {
      title: "", slug: "", subtitle: "", artistId: null, venueId: null, lineup: [], startsAt: "", doorsAt: null, genre: "", gel: "tungsten",
      cover: null, gallery: [], description: "", ageLimit: 12, status: "draft", featured: false, ticketUrl: null, tiers: [],
    },
    fields: [
      { name: "title", label: "Название", type: "text", required: true, span: 2 },
      { name: "slug", label: "Адрес страницы", type: "slug", from: "title", hint: "Латиница и дефисы: /concerts/адрес" },
      { name: "subtitle", label: "Подзаголовок", type: "text" },
      { name: "artistId", label: "Артист", type: "select", source: "artists", nullable: true },
      { name: "venueId", label: "Площадка", type: "select", source: "venues", nullable: true },
      { name: "startsAt", label: "Начало", type: "datetime", required: true, hint: "В часовом поясе вашего браузера" },
      { name: "doorsAt", label: "Открытие дверей", type: "datetime" },
      { name: "genre", label: "Жанр", type: "text", list: GENRES },
      { name: "ageLimit", label: "Возрастное ограничение", type: "number", min: 0, max: 21 },
      { name: "status", label: "Статус", type: "select", options: Object.entries(STATUS).map(([value, [label]]) => ({ value, label })) },
      { name: "ticketUrl", label: "Ссылка на внешнего билетного оператора", type: "url", placeholder: "https://", hint: "Необязательно. Покупка на сайте работает всегда." },
      { name: "featured", label: "Показывать в подборке на главной", type: "checkbox" },
      { name: "gel", label: "Цвет события", type: "gel", span: 2 },
      { name: "cover", label: "Обложка", type: "image", span: 2 },
      { name: "description", label: "Описание", type: "textarea", rows: 8, span: 2, hint: "Пустая строка — новый абзац" },
      { name: "lineup", label: "Также выступят", type: "tags", span: 2 },
      { name: "tiers", label: "Билеты", type: "tiers", span: 2 },
      { name: "gallery", label: "Фото и видео", type: "gallery", span: 2 },
    ],
    columns: [
      {
        label: "Концерт",
        render: (r) => (
          <span className="flex items-center gap-3">
            {thumb(r.cover)}
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-medium">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: GEL_HEX[r.gel] }} />
                <span className="truncate">{r.title}</span>
              </span>
              <span className="block truncate text-xs text-dim">{r.subtitle}</span>
            </span>
          </span>
        ),
      },
      { label: "Дата", render: (r) => <span className="whitespace-nowrap tabular-nums">{dt(r.startsAt)}</span> },
      { label: "Площадка", render: (r, { lookup }) => { const v = lookup.venues?.find((x) => x.id === r.venueId); return v ? `${v.city}, ${v.name}` : "—"; } },
      {
        label: "Продано",
        render: (r) => {
          const total = r.tiers.reduce((a: number, t: Row) => a + t.total, 0);
          const sold = r.tiers.reduce((a: number, t: Row) => a + t.sold, 0);
          const pct = total ? Math.round((sold / total) * 100) : 0;
          return (
            <span className="block w-28">
              <span className="text-xs tabular-nums text-dim">{sold} / {total}</span>
              <span className="mt-1 block h-1 rounded bg-white/10"><span className="block h-1 rounded bg-spot" style={{ width: `${pct}%` }} /></span>
            </span>
          );
        },
      },
      { label: "Статус", render: (r) => <span className={`badge ${STATUS[r.status]?.[1]}`}>{STATUS[r.status]?.[0]}</span> },
    ],
    search: (r, { lookup }) => {
      const v = lookup.venues?.find((x) => x.id === r.venueId);
      const a = lookup.artists?.find((x) => x.id === r.artistId);
      return [r.title, r.subtitle, r.genre, v?.city, v?.name, a?.name].join(" ");
    },
  },

  artists: {
    key: "artists",
    newTitle: "Новый артист",
    title: "Артисты",
    single: "артиста",
    sub: "Исполнители, с которыми работает агентство",
    publicPath: (r) => `/concerts?artist=${r.slug}`,
    defaults: { name: "", slug: "", genre: "", country: "Россия", bio: "", image: null, website: null },
    fields: [
      { name: "name", label: "Имя или название", type: "text", required: true },
      { name: "slug", label: "Адрес", type: "slug", from: "name" },
      { name: "genre", label: "Жанр", type: "text", list: GENRES },
      { name: "country", label: "Страна", type: "text" },
      { name: "website", label: "Сайт", type: "url", placeholder: "https://", span: 2 },
      { name: "image", label: "Фото", type: "image", span: 2 },
      { name: "bio", label: "Биография", type: "textarea", rows: 6, span: 2 },
    ],
    columns: [
      { label: "Артист", render: (r) => <span className="flex items-center gap-3">{thumb(r.image)}<span className="font-medium">{r.name}</span></span> },
      { label: "Жанр", render: (r) => r.genre },
      { label: "Страна", render: (r) => r.country },
    ],
    search: (r) => [r.name, r.genre, r.country].join(" "),
  },

  venues: {
    key: "venues",
    newTitle: "Новая площадка",
    title: "Площадки",
    single: "площадку",
    sub: "Залы, клубы, арены и open-air",
    defaults: { name: "", slug: "", city: "", country: "Россия", address: "", capacity: 0, timezone: "Europe/Moscow", lat: null, lng: null, description: "", image: null },
    fields: [
      { name: "name", label: "Название", type: "text", required: true },
      { name: "slug", label: "Адрес", type: "slug", from: "name" },
      { name: "city", label: "Город", type: "text" },
      { name: "country", label: "Страна", type: "text" },
      { name: "address", label: "Адрес площадки", type: "text", span: 2 },
      { name: "capacity", label: "Вместимость", type: "number", min: 0 },
      { name: "timezone", label: "Часовой пояс", type: "select", options: TIMEZONES },
      { name: "lat", label: "Широта", type: "number", step: 0.000001, hint: "Для карты, например 55.7558" },
      { name: "lng", label: "Долгота", type: "number", step: 0.000001, hint: "Например 37.6173" },
      { name: "image", label: "Фото", type: "image", span: 2 },
      { name: "description", label: "Описание", type: "textarea", rows: 4, span: 2 },
    ],
    columns: [
      { label: "Площадка", render: (r) => <span className="flex items-center gap-3">{thumb(r.image)}<span className="font-medium">{r.name}</span></span> },
      { label: "Город", render: (r) => `${r.city}, ${r.country}` },
      { label: "Вместимость", render: (r) => <span className="tabular-nums">{new Intl.NumberFormat("ru-RU").format(r.capacity)}</span> },
    ],
    search: (r) => [r.name, r.city, r.address, r.country].join(" "),
  },

  projects: {
    key: "projects",
    newTitle: "Новый проект",
    title: "Портфолио",
    single: "проект",
    sub: "Реализованные проекты: фото, видео и цифры",
    publicPath: (r) => (r.published ? `/portfolio/${r.slug}` : null),
    defaults: { title: "", slug: "", client: "", category: "", year: new Date().getFullYear(), city: "", summary: "", body: "", cover: null, gel: "tungsten", media: [], stats: [], position: 0, published: true },
    fields: [
      { name: "title", label: "Название", type: "text", required: true, span: 2 },
      { name: "slug", label: "Адрес", type: "slug", from: "title" },
      { name: "client", label: "Клиент", type: "text" },
      { name: "category", label: "Тип проекта", type: "text", list: ["Фестиваль", "Гастрольный тур", "Корпоративное", "Концертная программа", "Продакшн"] },
      { name: "year", label: "Год", type: "number", min: 1990, max: 2100 },
      { name: "city", label: "География", type: "text" },
      { name: "position", label: "Порядок в списке", type: "number", hint: "Меньше — выше" },
      { name: "published", label: "Опубликован", type: "checkbox" },
      { name: "gel", label: "Цвет проекта", type: "gel", span: 2 },
      { name: "cover", label: "Обложка", type: "image", span: 2 },
      { name: "summary", label: "Коротко", type: "textarea", rows: 3, span: 2 },
      { name: "body", label: "Описание", type: "textarea", rows: 8, span: 2 },
      { name: "stats", label: "Цифры проекта", type: "stats", span: 2 },
      { name: "media", label: "Фото и видео", type: "gallery", span: 2 },
    ],
    columns: [
      { label: "Проект", render: (r) => <span className="flex items-center gap-3">{thumb(r.cover)}<span className="font-medium">{r.title}</span></span> },
      { label: "Тип", render: (r) => r.category },
      { label: "Год", render: (r) => r.year },
      { label: "Статус", render: (r) => (r.published ? <span className="badge border-ok/40 text-ok">Опубликован</span> : <span className="badge text-dim">Скрыт</span>) },
    ],
    search: (r) => [r.title, r.client, r.category, r.city].join(" "),
  },
};
