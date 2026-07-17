import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";

export function mapCouponHttpError(error: unknown): never {
  if (!(error instanceof Error)) {
    throw error;
  }

  if (/not found/i.test(error.message)) {
    throw new NotFoundException("Coupon not found");
  }

  if (
    /unique/i.test(error.message) ||
    /cannot be deleted/i.test(error.message) ||
    /cannot change after the coupon has been used/i.test(error.message)
  ) {
    throw new ConflictException(error.message);
  }

  throw new BadRequestException(error.message);
}
