import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";
import { CouponErrors } from "../../domain/coupon/coupon-errors.js";

export class DeleteCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(id: string): Promise<void> {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new Error(CouponErrors.notFound);
    }
    if (coupon.usageCount > 0) {
      throw new Error(CouponErrors.usedCannotDelete);
    }
    await this.repository.delete(id);
  }
}
