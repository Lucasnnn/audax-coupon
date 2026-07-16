import { describe, expect, it } from "vitest";
import { CreateCouponUseCase } from "./create-coupon.js";
import { DeleteCouponUseCase } from "./delete-coupon.js";
import { GetCouponUseCase } from "./get-coupon.js";
import { InMemoryCouponRepository } from "../../infrastructure/persistence/in-memory-coupon-repository.js";

describe("DeleteCouponUseCase", () => {
  it("removes a coupon so it can no longer be retrieved", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);
    const deleteCoupon = new DeleteCouponUseCase(repository);
    const getCoupon = new GetCouponUseCase(repository);

    const created = await createCoupon.execute({
      code: "GONE",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    await deleteCoupon.execute(created.id);

    await expect(getCoupon.execute(created.id)).rejects.toThrow(/not found/i);
  });
});
