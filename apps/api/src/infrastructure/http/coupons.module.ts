import { Module } from "@nestjs/common";
import { createDrizzleClient } from "../persistence/drizzle/client.js";
import { DrizzleCouponRepository } from "../persistence/drizzle/drizzle-coupon-repository.js";
import { InMemoryCouponRepository } from "../persistence/in-memory-coupon-repository.js";
import { CouponsController } from "./coupons.controller.js";
import { COUPON_REPOSITORY } from "./tokens.js";

@Module({
  controllers: [CouponsController],
  providers: [
    {
      provide: COUPON_REPOSITORY,
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          return new InMemoryCouponRepository();
        }

        const { db } = createDrizzleClient(databaseUrl);
        return new DrizzleCouponRepository(db);
      },
    },
  ],
})
export class CouponsModule {}
