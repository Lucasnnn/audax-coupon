import type { Coupon } from "./coupon.js";

export type ListCouponsParams = {
  page: number;
  pageSize: number;
};

export type ListCouponsResult = {
  items: Coupon[];
  total: number;
  page: number;
  pageSize: number;
};

export interface CouponRepository {
  save(coupon: Coupon): Promise<void>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  list(params: ListCouponsParams): Promise<ListCouponsResult>;
}
