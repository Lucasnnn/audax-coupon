import type { Coupon } from "../../domain/coupon/coupon.js";
import type {
  CouponRepository,
  ListCouponsParams,
  ListCouponsResult,
} from "../../domain/coupon/coupon-repository.js";

export class InMemoryCouponRepository implements CouponRepository {
  private readonly coupons = new Map<string, Coupon>();

  async save(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.id, coupon);
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.coupons.get(id) ?? null;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    for (const coupon of this.coupons.values()) {
      if (coupon.code === normalized) {
        return coupon;
      }
    }
    return null;
  }

  async list(params: ListCouponsParams): Promise<ListCouponsResult> {
    const all = [...this.coupons.values()]
      .reverse()
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    const start = (params.page - 1) * params.pageSize;
    const items = all.slice(start, start + params.pageSize);

    return {
      items,
      total: all.length,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async delete(id: string): Promise<void> {
    this.coupons.delete(id);
  }
}
