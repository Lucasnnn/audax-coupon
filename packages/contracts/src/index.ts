export const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const COUPON_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];

export type CouponDto = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  status: CouponStatus;
  usageCount: number;
  minOrderAmount: number | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CreateCouponRequest = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  expiresAt?: string;
};

export type UpdateCouponRequest = {
  status?: CouponStatus;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  expiresAt?: string | null;
};

export type PaginatedCoupons = {
  items: CouponDto[];
  total: number;
  page: number;
  pageSize: number;
};
