import { describe, expect, it } from "vitest";
import { CreateCouponUseCase } from "./create-coupon.js";
import { GetCouponUseCase } from "./get-coupon.js";
import { InMemoryCouponRepository } from "../../infrastructure/persistence/in-memory-coupon-repository.js";

describe("GetCouponUseCase", () => {
  it("returns the coupon when it exists", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);
    const getCoupon = new GetCouponUseCase(repository);

    const created = await createCoupon.execute({
      code: "GETME",
      discountType: "PERCENTAGE",
      discountValue: 5,
    });

    const found = await getCoupon.execute(created.id);

    expect(found.id).toBe(created.id);
    expect(found.code).toBe("GETME");
  });
  it("rejects when the coupon does not exist", async () => {
    const getCoupon = new GetCouponUseCase(new InMemoryCouponRepository());

    await expect(
      getCoupon.execute("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow(/not found/i);
  });

});
