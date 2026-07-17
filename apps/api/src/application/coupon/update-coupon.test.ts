import { describe, expect, it } from "vitest";
import { Coupon } from "../../domain/coupon/coupon.js";
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

  it("updates status and expiration after the coupon has been used", async () => {
    const repository = new InMemoryCouponRepository();
    const updateCoupon = new UpdateCouponUseCase(repository);
    const getCoupon = new GetCouponUseCase(repository);

    const used = Coupon.reconstitute({
      id: "22222222-2222-2222-2222-222222222222",
      code: "USEDUPD",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 2,
      minOrderAmount: undefined,
      expiresAt: undefined,
    });
    await repository.save(used);

    const nextExpiration = new Date("2027-01-01T00:00:00.000Z");
    await updateCoupon.execute({
      id: used.id,
      status: "INACTIVE",
      expiresAt: nextExpiration,
    });

    const updated = await getCoupon.execute(used.id);
    expect(updated.status).toBe("INACTIVE");
    expect(updated.expiresAt).toEqual(nextExpiration);
  });

  it("rejects discount changes after the coupon has been used", async () => {
    const repository = new InMemoryCouponRepository();
    const updateCoupon = new UpdateCouponUseCase(repository);

    const used = Coupon.reconstitute({
      id: "33333333-3333-3333-3333-333333333333",
      code: "USEDDISC",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 1,
      minOrderAmount: undefined,
      expiresAt: undefined,
    });
    await repository.save(used);

    await expect(
      updateCoupon.execute({
        id: used.id,
        discountType: "PERCENTAGE",
        discountValue: 20,
      }),
    ).rejects.toThrow(/discount/i);
  });

  it("rejects updating expiration to a date before today", async () => {
    const repository = new InMemoryCouponRepository();
    const createCoupon = new CreateCouponUseCase(repository);
    const updateCoupon = new UpdateCouponUseCase(repository);

    const created = await createCoupon.execute({
      code: "PASTUPD",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    await expect(
      updateCoupon.execute({
        id: created.id,
        expiresAt: new Date("2020-06-01T00:00:00.000Z"),
      }),
    ).rejects.toThrow(/expiration date cannot be before today/i);
  });
});
