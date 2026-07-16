import type {
  CouponRepository,
  ListCouponsParams,
  ListCouponsResult,
} from "../../domain/coupon/coupon-repository.js";

export class ListCouponsUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(params: ListCouponsParams): Promise<ListCouponsResult> {
    return this.repository.list(params);
  }
}
