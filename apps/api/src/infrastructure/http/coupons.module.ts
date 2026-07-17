import { Module } from "@nestjs/common";
import { CreateCouponUseCase } from "../../application/coupon/create-coupon.js";
import { DeleteCouponUseCase } from "../../application/coupon/delete-coupon.js";
import { GetCouponUseCase } from "../../application/coupon/get-coupon.js";
import { ListCouponsUseCase } from "../../application/coupon/list-coupons.js";
import { UpdateCouponUseCase } from "../../application/coupon/update-coupon.js";
import type { CouponRepository } from "../../domain/coupon/coupon-repository.js";
import { createDrizzleClient } from "../persistence/drizzle/client.js";
import { DrizzleCouponRepository } from "../persistence/drizzle/drizzle-coupon-repository.js";
import { InMemoryCouponRepository } from "../persistence/in-memory-coupon-repository.js";
import { resolvePersistenceMode } from "../persistence/persistence-mode.js";
import { CouponsController } from "./coupons.controller.js";
import { COUPON_REPOSITORY } from "./tokens.js";

@Module({
  controllers: [CouponsController],
  providers: [
    {
      provide: COUPON_REPOSITORY,
      useFactory: () => {
        if (resolvePersistenceMode() === "memory") {
          return new InMemoryCouponRepository();
        }

        const { db } = createDrizzleClient(process.env.DATABASE_URL!);
        return new DrizzleCouponRepository(db);
      },
    },
    {
      provide: CreateCouponUseCase,
      useFactory: (repository: CouponRepository) =>
        new CreateCouponUseCase(repository),
      inject: [COUPON_REPOSITORY],
    },
    {
      provide: GetCouponUseCase,
      useFactory: (repository: CouponRepository) =>
        new GetCouponUseCase(repository),
      inject: [COUPON_REPOSITORY],
    },
    {
      provide: ListCouponsUseCase,
      useFactory: (repository: CouponRepository) =>
        new ListCouponsUseCase(repository),
      inject: [COUPON_REPOSITORY],
    },
    {
      provide: UpdateCouponUseCase,
      useFactory: (repository: CouponRepository) =>
        new UpdateCouponUseCase(repository),
      inject: [COUPON_REPOSITORY],
    },
    {
      provide: DeleteCouponUseCase,
      useFactory: (repository: CouponRepository) =>
        new DeleteCouponUseCase(repository),
      inject: [COUPON_REPOSITORY],
    },
  ],
})
export class CouponsModule {}
