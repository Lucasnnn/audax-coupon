import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./infrastructure/http/app.module.js";
import { ensureCouponSchema } from "./infrastructure/persistence/drizzle/ensure-schema.js";

async function bootstrap() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    await ensureCouponSchema(databaseUrl);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
