import { z } from "zod";

const gel = z.enum(["tungsten", "amber", "red", "magenta", "violet", "congo", "cyan", "green"]);
const slug = z
  .string()
  .trim()
  .min(2, "Минимум 2 символа")
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы");
const url = z.string().trim().max(500);
const optUrl = url.optional().nullable().transform((v) => (v ? v : null));
const mediaItem = z.object({
  type: z.enum(["image", "video"]),
  src: url.min(1),
  poster: url.optional(),
  caption: z.string().max(200).optional(),
});

export const leadInput = z.object({
  type: z.enum(["partnership", "corporate", "artist", "festival", "other"]),
  name: z.string().trim().min(2, "Укажите имя").max(120),
  company: z.string().trim().max(160).default(""),
  email: z.string().trim().toLowerCase().email("Проверьте адрес почты").max(160),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[\d\s+()-]*$/, "Только цифры, пробелы и + ( ) -")
    .default(""),
  budget: z.string().trim().max(60).default(""),
  eventDate: z.string().trim().max(60).default(""),
  message: z.string().trim().min(10, "Расскажите о задаче хотя бы в паре предложений").max(4000),
  consent: z.literal(true, { message: "Нужно согласие на обработку данных" }),
  website: z.string().max(0).optional(), // honeypot
});

export const orderInput = z.object({
  eventId: z.number().int().positive(),
  tier: z.string().min(1).max(80),
  quantity: z.number().int().min(1, "Минимум один билет").max(10, "Не больше 10 билетов в заказе"),
  name: z.string().trim().min(2, "Укажите имя").max(120),
  email: z.string().trim().toLowerCase().email("Проверьте адрес почты").max(160),
  phone: z.string().trim().max(40).regex(/^[\d\s+()-]*$/, "Только цифры, пробелы и + ( ) -").default(""),
  consent: z.literal(true, { message: "Нужно согласие с правилами покупки" }),
});

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email("Проверьте адрес почты"),
  password: z.string().min(1, "Введите пароль").max(200),
});

export const tierInput = z.object({
  name: z.string().trim().min(1, "Название категории").max(80),
  price: z.coerce.number().int().min(0),
  total: z.coerce.number().int().min(0),
  sold: z.coerce.number().int().min(0).default(0),
  note: z.string().max(120).optional(),
});

export const eventInput = z.object({
  slug,
  title: z.string().trim().min(2, "Укажите название").max(160),
  subtitle: z.string().trim().max(200).default(""),
  artistId: z.coerce.number().int().positive().nullable().optional(),
  venueId: z.coerce.number().int().positive().nullable().optional(),
  lineup: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
  startsAt: z.coerce.date({ message: "Укажите дату и время" }),
  doorsAt: z.coerce.date().nullable().optional(),
  genre: z.string().trim().min(2, "Укажите жанр").max(60),
  gel,
  cover: optUrl,
  gallery: z.array(mediaItem).max(40).default([]),
  description: z.string().max(10000).default(""),
  ageLimit: z.coerce.number().int().min(0).max(21).default(12),
  status: z.enum(["draft", "published", "sold_out", "cancelled"]),
  featured: z.boolean().default(false),
  ticketUrl: optUrl,
  tiers: z.array(tierInput).max(12).default([]),
});

export const artistInput = z.object({
  slug,
  name: z.string().trim().min(1, "Укажите имя").max(120),
  genre: z.string().trim().min(2, "Укажите жанр").max(60),
  country: z.string().trim().max(60).default("Россия"),
  bio: z.string().max(5000).default(""),
  image: optUrl,
  website: optUrl,
});

export const venueInput = z.object({
  slug,
  name: z.string().trim().min(2, "Укажите название").max(120),
  city: z.string().trim().min(2, "Укажите город").max(80),
  country: z.string().trim().max(60).default("Россия"),
  address: z.string().trim().min(3, "Укажите адрес").max(200),
  capacity: z.coerce.number().int().min(0).max(200000).default(0),
  timezone: z.string().trim().max(60).default("Europe/Moscow"),
  lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  lng: z.coerce.number().min(-180).max(180).nullable().optional(),
  description: z.string().max(5000).default(""),
  image: optUrl,
});

export const projectInput = z.object({
  slug,
  title: z.string().trim().min(2, "Укажите название").max(160),
  client: z.string().trim().max(160).default(""),
  category: z.string().trim().min(2, "Укажите тип").max(60),
  year: z.coerce.number().int().min(1990).max(2100),
  city: z.string().trim().max(120).default(""),
  summary: z.string().max(600).default(""),
  body: z.string().max(20000).default(""),
  cover: optUrl,
  gel,
  media: z.array(mediaItem).max(60).default([]),
  stats: z.array(z.object({ value: z.string().max(30), label: z.string().max(80) })).max(8).default([]),
  position: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

export const settingsInput = z.object({
  hero: z
    .object({
      title: z.string().min(1).max(120),
      lead: z.string().max(400),
      video: z.string().max(500),
      poster: z.string().max(500),
      primaryCta: z.string().min(1).max(40),
      secondaryCta: z.string().min(1).max(40),
    })
    .optional(),
  about: z
    .object({
      manifesto: z.string().max(600),
      text: z.string().max(1500),
      stats: z.array(z.object({ value: z.string().max(20), label: z.string().max(80) })).max(6),
    })
    .optional(),
  services: z
    .array(
      z.object({
        slug,
        title: z.string().min(1).max(80),
        lead: z.string().max(400),
        points: z.array(z.string().max(160)).max(10),
        image: z.string().max(500),
      }),
    )
    .max(10)
    .optional(),
  contacts: z
    .object({
      phone: z.string().max(40),
      email: z.string().email(),
      pressEmail: z.string().email(),
      address: z.string().max(200),
      city: z.string().max(80),
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      hours: z.string().max(80),
      socials: z.array(z.object({ name: z.string().max(40), url: z.string().url() })).max(10),
    })
    .optional(),
  partners: z.array(z.object({ name: z.string().min(1).max(80), kind: z.string().max(80) })).max(40).optional(),
});

export const leadPatch = z.object({
  status: z.enum(["new", "in_progress", "done", "archived"]).optional(),
  note: z.string().max(2000).optional(),
});
export const orderPatch = z.object({ status: z.enum(["reserved", "paid", "cancelled"]) });

export type LeadInput = z.infer<typeof leadInput>;
