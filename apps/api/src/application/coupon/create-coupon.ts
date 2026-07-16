import {
  Coupon,
  type CreateCouponProps,
} from "../../domain/coupon/coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";

export class CreateCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(props: CreateCouponProps): Promise<Coupon> {
    const coupon = Coupon.create(props);
    await this.repository.save(coupon);
    return coupon;
  }
}
