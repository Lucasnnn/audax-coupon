import { Module } from "@nestjs/common";
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
  ],
})
export class CouponsModule {}
