export type DiscountType = "PERCENTAGE" | "FIXED";
export type CouponStatus = "ACTIVE" | "INACTIVE";

export type CouponDto = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  status: CouponStatus;
  usageCount: number;
  minOrderAmount: number | null;
  expiresAt: string | null;
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
