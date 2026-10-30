/* Seeds the database with demo content and the first administrator.
   Safe to re-run: it upserts settings/admin and only inserts catalog data
   when the tables are empty (use `--reset` to wipe catalog data first). */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql as dsql } from "drizzle-orm";
import postgres from "postgres";
import { pgOptions } from "../src/db/options";
import * as s from "../src/db/schema";
import { defaultContent } from "../src/lib/content";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const client = postgres(process.env.DATABASE_URL!, pgOptions(process.env.DATABASE_URL!, 1));
const db = drizzle(client, { schema: s });
const reset = process.argv.includes("--reset");

const artistsData = [
  ["lada-veter", "Лада Ветер", "Инди-поп", "Россия", "Певица и автор песен из Петрозаводска. Тёплый голос, синтезаторы и тексты, которые зал поёт хором с первого куплета. Три студийных альбома и сольники в лучших залах страны."],
  ["kometa-9", "KOMETA 9", "Электроника", "Россия", "Лайв-электроника на стыке техно и брейкбита: аналоговые синтезаторы, живые барабаны и световое шоу, синхронизированное с каждым ударом."],
  ["arseniy-polyarny", "Арсений Полярный", "Неоклассика", "Россия", "Пианист и композитор. Минималистичные фортепианные циклы, струнный квартет и полная темнота в зале — его концерты называют медитацией."],
  ["sever-yug", "СЕВЕР/ЮГ", "Рок", "Россия", "Рок-группа с двадцатилетней историей и одним из самых громких лайвов в стране. Отмечают юбилей большим туром по аренам."],
  ["mira-kalt", "Mira Kalt", "Техно", "Германия", "Берлинский диджей и продюсер. Резидент крупнейших клубов Европы, известна шестичасовыми сетами и гипнотическим, плотным звуком."],
  ["novaya-scena", "Оркестр «Новая сцена»", "Симфонический", "Россия", "Симфонический оркестр, который играет музыку кино, игр и рок-классику в собственных аранжировках — с хором и видеопроекцией."],
  ["delta", "ДЕЛЬТА", "Хип-хоп", "Россия", "Рэп-дуэт из Ростова-на-Дону. Плотный бит, живая секция и концерты, где зал прыгает от первого до последнего трека."],
  ["ingrid-vale", "Ingrid Vale", "Джаз", "Норвегия", "Джазовая вокалистка из Осло. Камерные программы с трио, северная меланхолия и стандарты в неожиданных прочтениях."],
  ["peresvet", "ПЕРЕСВЕТ", "Пост-рок", "Россия", "Инструментальный пост-рок: долгие нарастания, стены гитар и визуальное шоу из света и дыма."],
  ["tomas-reyna", "Tomas Reyna", "Латин-джаз", "Испания", "Гитарист из Севильи. Фламенко, латиноамериканские ритмы и джазовая импровизация в одном вечере."],
  ["lunokhod", "ЛУНОХОД", "Синтвейв", "Россия", "Ретрофутуристичный синтвейв-проект: саундтрек к фильму, которого не было, и визуалы в эстетике восьмидесятых."],
  ["varvara-tish", "Варвара Тишь", "Фолк", "Россия", "Певица, собирающая северные песни и переплетающая их с электроникой. Акустические концерты в сопровождении гуслей и виолончели."],
  ["hollow-coast", "Hollow Coast", "Инди-рок", "Великобритания", "Инди-рок квартет из Брайтона. Гитарные гимны, которые звучат так же громко на фестивальных полях, как в небольших клубах."],
  ["aurora-choir", "Хор «Аврора»", "Хоровая музыка", "Россия", "Камерный хор из Санкт-Петербурга: от духовной музыки до хоровых версий поп-хитов."],
] as const;

