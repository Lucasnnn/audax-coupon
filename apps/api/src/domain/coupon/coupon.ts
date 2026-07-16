export type DiscountType = "PERCENTAGE" | "FIXED";
export type CouponStatus = "ACTIVE" | "INACTIVE";

export type CreateCouponProps = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  expiresAt?: Date;
};

export class Coupon {
  private constructor(
    readonly id: string,
    readonly code: string,
    readonly discountType: DiscountType,
    readonly discountValue: number,
    readonly status: CouponStatus,
    readonly usageCount: number,
    readonly minOrderAmount: number | undefined,
    readonly expiresAt: Date | undefined,
  ) {}

  static create(props: CreateCouponProps): Coupon {
    const code = props.code.trim().toUpperCase();

    return new Coupon(
      crypto.randomUUID(),
      code,
      props.discountType,
      props.discountValue,
      "ACTIVE",
      0,
      props.minOrderAmount,
      props.expiresAt,
    );
  }
}
