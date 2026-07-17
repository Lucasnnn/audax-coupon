import { CouponErrors } from "./coupon-errors.js";
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

export type ReconstituteCouponProps = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  status: CouponStatus;
  usageCount: number;
  minOrderAmount?: number;
  expiresAt?: Date;
};

export class Coupon {
  private _status: CouponStatus;
  private _discountType: DiscountType;
  private _discountValue: number;
  private _minOrderAmount: number | undefined;
  private _expiresAt: Date | undefined;

  private constructor(
    readonly id: string,
    readonly code: string,
    discountType: DiscountType,
    discountValue: number,
    status: CouponStatus,
    readonly usageCount: number,
    minOrderAmount: number | undefined,
    expiresAt: Date | undefined,
  ) {
    this._discountType = discountType;
    this._discountValue = discountValue;
    this._status = status;
    this._minOrderAmount = minOrderAmount;
    this._expiresAt = expiresAt;
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

  get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  deactivate(): void {
    this._status = "INACTIVE";
  }

  activate(): void {
    this._status = "ACTIVE";
  }

  isExpired(now = new Date()): boolean {
    return this._expiresAt !== undefined && this._expiresAt.getTime() <= now.getTime();
  }

  changeExpiration(expiresAt: Date | undefined): void {
    this._expiresAt = expiresAt;
  }

  changeDiscount(props: ChangeDiscountProps): void {
    Coupon.assertDiscountInvariants(props);

    this._discountType = props.discountType;
    this._discountValue = props.discountValue;
    this._minOrderAmount = props.minOrderAmount;
  }

  static create(props: CreateCouponProps): Coupon {
    const code = props.code.trim().toUpperCase();
    if (code.length === 0) {
      throw new Error(CouponErrors.codeEmpty);
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

  static reconstitute(props: ReconstituteCouponProps): Coupon {
    if (props.code.trim().length === 0) {
      throw new Error(CouponErrors.codeEmpty);
    }
    if (
      !Number.isInteger(props.usageCount) ||
      props.usageCount < 0
    ) {
      throw new Error(CouponErrors.invalidUsageCount);
    }
    if (props.status !== "ACTIVE" && props.status !== "INACTIVE") {
      throw new Error(CouponErrors.invalidStatus);
    }
    Coupon.assertDiscountInvariants({
      discountType: props.discountType,
      discountValue: props.discountValue,
      minOrderAmount: props.minOrderAmount,
    });

    return new Coupon(
      props.id,
      props.code,
      props.discountType,
      props.discountValue,
      props.status,
      props.usageCount,
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
        throw new Error(CouponErrors.percentageRange);
      }
    }

    if (props.discountType === "FIXED") {
      if (
        !Number.isInteger(props.discountValue) ||
        props.discountValue <= 0
      ) {
        throw new Error(CouponErrors.fixedPositive);
      }
      if (props.minOrderAmount === undefined) {
        throw new Error(CouponErrors.fixedRequiresMin);
      }
      if (props.minOrderAmount < props.discountValue) {
        throw new Error(CouponErrors.minOrderTooLow);
      }
    }
  }
}