const venuesData = [
  ["gorizont-arena", "Арена «Горизонт»", "Москва", "Россия", "Ленинградский проспект, 39", 14000, 55.7899, 37.5482, "Крупнейшая крытая арена северо-запада Москвы с подвесом на 120 тонн."],
  ["rezonans", "Зал «Резонанс»", "Москва", "Россия", "ул. Косыгина, 17", 2200, 55.7059, 37.5659, "Концертный зал с акустикой, настроенной под живой звук и симфонические программы."],
  ["podstantsiya", "Клуб «Подстанция»", "Москва", "Россия", "Берсеневская наб., 6, стр. 3", 900, 55.7409, 37.6094, "Клуб в бывшей электроподстанции: кирпич, высокие потолки, плотный звук."],
  ["neva-hall", "Нева Холл", "Санкт-Петербург", "Россия", "пр. Обуховской Обороны, 120", 6000, 59.8735, 30.4448, "Многофункциональный зал на набережной Невы."],
  ["kirpich", "Лофт «Кирпич»", "Санкт-Петербург", "Россия", "Лиговский пр., 74", 700, 59.9206, 30.3555, "Камерная площадка в историческом лофте на Лиговском."],
  ["volga-arena", "Арена «Волга»", "Казань", "Россия", "пр. Ямашева, 115А", 9000, 55.8253, 49.1484, "Арена на берегу Казанки с трансформируемым партером."],
  ["ural-stage", "Уральская сцена", "Екатеринбург", "Россия", "ул. Карла Либкнехта, 38", 3000, 56.8434, 60.6115, "Исторический зал в центре Екатеринбурга."],
  ["ob-arena", "Обь Арена", "Новосибирск", "Россия", "ул. Немировича-Данченко, 104", 7500, 54.9902, 82.8962, "Главная арена Сибири для гастрольных шоу."],
  ["sea-theatre", "Морской театр", "Сочи", "Россия", "Курортный пр., 77", 4000, 43.5745, 39.7303, "Летний театр под открытым небом в нескольких метрах от моря."],
  ["almaty-sky", "Sky Hall", "Алматы", "Казахстан", "пр. Аль-Фараби, 77", 5000, 43.2186, 76.9285, "Современный зал с панорамой гор."],
  ["harbour-stage", "Harbour Stage", "Дубай", "ОАЭ", "Dubai Harbour, Pier 3", 6500, 25.0937, 55.1402, "Площадка на воде с видом на марину Дубая."],
  ["yerevan-dome", "Ереван Доум", "Ереван", "Армения", "ул. Исаакяна, 2", 3200, 40.1872, 44.5152, "Купольный зал в центре Еревана."],
] as const;

