import type { Coupon } from "../../domain/coupon/coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";

export class InMemoryCouponRepository implements CouponRepository {
  private readonly coupons = new Map<string, Coupon>();

  async save(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.id, coupon);
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.coupons.get(id) ?? null;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    for (const coupon of this.coupons.values()) {
      if (coupon.code === normalized) {
        return coupon;
      }
    }
    return null;
  }
}
