import type { Coupon } from "./coupon.js";

export interface CouponRepository {
  save(coupon: Coupon): Promise<void>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
}
