import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CreateCouponUseCase } from "../../application/coupon/create-coupon.js";
import { DeleteCouponUseCase } from "../../application/coupon/delete-coupon.js";
import { GetCouponUseCase } from "../../application/coupon/get-coupon.js";
import { ListCouponsUseCase } from "../../application/coupon/list-coupons.js";
import {
  UpdateCouponUseCase,
  type UpdateCouponInput,
} from "../../application/coupon/update-coupon.js";
import type { Coupon } from "../../domain/coupon/coupon.js";
import type { CreateCouponProps } from "../../domain/coupon/coupon.js";
import { CouponErrors } from "../../domain/coupon/coupon-errors.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";
import { mapCouponHttpError } from "./map-coupon-http-error.js";
import { COUPON_REPOSITORY } from "./tokens.js";

@Controller("coupons")
export class CouponsController {
  private readonly createCoupon: CreateCouponUseCase;
  private readonly getCoupon: GetCouponUseCase;
  private readonly listCoupons: ListCouponsUseCase;
  private readonly updateCoupon: UpdateCouponUseCase;
  private readonly deleteCoupon: DeleteCouponUseCase;

  constructor(@Inject(COUPON_REPOSITORY) repository: CouponRepository) {
    this.createCoupon = new CreateCouponUseCase(repository);
    this.getCoupon = new GetCouponUseCase(repository);
    this.listCoupons = new ListCouponsUseCase(repository);
    this.updateCoupon = new UpdateCouponUseCase(repository);
    this.deleteCoupon = new DeleteCouponUseCase(repository);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    body: Omit<CreateCouponProps, "expiresAt"> & { expiresAt?: string },
  ) {
    try {
      const coupon = await this.createCoupon.execute({
        ...body,
        expiresAt: parseExpiresAt(body.expiresAt),
      });
      return this.toResponse(coupon);
    } catch (error) {
      mapCouponHttpError(error);
    }
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
      throw new NotFoundException(CouponErrors.notFound);
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: Omit<UpdateCouponInput, "id" | "expiresAt"> & {
      expiresAt?: string | null;
    },
  ) {
    try {
      await this.updateCoupon.execute({
        id,
        ...body,
        expiresAt: parseExpiresAtInput(body.expiresAt),
      });
      const coupon = await this.getCoupon.execute(id);
      return this.toResponse(coupon);
    } catch (error) {
      mapCouponHttpError(error);
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    try {
      await this.deleteCoupon.execute(id);
    } catch (error) {
      mapCouponHttpError(error);
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
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    };
  }
}

function parseExpiresAt(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

function parseExpiresAtInput(
  value?: string | null,
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Date(value);
}
