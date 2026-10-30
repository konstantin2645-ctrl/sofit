import "dotenv/config";
import { writeFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { pgOptions, urlCandidates } from "../src/db/options";

async function main() {
  const env = process.env.DATABASE_URL;
  if (!env) throw new Error("DATABASE_URL is not set");
  let lastError: unknown;
  for (const url of urlCandidates(env)) {
    const client = postgres(url, pgOptions(url, 1));
    try {
      await client`select 1`;
    } catch (e) {
      lastError = e;
      await client.end().catch(() => {});
      continue;
    }
    try {
      await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
      console.log("migrations applied");
      if (url !== env) {
        // Remember the working pooler host for the seed step and the app bundle.
        writeFileSync("src/db/resolved-url.json", JSON.stringify({ from: env, url }));
        console.log("using alternate Supabase pooler host");
      }
    } finally {
      await client.end();
    }
    return;
  }
  throw lastError;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
