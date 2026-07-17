import type { CouponStatus, DiscountType } from "../../domain/coupon/coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";

export type UpdateCouponInput = {
  id: string;
  status?: CouponStatus;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  expiresAt?: Date | null;
};

export class UpdateCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(input: UpdateCouponInput): Promise<void> {
    const coupon = await this.repository.findById(input.id);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    if (input.status === "INACTIVE") {
      coupon.deactivate();
    }
    if (input.status === "ACTIVE") {
      coupon.activate();
    }

    if (input.discountType !== undefined && input.discountValue !== undefined) {
      coupon.changeDiscount({
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmount: input.minOrderAmount,
      });
    }

    if (input.expiresAt !== undefined) {
      coupon.changeExpiration(
        input.expiresAt === null ? undefined : input.expiresAt,
      );
    }

    await this.repository.save(coupon);
  }
}
