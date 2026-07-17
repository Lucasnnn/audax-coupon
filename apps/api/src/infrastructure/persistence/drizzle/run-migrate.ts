import "dotenv/config";
import { ensureCouponSchema } from "./ensure-schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations");
  process.exit(1);
}

await ensureCouponSchema(databaseUrl);
console.log("Coupon schema ensured");