type Gel = (typeof s.gelEnum.enumValues)[number];
// [slug, title, subtitle, artist, venue, dayOffset, hour, genre, gel, cover, tiers, featured, status, lineup, age]
const eventsData: [string, string, string, string, string, number, number, string, Gel, number, [string, number, number, number][], boolean, string, string[], number][] = [
  ["sever-yug-20-moscow", "СЕВЕР/ЮГ. 20 лет", "Юбилейный тур по аренам", "sever-yug", "gorizont-arena", 15, 20, "Рок", "red", 1, [["Танцпартер", 3500, 8000, 6120], ["Трибуна", 4800, 5000, 3010], ["VIP-ложа", 18000, 300, 241]], true, "published", ["ПЕРЕСВЕТ"], 12],
  ["lada-veter-rezonans", "Лада Ветер", "Презентация альбома «Тёплый фронт»", "lada-veter", "rezonans", 9, 19, "Инди-поп", "amber", 2, [["Партер", 2900, 1400, 1388], ["Балкон", 2200, 800, 640]], true, "published", [], 6],
  ["kometa-9-podstantsiya", "KOMETA 9 Live", "Аудиовизуальное шоу", "kometa-9", "podstantsiya", 22, 22, "Электроника", "cyan", 3, [["Танцпол", 2500, 900, 600]], false, "published", ["ЛУНОХОД"], 18],
  ["polyarny-darkness", "Арсений Полярный. Темнота", "Фортепиано и струнный квартет в полной темноте", "arseniy-polyarny", "kirpich", 30, 20, "Неоклассика", "tungsten", 4, [["Стандарт", 3200, 500, 500], ["Первые ряды", 5200, 120, 120]], true, "sold_out", [], 6],
  ["mira-kalt-moscow", "Mira Kalt. Extended Set", "Шесть часов без перерыва", "mira-kalt", "podstantsiya", 36, 23, "Техно", "violet", 5, [["Танцпол", 3000, 900, 410]], false, "published", [], 18],
  ["novaya-scena-cinema", "Музыка кино", "Симфоническое шоу с хором и видеопроекцией", "novaya-scena", "rezonans", 44, 19, "Симфонический", "congo", 6, [["Партер", 3800, 1400, 980], ["Балкон", 2400, 800, 300]], true, "published", ["Хор «Аврора»"], 6],
  ["delta-kazan", "ДЕЛЬТА", "Большой сольный концерт", "delta", "volga-arena", 51, 20, "Хип-хоп", "magenta", 7, [["Танцпартер", 2800, 6000, 2100], ["Трибуна", 3500, 3000, 900]], false, "published", [], 16],
  ["ingrid-vale-spb", "Ingrid Vale Trio", "Northern Standards", "ingrid-vale", "kirpich", 58, 20, "Джаз", "amber", 8, [["Столики", 4500, 200, 90], ["Стоячие места", 2500, 400, 150]], false, "published", [], 12],
  ["sever-yug-20-spb", "СЕВЕР/ЮГ. 20 лет", "Юбилейный тур по аренам", "sever-yug", "neva-hall", 64, 20, "Рок", "red", 9, [["Танцпартер", 3200, 4000, 1800], ["Трибуна", 4200, 2000, 700]], false, "published", ["ПЕРЕСВЕТ"], 12],
  ["peresvet-ekb", "ПЕРЕСВЕТ", "Тур «Длинный свет»", "peresvet", "ural-stage", 72, 19, "Пост-рок", "violet", 10, [["Партер", 2200, 2000, 600], ["Балкон", 1700, 1000, 200]], false, "published", [], 12],
  ["tomas-reyna-almaty", "Tomas Reyna", "Noches de Sevilla", "tomas-reyna", "almaty-sky", 79, 19, "Латин-джаз", "amber", 11, [["Партер", 25000, 3000, 900], ["VIP", 60000, 200, 80]], false, "published", [], 6],
  ["lunokhod-novosibirsk", "ЛУНОХОД", "Ретрофутуризм вживую", "lunokhod", "ob-arena", 86, 20, "Синтвейв", "magenta", 12, [["Танцпол", 2600, 5000, 1300]], false, "published", ["KOMETA 9"], 16],
  ["varvara-tish-yerevan", "Варвара Тишь", "Северные песни", "varvara-tish", "yerevan-dome", 93, 19, "Фолк", "green", 13, [["Партер", 18000, 2500, 400]], false, "published", [], 6],
  ["hollow-coast-moscow", "Hollow Coast", "Первый концерт в Москве", "hollow-coast", "rezonans", 101, 20, "Инди-рок", "cyan", 14, [["Танцпартер", 3900, 1400, 700], ["Балкон", 3100, 800, 200]], true, "published", [], 12],
  ["lada-veter-dubai", "Лада Ветер", "Тёплый фронт. Дубай", "lada-veter", "harbour-stage", 118, 21, "Инди-поп", "amber", 15, [["General", 9000, 5000, 1200], ["Golden Circle", 18000, 800, 300]], false, "published", [], 6],
  ["polar-night-festival", "Фестиваль «Полярная ночь»", "Два дня, две сцены, 18 артистов", "peresvet", "neva-hall", 130, 16, "Фестиваль", "congo", 16, [["Один день", 4900, 6000, 1500], ["Два дня", 7900, 4000, 1100]], true, "published", ["KOMETA 9", "Hollow Coast", "ЛУНОХОД", "Варвара Тишь"], 12],
  ["novaya-scena-sochi", "Музыка кино под открытым небом", "Симфоническое шоу у моря", "novaya-scena", "sea-theatre", 210, 21, "Симфонический", "congo", 17, [["Партер", 4500, 3000, 200], ["Амфитеатр", 3000, 1000, 50]], false, "published", [], 6],
  ["delta-moscow-arena", "ДЕЛЬТА. Арена", "Самый большой концерт дуэта", "delta", "gorizont-arena", 160, 20, "Хип-хоп", "magenta", 18, [["Танцпартер", 3300, 8000, 0], ["Трибуна", 4300, 5000, 0]], false, "draft", [], 16],
];

