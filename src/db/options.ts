import type { Options } from "postgres";
import resolved from "./resolved-url.json";

/** Connection options: TLS for any non-local database (Supabase, Render, Neon...). */
export function pgOptions(url: string, max = 10): Options<Record<string, never>> {
  const local = /@(localhost|127\.0\.0\.1|db|postgres)(:|\/)/.test(url) || url.includes("host=/");
  const ssl = process.env.DB_SSL === "false" ? false : process.env.DB_SSL === "true" || !local ? "require" : false;
  return { max, idle_timeout: 20, prepare: false, ssl };
}

/** Supabase shared poolers live on aws-0-<region> or aws-1-<region>; try the other one too. */
export function urlCandidates(url: string) {
  const m = url.match(/aws-(\d)-([a-z0-9-]+)\.pooler\.supabase\.com/);
  if (!m) return [url];
  const other = m[1] === "0" ? "1" : "0";
  return [url, url.replace(`aws-${m[1]}-${m[2]}`, `aws-${other}-${m[2]}`)];
}

/** The URL the build step verified (scripts/migrate.ts writes it), else DATABASE_URL. */
export function databaseUrl() {
  const env = process.env.DATABASE_URL;
  const r = resolved as { from?: string; url?: string };
  return r.url && r.from === env ? r.url : env;
}
