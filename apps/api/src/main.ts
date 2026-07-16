import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./infrastructure/http/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  await app.listen(3001);
}

void bootstrap();
