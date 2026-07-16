import { describe, expect, it } from "vitest";
import { CreateCouponUseCase } from "./create-coupon.js";
import { ListCouponsUseCase } from "./list-coupons.js";
import { InMemoryCouponRepository } from "../../infrastructure/persistence/in-memory-coupon-repository.js";

describe("ListCouponsUseCase", () => {
  it("lists coupons with pagination", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);
    const listCoupons = new ListCouponsUseCase(repository);

    await createCoupon.execute({
      code: "ONE",
      discountType: "PERCENTAGE",
      discountValue: 1,
    });
    await createCoupon.execute({
      code: "TWO",
      discountType: "PERCENTAGE",
      discountValue: 2,
    });
    await createCoupon.execute({
      code: "THREE",
      discountType: "PERCENTAGE",
      discountValue: 3,
    });

    const page = await listCoupons.execute({ page: 1, pageSize: 2 });

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(2);
  });
});
