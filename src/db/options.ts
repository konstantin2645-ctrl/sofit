import type { Options } from "postgres";

/** Connection options: TLS for any non-local database (Supabase, Render, Neon...). */
export function pgOptions(url: string, max = 10): Options<Record<string, never>> {
  const local = /@(localhost|127\.0\.0\.1|db|postgres)(:|\/)/.test(url) || url.includes("host=/");
  const ssl = process.env.DB_SSL === "false" ? false : process.env.DB_SSL === "true" || !local ? "require" : false;
  return { max, idle_timeout: 20, prepare: false, ssl };
}
