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

  it("rejects creating a coupon with expiration before today", async () => {
    const response = await request(app.getHttpServer())
      .post("/coupons")
      .send({
        code: "PASTHTTP",
        discountType: "PERCENTAGE",
        discountValue: 10,
        expiresAt: "2020-01-01T00:00:00.000Z",
      })
      .expect(400);

    expect(response.body.message).toMatch(/expiration date cannot be before today/i);
  });

  it("rejects creating a coupon with an invalid percentage", async () => {
    const response = await request(app.getHttpServer())
      .post("/coupons")
      .send({
        code: "BADPCT",
        discountType: "PERCENTAGE",
        discountValue: 150,
      })
      .expect(400);

    expect(response.body.message).toMatch(/percentage/i);
  });

  it("rejects creating a coupon with a duplicated code", async () => {
    await request(app.getHttpServer())
      .post("/coupons")
      .send({ code: "DUP", discountType: "PERCENTAGE", discountValue: 10 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post("/coupons")
      .send({ code: "dup", discountType: "PERCENTAGE", discountValue: 20 })
      .expect(409);

    expect(response.body.message).toMatch(/unique/i);
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

  it("updates status and expiration of a used coupon", async () => {
    const { COUPON_REPOSITORY } = await import("./tokens.js");
    const { Coupon } = await import("../../domain/coupon/coupon.js");
    const repository = app.get(COUPON_REPOSITORY);

    const used = Coupon.reconstitute({
      id: "33333333-3333-3333-3333-333333333333",
      code: "USEDEXP",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 2,
      minOrderAmount: undefined,
      expiresAt: undefined,
    });
    await repository.save(used);

    const response = await request(app.getHttpServer())
      .patch(`/coupons/${used.id}`)
      .send({
        status: "INACTIVE",
        expiresAt: "2027-06-01T12:00:00.000Z",
      })
      .expect(200);

    expect(response.body.status).toBe("INACTIVE");
    expect(response.body.expiresAt).toBe("2027-06-01T12:00:00.000Z");
  });

  it("rejects discount change on a used coupon", async () => {
    const { COUPON_REPOSITORY } = await import("./tokens.js");
    const { Coupon } = await import("../../domain/coupon/coupon.js");
    const repository = app.get(COUPON_REPOSITORY);

    const used = Coupon.reconstitute({
      id: "44444444-4444-4444-4444-444444444444",
      code: "USEDDISC",
      discountType: "PERCENTAGE",
      discountValue: 10,
      status: "ACTIVE",
      usageCount: 1,
      minOrderAmount: undefined,
      expiresAt: undefined,
    });
    await repository.save(used);

    await request(app.getHttpServer())
      .patch(`/coupons/${used.id}`)
      .send({ discountType: "PERCENTAGE", discountValue: 25 })
      .expect(409);
  });
});
