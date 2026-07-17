import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";
import { CouponErrors } from "../../domain/coupon/coupon-errors.js";

export class GetCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(id: string) {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new Error(CouponErrors.notFound);
    }
    return coupon;
  }
}
