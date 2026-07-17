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
import type {
  CouponDto,
  PaginatedCoupons,
} from "@audax/contracts";
import { CreateCouponUseCase } from "../../application/coupon/create-coupon.js";
import { DeleteCouponUseCase } from "../../application/coupon/delete-coupon.js";
import { GetCouponUseCase } from "../../application/coupon/get-coupon.js";
import { ListCouponsUseCase } from "../../application/coupon/list-coupons.js";
import { UpdateCouponUseCase } from "../../application/coupon/update-coupon.js";
import type { Coupon } from "../../domain/coupon/coupon.js";
import { CouponErrors } from "../../domain/coupon/coupon-errors.js";
import {
  createCouponBodySchema,
  listCouponsQuerySchema,
  updateCouponBodySchema,
  type CreateCouponBody,
  type ListCouponsQuery,
  type UpdateCouponBody,
} from "./coupon.schemas.js";
import { mapCouponHttpError } from "./map-coupon-http-error.js";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

@Controller("coupons")
export class CouponsController {
  constructor(
    @Inject(CreateCouponUseCase)
    private readonly createCoupon: CreateCouponUseCase,
    @Inject(GetCouponUseCase)
    private readonly getCoupon: GetCouponUseCase,
    @Inject(ListCouponsUseCase)
    private readonly listCoupons: ListCouponsUseCase,
    @Inject(UpdateCouponUseCase)
    private readonly updateCoupon: UpdateCouponUseCase,
    @Inject(DeleteCouponUseCase)
    private readonly deleteCoupon: DeleteCouponUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createCouponBodySchema))
    body: CreateCouponBody,
  ): Promise<CouponDto> {
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
    @Query(new ZodValidationPipe(listCouponsQuerySchema))
    query: ListCouponsQuery,
  ): Promise<PaginatedCoupons> {
    const result = await this.listCoupons.execute({
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items: result.items.map((coupon) => this.toResponse(coupon)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @Get(":id")
  async getById(@Param("id") id: string): Promise<CouponDto> {
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
    @Body(new ZodValidationPipe(updateCouponBodySchema))
    body: UpdateCouponBody,
  ): Promise<CouponDto> {
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

  private toResponse(coupon: Coupon): CouponDto {
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