const projectsData = [
  { slug: "polar-night-2025", title: "Фестиваль «Полярная ночь» 2025", client: "SOFIT", category: "Фестиваль", year: 2025, city: "Санкт-Петербург", cover: "/media/stage-03.jpg", gel: "congo" as Gel,
    summary: "Двухдневный зимний фестиваль на 12 000 зрителей: две сцены, 18 артистов и световая инсталляция над Невой.",
    body: "Мы придумали фестиваль с нуля: концепцию «самой длинной ночи года», айдентику, лайнап и всю инженерную часть. Главная сцена — 32-метровая конструкция с LED-экраном 400 м² и 280 приборами света. Вторая сцена работала в формате нон-стоп сетов до шести утра.\n\nБилеты на второй день закончились за 19 дней до события. Фестиваль окупился в первый же год и стал ежегодным.",
    stats: [{ value: "12 000", label: "зрителей за два дня" }, { value: "18", label: "артистов" }, { value: "400 м²", label: "LED-экранов" }] },
  { slug: "sever-yug-arena-tour", title: "СЕВЕР/ЮГ — тур по аренам", client: "СЕВЕР/ЮГ", category: "Гастрольный тур", year: 2025, city: "14 городов", cover: "/media/stage-01.jpg", gel: "red" as Gel,
    summary: "Тур по 14 аренам России и СНГ: одна сценическая конструкция, три фуры оборудования и 46 человек команды.",
    body: "Для юбилейного тура мы спроектировали сцену-трансформер, которая монтируется за 9 часов и подходит к аренам от 6 до 14 тысяч мест. Свет и видео программировались один раз и масштабировались под каждую площадку.\n\nВсе 14 концертов прошли без единой отмены, средняя заполняемость — 96%.",
    stats: [{ value: "14", label: "арен" }, { value: "96%", label: "средняя заполняемость" }, { value: "148 000", label: "зрителей" }] },
  { slug: "kvant-annual", title: "Годовое собрание «Квант»", client: "Технологический холдинг «Квант»", category: "Корпоративное", year: 2025, city: "Москва", cover: "/media/stage-12.jpg", gel: "cyan" as Gel,
    summary: "Закрытый вечер на 3 000 сотрудников с хедлайнером, симфоническим оркестром и шоу дронов.",
    body: "Задача — за одну ночь превратить выставочный павильон в концертный зал. Мы построили сцену на 60 метров, акустические подвесы и зону для оркестра, а финал вечера провели под открытым небом с шоу из 500 дронов.\n\nСценарий, режиссура, артисты и техника — всё под ключ, с соблюдением NDA.",
    stats: [{ value: "3 000", label: "гостей" }, { value: "500", label: "дронов в финале" }, { value: "48 ч", label: "на монтаж" }] },
  { slug: "music-of-cinema", title: "«Музыка кино» — симфоническое шоу", client: "Оркестр «Новая сцена»", category: "Концертная программа", year: 2024, city: "Москва, Казань, Сочи", cover: "/media/stage-07.jpg", gel: "congo" as Gel,
    summary: "Программа, которая собрала 40 аншлагов: оркестр, хор и видеоряд, синхронизированный с партитурой.",
    body: "Мы спродюсировали формат, в котором оркестр звучит как саундтрек к живому кино: видеоряд на трёх экранах управляется по тайм-коду прямо от дирижёрского пульта.\n\nПрограмма выдержала 40 концертов за сезон и вышла за пределы России.",
    stats: [{ value: "40", label: "аншлагов за сезон" }, { value: "86", label: "музыкантов на сцене" }] },
  { slug: "kometa-9-audiovisual", title: "KOMETA 9 — аудиовизуальное шоу", client: "KOMETA 9", category: "Продакшн", year: 2024, city: "Москва", cover: "/media/stage-05.jpg", gel: "cyan" as Gel,
    summary: "Шоу, где каждый луч света привязан к звуку: 160 приборов, лазеры и генеративная графика.",
    body: "Мы разработали систему, в которой свет и видео генерируются в реальном времени из MIDI-потока артиста. Ни одного предзаписанного кьюшита — шоу каждый раз разное.",
    stats: [{ value: "160", label: "световых приборов" }, { value: "0", label: "предзаписанных кью" }] },
  { slug: "sea-theatre-season", title: "Летний сезон в Морском театре", client: "Морской театр", category: "Фестиваль", year: 2024, city: "Сочи", cover: "/media/stage-04.jpg", gel: "amber" as Gel,
    summary: "Тридцать вечеров у моря: от камерного джаза до симфонических программ.",
    body: "Мы взяли на себя программирование и продакшн летнего сезона открытой площадки: 30 концертов за 70 дней, собственная звуковая система и защита оборудования от морской влаги.",
    stats: [{ value: "30", label: "концертов" }, { value: "71 000", label: "зрителей за лето" }] },
  { slug: "harbour-new-year", title: "Новогодняя ночь в Harbour Stage", client: "Harbour Stage", category: "Корпоративное", year: 2025, city: "Дубай", cover: "/media/stage-15.jpg", gel: "magenta" as Gel,
    summary: "Новогоднее шоу на воде для 6 500 гостей с тремя артистами и фейерверком над мариной.",
    body: "Международный проект: команда из Москвы, оборудование из Европы и местные подрядчики. Сцену поставили на понтонах, а фейерверк запускали синхронно с финальной песней.",
    stats: [{ value: "6 500", label: "гостей" }, { value: "3", label: "страны в команде" }] },
  { slug: "darkness-series", title: "Серия концертов «Темнота»", client: "Арсений Полярный", category: "Концертная программа", year: 2023, city: "Санкт-Петербург, Москва", cover: "/media/stage-11.jpg", gel: "tungsten" as Gel,
    summary: "Фортепианные концерты в полной темноте: один источник света и 500 зрителей.",
    body: "Формат, в котором отсутствие света — главный художественный приём. Мы рассчитали аварийное освещение и навигацию так, чтобы в зале была абсолютная темнота, но с соблюдением всех норм безопасности.",
    stats: [{ value: "22", label: "концерта" }, { value: "100%", label: "солд-аут" }] },
];

