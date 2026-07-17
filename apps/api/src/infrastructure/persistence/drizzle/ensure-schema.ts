import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const drizzleDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../drizzle",
);

export async function ensureCouponSchema(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    for (const file of ["0000_init.sql", "0002_coupon_checks.sql"]) {
      const migration = readFileSync(join(drizzleDir, file), "utf8");
      await sql.unsafe(migration);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}
