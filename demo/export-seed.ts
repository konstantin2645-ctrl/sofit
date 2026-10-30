/* Dumps the seeded database into demo/seed.json for the in-browser demo build. */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const camel = (r: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));

async function main() {
  const tables = ["artists", "venues", "events", "projects", "media", "leads", "orders"];
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString() };
  for (const t of tables) out[t] = (await sql.unsafe(`select * from ${t} order by id`)).map(camel);
  const settings = await sql`select key, value from settings`;
  out.settings = Object.fromEntries(settings.map((r) => [r.key, r.value]));
  // Paths become relative so the bundle works from any base URL.
  const json = JSON.stringify(out).replace(/"\/media\//g, '"media/');
  writeFileSync("demo/seed.json", json);
  console.log("demo/seed.json", (json.length / 1024).toFixed(0), "KB");
  await sql.end();
}
main();