const TZ: Record<string, [string, number]> = {
  "Москва": ["Europe/Moscow", 3], "Санкт-Петербург": ["Europe/Moscow", 3], "Казань": ["Europe/Moscow", 3], "Сочи": ["Europe/Moscow", 3],
  "Екатеринбург": ["Asia/Yekaterinburg", 5], "Новосибирск": ["Asia/Novosibirsk", 7], "Алматы": ["Asia/Almaty", 5],
  "Дубай": ["Asia/Dubai", 4], "Ереван": ["Asia/Yerevan", 4],
};

function localDate(dayOffset: number, hour: number, utcOffset: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset, hour - utcOffset, 0, 0));
}

async function main() {
  if (reset) {
    await db.execute(dsql`TRUNCATE orders, events, artists, venues, projects, leads, media RESTART IDENTITY CASCADE`);
    console.log("catalog cleared");
  }

  for (const [key, value] of Object.entries(defaultContent)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }

  const email = (process.env.ADMIN_EMAIL || "admin@sofit.live").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    await db.insert(s.admins).values({ email, name: "Администратор", passwordHash: hash }).onConflictDoNothing();
    console.log(`admin: ${email}`);
  }

  // Register bundled media in the library so it can be picked in the admin panel.
  const mediaRows = await db.select({ id: s.media.id }).from(s.media).limit(1);
  if (!mediaRows.length) {
    const dir = path.join(process.cwd(), "public/media");
    const files = readdirSync(dir).filter((f) => /\.(jpe?g|mp4)$/i.test(f) && f !== "og.jpg").sort();
    for (const f of files) {
      const isVideo = f.endsWith(".mp4");
      await db.insert(s.media).values({
        url: `/media/${f}`, filename: f, mime: isVideo ? "video/mp4" : "image/jpeg", size: statSync(path.join(dir, f)).size,
        width: isVideo ? 1280 : f.startsWith("artist") ? 1000 : f.startsWith("hero") ? 1280 : 1600,
        height: isVideo ? 720 : f.startsWith("artist") ? 1250 : f.startsWith("hero") ? 720 : 1067,
      });
    }
    console.log(`media: ${files.length} files registered`);
  }

  const existing = await db.select({ id: s.events.id }).from(s.events).limit(1);
  if (existing.length) {
    console.log("catalog already seeded, skipping (use --reset to reseed)");
    await client.end();
    return;
  }

  const artistIds: Record<string, number> = {};
  for (const [i, a] of artistsData.entries()) {
    const [row] = await db.insert(s.artists).values({
      slug: a[0], name: a[1], genre: a[2], country: a[3], bio: a[4], image: `/media/artist-${String(i + 1).padStart(2, "0")}.jpg`,
    }).returning();
    artistIds[a[0]] = row.id;
  }
  const venueIds: Record<string, number> = {};
  for (const [i, v] of venuesData.entries()) {
    const [row] = await db.insert(s.venues).values({
      slug: v[0], name: v[1], city: v[2], country: v[3], address: v[4], capacity: v[5], timezone: TZ[v[2]][0], lat: v[6], lng: v[7], description: v[8],
      image: `/media/stage-${String(((i * 5) % 24) + 1).padStart(2, "0")}.jpg`,
    }).returning();
    venueIds[v[0]] = row.id;
  }
  for (const e of eventsData) {
    const [slug, title, subtitle, artist, venue, offset, hour, genre, gel, cover, tiers, featured, status, lineup, age] = e;
    const artistBio = artistsData.find((a) => a[0] === artist)?.[4] ?? "";
    const city = venuesData.find((v) => v[0] === venue)![2];
    const startsAt = localDate(offset, hour, TZ[city][1]);
    await db.insert(s.events).values({
      slug, title, subtitle, artistId: artistIds[artist], venueId: venueIds[venue], startsAt,
      doorsAt: new Date(startsAt.getTime() - 60 * 60 * 1000), genre, gel,
      cover: `/media/stage-${String(cover).padStart(2, "0")}.jpg`,
      gallery: [cover + 1, cover + 3, cover + 5].map((n) => ({ type: "image" as const, src: `/media/stage-${String(((n - 1) % 24) + 1).padStart(2, "0")}.jpg` })),
      description: `${subtitle}. ${artistBio}\n\nВечер готовит команда SOFIT: собственный звук, свет и видео, продуманная навигация по площадке и быстрый вход по электронным билетам. Рекомендуем приезжать к открытию дверей — за час до начала.`,
      ageLimit: age, status: status as "published", featured,
      tiers: tiers.map(([name, price, total, sold]) => ({ name, price, total, sold })),
    });
  }
  for (const [i, p] of projectsData.entries()) {
    const base = Number(p.cover.match(/(\d+)/)![1]);
    const media: s.MediaItem[] = [2, 7, 13, 19].map((k) => ({ type: "image" as const, src: `/media/stage-${String(((base + k - 1) % 24) + 1).padStart(2, "0")}.jpg` }));
    if (i < 3) media.splice(1, 0, { type: "video", src: "/media/hero.mp4", poster: "/media/hero-poster.jpg", caption: "Фрагмент шоу" });
    await db.insert(s.projects).values({ ...p, media, position: i, published: true });
  }
  await db.insert(s.leads).values([
    { type: "corporate", name: "Екатерина Лисина", company: "Квант Банк", email: "e.lisina@example.com", phone: "+7 916 000-12-34", budget: "15–30 млн ₽", eventDate: "Декабрь 2026", message: "Ищем хедлайнера и продакшн для новогоднего вечера на 2 500 сотрудников." },
    { type: "artist", name: "Игорь Мельник", company: "Менеджмент «Мель»", email: "igor@example.com", phone: "", budget: "", eventDate: "Весна 2027", message: "Хотим обсудить тур артиста по 10 городам весной." },
    { type: "partnership", name: "Анна Петренко", company: "Город Медиа", email: "anna@example.com", phone: "+7 903 111-22-33", budget: "", eventDate: "", message: "Предлагаем медиапартнёрство на фестиваль «Полярная ночь».", status: "in_progress" },
  ]);
  console.log("seeded");
  await client.end();
}

main().catch(async (e) => {
  console.error(e);
  await client.end();
  process.exit(1);
});
