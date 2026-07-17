import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  status: text("status").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  minOrderAmount: integer("min_order_amount"),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
});

export type CouponRow = typeof coupons.$inferSelect;
export type CouponInsert = typeof coupons.$inferInsert;
