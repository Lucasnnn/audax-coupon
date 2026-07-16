import { Module } from "@nestjs/common";
import { InMemoryCouponRepository } from "../persistence/in-memory-coupon-repository.js";
import { CouponsController } from "./coupons.controller.js";
import { COUPON_REPOSITORY } from "./tokens.js";

@Module({
  controllers: [CouponsController],
  providers: [
    {
      provide: COUPON_REPOSITORY,
      useClass: InMemoryCouponRepository,
    },
  ],
})
export class CouponsModule {}
