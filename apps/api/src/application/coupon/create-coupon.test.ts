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

  it("rejects creating a coupon with a code that already exists", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);

    await createCoupon.execute({
      code: "SAVE10",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    await expect(
      createCoupon.execute({
        code: "save10",
        discountType: "PERCENTAGE",
        discountValue: 15,
      }),
    ).rejects.toThrow(/coupon code/i);
  });

  it("preserves expiration date on create", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);
    const expiresAt = new Date("2026-12-31T23:59:00.000Z");

    const created = await createCoupon.execute({
      code: "DATED",
      discountType: "PERCENTAGE",
      discountValue: 10,
      expiresAt,
    });

    const found = await repository.findById(created.id);

    expect(found?.expiresAt).toEqual(expiresAt);
    expect(found?.isExpired(new Date("2027-01-01T00:00:00.000Z"))).toBe(true);
  });
});
