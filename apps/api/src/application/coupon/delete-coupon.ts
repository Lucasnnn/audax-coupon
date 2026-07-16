import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";

export class DeleteCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(id: string): Promise<void> {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new Error("Coupon not found");
    }
    if (coupon.usageCount > 0) {
      throw new Error("Used coupons cannot be deleted");
    }
    await this.repository.delete(id);
  }
}
