import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from "@nestjs/common";
import { CreateCouponUseCase } from "../../application/coupon/create-coupon.js";
import type { Coupon, CreateCouponProps } from "../../domain/coupon/coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";
import { COUPON_REPOSITORY } from "./tokens.js";

@Controller("coupons")
export class CouponsController {
  private readonly createCoupon: CreateCouponUseCase;

  constructor(@Inject(COUPON_REPOSITORY) repository: CouponRepository) {
    this.createCoupon = new CreateCouponUseCase(repository);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCouponProps) {
    const coupon = await this.createCoupon.execute(body);
    return this.toResponse(coupon);
  }

  private toResponse(coupon: Coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      status: coupon.status,
      usageCount: coupon.usageCount,
      minOrderAmount: coupon.minOrderAmount ?? null,
      expiresAt: coupon.expiresAt ?? null,
    };
  }
}
