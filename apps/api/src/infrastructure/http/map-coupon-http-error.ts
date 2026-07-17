import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { CouponErrors } from "../../domain/coupon/coupon-errors.js";

export function mapCouponHttpError(error: unknown): never {
  if (!(error instanceof Error)) {
    throw error;
  }

  if (error.message === CouponErrors.notFound) {
    throw new NotFoundException(CouponErrors.notFound);
  }

  if (
    error.message === CouponErrors.codeUnique ||
    error.message === CouponErrors.usedCannotDelete ||
    error.message === CouponErrors.usedCannotChangeDiscount
  ) {
    throw new ConflictException(error.message);
  }

  throw new BadRequestException(error.message);
}
