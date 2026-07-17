import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { ensureCouponSchema } from "./ensure-schema.js";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations");
  process.exit(1);
}

await ensureCouponSchema(databaseUrl);
console.log("Coupon schema ensured");
