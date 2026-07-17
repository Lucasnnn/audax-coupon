import {
  Coupon,
  type CreateCouponProps,
} from "../../domain/coupon/coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";
import { assertExpirationNotBeforeToday } from "./expiration-policy.js";

export class CreateCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(props: CreateCouponProps): Promise<Coupon> {
    if (props.expiresAt !== undefined) {
      assertExpirationNotBeforeToday(props.expiresAt);
    }

    const coupon = Coupon.create(props);
    const existing = await this.repository.findByCode(coupon.code);
    if (existing) {
      throw new Error("Coupon code must be unique");
    }
    await this.repository.save(coupon);
    return coupon;
  }
}
