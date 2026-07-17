import { describe, expect, it } from "vitest";
import { Coupon } from "../../domain/coupon/coupon.js";
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

    await expect(getCoupon.execute(created.id)).rejects.toThrow(/não encontrado/i);
  });

  it("rejects deleting a coupon that has already been used", async () => {
    const repository = new InMemoryCouponRepository();
    const deleteCoupon = new DeleteCouponUseCase(repository);

    const used = Coupon.reconstitute({
      id: "11111111-1111-1111-1111-111111111111",
      code: "USED",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 1,
      minOrderAmount: undefined,
      expiresAt: undefined,
    });
    await repository.save(used);

    await expect(deleteCoupon.execute(used.id)).rejects.toThrow(
      /não podem ser excluídos/i,
    );
  });
});
