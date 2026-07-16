import { Module } from "@nestjs/common";
import { CouponsModule } from "./coupons.module.js";

@Module({
  imports: [CouponsModule],
})
export class AppModule {}
