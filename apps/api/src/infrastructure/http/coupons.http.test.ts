import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "./app.module.js";

describe("Coupons HTTP", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates a coupon", async () => {
    const response = await request(app.getHttpServer())
      .post("/coupons")
      .send({
        code: "  http10  ",
        discountType: "PERCENTAGE",
        discountValue: 10,
      })
      .expect(201);

    expect(response.body.code).toBe("HTTP10");
    expect(response.body.discountType).toBe("PERCENTAGE");
    expect(response.body.discountValue).toBe(10);
    expect(response.body.id).toBeTruthy();
  });
});
