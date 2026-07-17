import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import postgres from "postgres";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required to run the seed");
    process.exit(1);
  }

  const seedPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../drizzle/0001_seed_mock_coupons.sql",
  );
  const seedSql = readFileSync(seedPath, "utf8");

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql.unsafe(seedSql);
    console.log("Seed applied: 30 mock coupons (incl. USEDDEMO12 usage_count=12)");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main();
