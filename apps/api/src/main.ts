import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./infrastructure/http/app.module.js";
import { ensureCouponSchema } from "./infrastructure/persistence/drizzle/ensure-schema.js";
import { resolvePersistenceMode } from "./infrastructure/persistence/persistence-mode.js";

async function bootstrap() {
  const persistence = resolvePersistenceMode();
  if (persistence === "postgres") {
    await ensureCouponSchema(process.env.DATABASE_URL!);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API listening on :${port} (persistence: ${persistence})`);
}

void bootstrap();
