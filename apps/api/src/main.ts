import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./infrastructure/http/app.module.js";
import { ensureCouponSchema } from "./infrastructure/persistence/drizzle/ensure-schema.js";
import { resolvePersistenceMode } from "./infrastructure/persistence/persistence-mode.js";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv({ path: resolve(process.cwd(), ".env") });

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
