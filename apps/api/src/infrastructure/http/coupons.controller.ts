import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CreateCouponUseCase } from "../../application/coupon/create-coupon.js";
import { GetCouponUseCase } from "../../application/coupon/get-coupon.js";
import { ListCouponsUseCase } from "../../application/coupon/list-coupons.js";
import type { Coupon, CreateCouponProps } from "../../domain/coupon/coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";
import { COUPON_REPOSITORY } from "./tokens.js";

@Controller("coupons")
export class CouponsController {
  private readonly createCoupon: CreateCouponUseCase;
  private readonly getCoupon: GetCouponUseCase;
  private readonly listCoupons: ListCouponsUseCase;

  constructor(@Inject(COUPON_REPOSITORY) repository: CouponRepository) {
    this.createCoupon = new CreateCouponUseCase(repository);
    this.getCoupon = new GetCouponUseCase(repository);
    this.listCoupons = new ListCouponsUseCase(repository);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCouponProps) {
    const coupon = await this.createCoupon.execute(body);
    return this.toResponse(coupon);
  }

  @Get()
  async list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "10",
  ) {
    const result = await this.listCoupons.execute({
      page: Number(page),
      pageSize: Number(pageSize),
    });

    return {
      items: result.items.map((coupon) => this.toResponse(coupon)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    try {
      const coupon = await this.getCoupon.execute(id);
      return this.toResponse(coupon);
    } catch {
      throw new NotFoundException("Coupon not found");
    }
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
