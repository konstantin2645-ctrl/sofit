import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const gelEnum = pgEnum("gel", [
  "tungsten",
  "amber",
  "red",
  "magenta",
  "violet",
  "congo",
  "cyan",
  "green",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "sold_out",
  "cancelled",
]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "in_progress", "done", "archived"]);
export const orderStatusEnum = pgEnum("order_status", ["reserved", "paid", "cancelled"]);

export type TicketTier = { name: string; price: number; total: number; sold: number; note?: string };
export type MediaItem = { type: "image" | "video"; src: string; poster?: string; caption?: string };
export type Stat = { value: string; label: string };

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  genre: text("genre").notNull(),
  country: text("country").notNull().default("Россия"),
  bio: text("bio").notNull().default(""),
  image: text("image"),
  website: text("website"),
  ...timestamps,
});

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("Россия"),
  address: text("address").notNull(),
  capacity: integer("capacity").notNull().default(0),
  timezone: text("timezone").notNull().default("Europe/Moscow"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  description: text("description").notNull().default(""),
  image: text("image"),
  ...timestamps,
});

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    artistId: integer("artist_id").references(() => artists.id, { onDelete: "set null" }),
    venueId: integer("venue_id").references(() => venues.id, { onDelete: "set null" }),
    lineup: jsonb("lineup").$type<string[]>().notNull().default([]),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    doorsAt: timestamp("doors_at", { withTimezone: true }),
    genre: text("genre").notNull(),
    gel: gelEnum("gel").notNull().default("tungsten"),
    cover: text("cover"),
    gallery: jsonb("gallery").$type<MediaItem[]>().notNull().default([]),
    description: text("description").notNull().default(""),
    ageLimit: integer("age_limit").notNull().default(12),
    status: eventStatusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    ticketUrl: text("ticket_url"),
    tiers: jsonb("tiers").$type<TicketTier[]>().notNull().default([]),
    ...timestamps,
  },
  (t) => [uniqueIndex("events_slug_idx").on(t.slug), index("events_starts_idx").on(t.startsAt)],
);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  client: text("client").notNull().default(""),
  category: text("category").notNull(),
  year: integer("year").notNull(),
  city: text("city").notNull().default(""),
  summary: text("summary").notNull().default(""),
  body: text("body").notNull().default(""),
  cover: text("cover"),
  gel: gelEnum("gel").notNull().default("tungsten"),
  media: jsonb("media").$type<MediaItem[]>().notNull().default([]),
  stats: jsonb("stats").$type<Stat[]>().notNull().default([]),
  position: integer("position").notNull().default(0),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  company: text("company").notNull().default(""),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  budget: text("budget").notNull().default(""),
  eventDate: text("event_date").notNull().default(""),
  message: text("message").notNull().default(""),
  status: leadStatusEnum("status").notNull().default("new"),
  note: text("note").notNull().default(""),
  ...timestamps,
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(),
  quantity: integer("quantity").notNull(),
  amount: integer("amount").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  status: orderStatusEnum("status").notNull().default("reserved"),
  ...timestamps,
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Artist = typeof artists.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Gel = (typeof gelEnum.enumValues)[number];
