import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

export async function ensureCouponSchema(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../drizzle/0000_init.sql",
    );
    const migration = readFileSync(migrationPath, "utf8");
    await sql.unsafe(migration);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
