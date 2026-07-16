import { describe, expect, it } from "vitest";
import { CreateCouponUseCase } from "./create-coupon.js";
import { GetCouponUseCase } from "./get-coupon.js";
import { UpdateCouponUseCase } from "./update-coupon.js";
import { InMemoryCouponRepository } from "../../infrastructure/persistence/in-memory-coupon-repository.js";

describe("UpdateCouponUseCase", () => {
  it("deactivates a coupon without changing its code", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);
    const updateCoupon = new UpdateCouponUseCase(repository);
    const getCoupon = new GetCouponUseCase(repository);

    const created = await createCoupon.execute({
      code: "KEEP",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    await updateCoupon.execute({
      id: created.id,
      status: "INACTIVE",
    });

    const updated = await getCoupon.execute(created.id);
    expect(updated.code).toBe("KEEP");
    expect(updated.status).toBe("INACTIVE");
  });

  it("updates the expiration date", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);
    const updateCoupon = new UpdateCouponUseCase(repository);
    const getCoupon = new GetCouponUseCase(repository);

    const created = await createCoupon.execute({
      code: "DATE",
      discountType: "PERCENTAGE",
      discountValue: 10,
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const nextExpiration = new Date("2027-06-01T12:00:00.000Z");
    await updateCoupon.execute({
      id: created.id,
      expiresAt: nextExpiration,
    });

    const updated = await getCoupon.execute(created.id);
    expect(updated.expiresAt).toEqual(nextExpiration);
  });
});
