import type { Gel } from "@/db/schema";

export const GEL_COLORS: Record<Gel, string> = {
  tungsten: "#F5D3A0",
  amber: "#FFA531",
  red: "#FF4433",
  magenta: "#FF2E93",
  violet: "#A666FF",
  congo: "#5B4BFF",
  cyan: "#1CC8E6",
  green: "#3EEB9A",
};

export const GEL_NAMES: Record<Gel, string> = {
  tungsten: "Тёплый белый",
  amber: "Янтарь",
  red: "Красный",
  magenta: "Маджента",
  violet: "Фиолетовый",
  congo: "Синий конго",
  cyan: "Циан",
  green: "Зелёный",
};

const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_NOM = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

/** Wall-clock parts of a date in the given IANA time zone. */
export function zoned(date: Date | string, tz = "Europe/Moscow") {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const month = Number(get("month")) - 1;
  return {
    year: Number(get("year")),
    month,
    day: Number(get("day")),
    time: `${get("hour")}:${get("minute")}`,
    weekday: WEEKDAYS[wd],
    monthGen: MONTHS_GEN[month],
    monthShort: MONTHS_SHORT[month],
    monthNom: MONTHS_NOM[month],
  };
}

export function formatDateLong(date: Date | string, tz?: string) {
  const z = zoned(date, tz);
  return `${z.day} ${z.monthGen} ${z.year}, ${z.weekday}`;
}

export function formatPrice(n: number, currency = "₽") {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ${currency}`;
}

export function currencyFor(country: string | null | undefined) {
  switch (country) {
    case "Казахстан":
      return "₸";
    case "ОАЭ":
      return "AED";
    case "Армения":
      return "֏";
    default:
      return "₽";
  }
}

export function pluralRu(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function slugify(input: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
