import { describe, expect, it } from "vitest";
import { CreateCouponUseCase } from "./create-coupon.js";
import { InMemoryCouponRepository } from "../../infrastructure/persistence/in-memory-coupon-repository.js";

describe("CreateCouponUseCase", () => {
  it("creates a coupon that can be retrieved by id", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);

    const created = await createCoupon.execute({
      code: "  save10  ",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.code).toBe("SAVE10");
    expect(found?.discountType).toBe("PERCENTAGE");
    expect(found?.discountValue).toBe(10);
  });
});
