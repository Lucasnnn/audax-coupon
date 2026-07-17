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

  it("creates a coupon with an expiration date", async () => {
    const response = await request(app.getHttpServer())
      .post("/coupons")
      .send({
        code: "EXPIRES",
        discountType: "PERCENTAGE",
        discountValue: 10,
        expiresAt: "2026-12-31T23:59:00.000Z",
      })
      .expect(201);

    expect(response.body.expiresAt).toBe("2026-12-31T23:59:00.000Z");
  });

  it("gets a coupon by id", async () => {
    const created = await request(app.getHttpServer())
      .post("/coupons")
      .send({
        code: "FINDME",
        discountType: "PERCENTAGE",
        discountValue: 5,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/coupons/${created.body.id}`)
      .expect(200);

    expect(response.body.code).toBe("FINDME");
  });

  it("lists coupons with pagination", async () => {
    await request(app.getHttpServer())
      .post("/coupons")
      .send({ code: "L1", discountType: "PERCENTAGE", discountValue: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post("/coupons")
      .send({ code: "L2", discountType: "PERCENTAGE", discountValue: 2 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get("/coupons?page=1&pageSize=1")
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBeGreaterThanOrEqual(2);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(1);
  });

  it("updates a coupon status", async () => {
    const created = await request(app.getHttpServer())
      .post("/coupons")
      .send({ code: "UPD", discountType: "PERCENTAGE", discountValue: 10 })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/coupons/${created.body.id}`)
      .send({ status: "INACTIVE" })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/coupons/${created.body.id}`)
      .expect(200);

    expect(response.body.status).toBe("INACTIVE");
    expect(response.body.code).toBe("UPD");
  });

  it("deletes a coupon", async () => {
    const created = await request(app.getHttpServer())
      .post("/coupons")
      .send({ code: "DEL", discountType: "PERCENTAGE", discountValue: 10 })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/coupons/${created.body.id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/coupons/${created.body.id}`)
      .expect(404);
  });

  it("rejects deleting a used coupon", async () => {
    const { COUPON_REPOSITORY } = await import("./tokens.js");
    const { Coupon } = await import("../../domain/coupon/coupon.js");
    const repository = app.get(COUPON_REPOSITORY);

    const used = Coupon.reconstitute({
      id: "22222222-2222-2222-2222-222222222222",
      code: "USEDHTTP",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 1,
      minOrderAmount: undefined,
      expiresAt: undefined,
    });
    await repository.save(used);

    await request(app.getHttpServer())
      .delete(`/coupons/${used.id}`)
      .expect(409);
  });
});
