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

    if (props.discountType === "PERCENTAGE") {
      if (
        !Number.isInteger(props.discountValue) ||
        props.discountValue < 1 ||
        props.discountValue > 100
      ) {
        throw new Error("Percentage discount value must be an integer between 1 and 100");
      }
    }

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
