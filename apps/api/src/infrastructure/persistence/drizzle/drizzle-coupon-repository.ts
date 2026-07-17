import { count, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Coupon } from "../../../domain/coupon/coupon.js";
import type {
  CouponRepository,
  ListCouponsParams,
  ListCouponsResult,
} from "../../../domain/coupon/coupon-repository.js";
import { couponFromRow, couponToRow } from "./coupon-mapper.js";
import { coupons, type CouponRow } from "./schema.js";
import type * as schema from "./schema.js";

export class DrizzleCouponRepository implements CouponRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async save(coupon: Coupon): Promise<void> {
    const row = couponToRow(coupon);
    await this.db
      .insert(coupons)
      .values(row)
      .onConflictDoUpdate({
        target: coupons.id,
        set: {
          code: row.code,
          discountType: row.discountType,
          discountValue: row.discountValue,
          status: row.status,
          usageCount: row.usageCount,
          minOrderAmount: row.minOrderAmount,
          expiresAt: row.expiresAt,
        },
      });
  }

  async findById(id: string): Promise<Coupon | null> {
    const rows = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);
    return rows[0] ? couponFromRow(rows[0]) : null;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    const rows = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.code, normalized))
      .limit(1);
    return rows[0] ? couponFromRow(rows[0]) : null;
  }

  async list(params: ListCouponsParams): Promise<ListCouponsResult> {
    const offset = (params.page - 1) * params.pageSize;
    const [totalRow] = await this.db.select({ value: count() }).from(coupons);
    const rows: CouponRow[] = await this.db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt))
      .limit(params.pageSize)
      .offset(offset);

    return {
      items: rows.map(couponFromRow),
      total: Number(totalRow?.value ?? 0),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(coupons).where(eq(coupons.id, id));
  }
}
