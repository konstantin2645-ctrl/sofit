import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { pgOptions } from "./options";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");

const g = globalThis as unknown as { __sofitSql?: ReturnType<typeof postgres> };
const sql = g.__sofitSql ?? postgres(url, pgOptions(url));
if (process.env.NODE_ENV !== "production") g.__sofitSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
