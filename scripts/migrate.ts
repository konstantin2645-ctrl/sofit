import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
migrate(drizzle(client), { migrationsFolder: "./drizzle" })
  .then(() => console.log("migrations applied"))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => client.end());
