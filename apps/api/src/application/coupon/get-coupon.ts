import type { Coupon } from "../../domain/coupon/coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";

export class GetCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(id: string): Promise<Coupon> {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new Error("Coupon not found");
    }
    return coupon;
  }
}
