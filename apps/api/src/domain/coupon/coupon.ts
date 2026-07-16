export type DiscountType = "PERCENTAGE" | "FIXED";
export type CouponStatus = "ACTIVE" | "INACTIVE";

export type CreateCouponProps = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  expiresAt?: Date;
};

export type ChangeDiscountProps = {
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
};

export class Coupon {
  private _status: CouponStatus;
  private _discountType: DiscountType;
  private _discountValue: number;
  private _minOrderAmount: number | undefined;

  private constructor(
    readonly id: string,
    readonly code: string,
    discountType: DiscountType,
    discountValue: number,
    status: CouponStatus,
    readonly usageCount: number,
    minOrderAmount: number | undefined,
    readonly expiresAt: Date | undefined,
  ) {
    this._discountType = discountType;
    this._discountValue = discountValue;
    this._status = status;
    this._minOrderAmount = minOrderAmount;
  }

  get status(): CouponStatus {
    return this._status;
  }

  get discountType(): DiscountType {
    return this._discountType;
  }

  get discountValue(): number {
    return this._discountValue;
  }

  get minOrderAmount(): number | undefined {
    return this._minOrderAmount;
  }

  deactivate(): void {
    this._status = "INACTIVE";
  }

  changeDiscount(props: ChangeDiscountProps): void {
    if (this.usageCount > 0) {
      throw new Error("Discount type and value cannot change after the coupon has been used");
    }

    Coupon.assertDiscountInvariants(props);

    this._discountType = props.discountType;
    this._discountValue = props.discountValue;
    this._minOrderAmount = props.minOrderAmount;
  }

  static create(props: CreateCouponProps): Coupon {
    const code = props.code.trim().toUpperCase();
    if (code.length === 0) {
      throw new Error("Coupon code must not be empty");
    }
    Coupon.assertDiscountInvariants(props);

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

  private static assertDiscountInvariants(props: ChangeDiscountProps): void {
    if (props.discountType === "PERCENTAGE") {
      if (
        !Number.isInteger(props.discountValue) ||
        props.discountValue < 1 ||
        props.discountValue > 100
      ) {
        throw new Error("Percentage discount value must be an integer between 1 and 100");
      }
    }

    if (props.discountType === "FIXED") {
      if (props.minOrderAmount === undefined) {
        throw new Error("Fixed discount requires a min order amount");
      }
      if (props.minOrderAmount < props.discountValue) {
        throw new Error(
          "Min order amount must be greater than or equal to the fixed discount value",
        );
      }
    }
  }
}
