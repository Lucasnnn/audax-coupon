import { describe, expect, it, beforeEach, vi } from "vitest";
import type { CouponDto } from "@audax/contracts";
import { couponsApi } from "./coupons-api";
import {
  couponsStore,
  paginateCoupons,
  shouldFetchNextCouponBatch,
  sortCouponsByCreatedAtDesc,
} from "./coupons-store";

function coupon(partial: Partial<CouponDto> & Pick<CouponDto, "id" | "code">): CouponDto {
  return {
    discountType: "PERCENTAGE",
    discountValue: 10,
    status: "ACTIVE",
    usageCount: 0,
    minOrderAmount: null,
    expiresAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("coupons store helpers", () => {
  beforeEach(() => {
    couponsStore._reset();
    vi.restoreAllMocks();
  });

  it("sorts coupons by creation date descending", () => {
    const sorted = sortCouponsByCreatedAtDesc([
      coupon({ id: "1", code: "OLD", createdAt: "2026-01-01T00:00:00.000Z" }),
      coupon({ id: "2", code: "NEW", createdAt: "2026-06-01T00:00:00.000Z" }),
    ]);
    expect(sorted.map((item) => item.code)).toEqual(["NEW", "OLD"]);
  });

  it("paginates from in-memory items", () => {
    const items = [
      coupon({ id: "1", code: "A" }),
      coupon({ id: "2", code: "B" }),
      coupon({ id: "3", code: "C" }),
    ];
    expect(paginateCoupons(items, 2, 2).items.map((item) => item.code)).toEqual([
      "C",
    ]);
    expect(paginateCoupons(items, 1, 2).total).toBe(3);
  });

  it("uses API total when list is truncated at page size ceiling", async () => {
    const items = Array.from({ length: 1000 }, (_, index) =>
      coupon({ id: String(index), code: `C${String(index).padStart(4, "0")}` }),
    );
    vi.spyOn(couponsApi, "list").mockResolvedValueOnce({
      items,
      total: 1500,
      page: 1,
      pageSize: 1000,
    });

    await couponsStore.load({ force: true });
    const snap = couponsStore.getSnapshot();
    expect(snap.items).toHaveLength(1000);
    expect(snap.total).toBe(1500);
    expect(snap.truncated).toBe(true);
  });

  it("loadMore appends the next API page into the local cache", async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) =>
      coupon({
        id: `p1-${index}`,
        code: `A${String(index).padStart(4, "0")}`,
        createdAt: "2026-06-01T00:00:00.000Z",
      }),
    );
    const secondPage = Array.from({ length: 500 }, (_, index) =>
      coupon({
        id: `p2-${index}`,
        code: `B${String(index).padStart(4, "0")}`,
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    const list = vi.spyOn(couponsApi, "list");
    list.mockResolvedValueOnce({
      items: firstPage,
      total: 1500,
      page: 1,
      pageSize: 1000,
    });
    list.mockResolvedValueOnce({
      items: secondPage,
      total: 1500,
      page: 2,
      pageSize: 1000,
    });

    await couponsStore.load({ force: true });
    await couponsStore.loadMore();

    const snap = couponsStore.getSnapshot();
    expect(list).toHaveBeenCalledWith(2, 1000);
    expect(snap.items).toHaveLength(1500);
    expect(snap.items[0]?.code).toBe("A0000");
    expect(snap.items[1000]?.code).toBe("B0000");
    expect(snap.total).toBe(1500);
    expect(snap.truncated).toBe(false);
  });

  it("loadMore marks loadingMore without clearing the list loading flag", async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) =>
      coupon({ id: `p1-${index}`, code: `A${String(index).padStart(4, "0")}` }),
    );
    const secondPage = [
      coupon({ id: "p2-0", code: "B0000", createdAt: "2025-01-01T00:00:00.000Z" }),
    ];
    const list = vi.spyOn(couponsApi, "list");
    list.mockResolvedValueOnce({
      items: firstPage,
      total: 1001,
      page: 1,
      pageSize: 1000,
    });
    let resolveSecond!: (value: {
      items: CouponDto[];
      total: number;
      page: number;
      pageSize: number;
    }) => void;
    list.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
    );

    await couponsStore.load({ force: true });
    const pending = couponsStore.loadMore();
    const mid = couponsStore.getSnapshot();
    expect(mid.loading).toBe(false);
    expect(mid.loadingMore).toBe(true);
    expect(mid.items).toHaveLength(1000);

    resolveSecond({
      items: secondPage,
      total: 1001,
      page: 2,
      pageSize: 1000,
    });
    await pending;
    expect(couponsStore.getSnapshot().loadingMore).toBe(false);
  });

  it("shouldFetchNextCouponBatch when on last page while truncated", () => {
    expect(
      shouldFetchNextCouponBatch({
        truncated: true,
        loadingMore: false,
        sourceCount: 1000,
        page: 100,
        totalPages: 100,
      }),
    ).toBe(true);
    expect(
      shouldFetchNextCouponBatch({
        truncated: true,
        loadingMore: false,
        sourceCount: 1000,
        page: 99,
        totalPages: 100,
      }),
    ).toBe(false);
    expect(
      shouldFetchNextCouponBatch({
        truncated: true,
        loadingMore: true,
        sourceCount: 1000,
        page: 100,
        totalPages: 100,
      }),
    ).toBe(false);
    expect(
      shouldFetchNextCouponBatch({
        truncated: false,
        loadingMore: false,
        sourceCount: 1000,
        page: 100,
        totalPages: 100,
      }),
    ).toBe(false);
  });

  it("keeps newest coupon at the top on add", () => {
    couponsStore.add(
      coupon({ id: "1", code: "OLD", createdAt: "2026-01-01T00:00:00.000Z" }),
    );
    couponsStore.add(
      coupon({ id: "2", code: "NEW", createdAt: "2026-06-01T00:00:00.000Z" }),
    );
    expect(couponsStore.getSnapshot().items.map((item) => item.code)).toEqual([
      "NEW",
      "OLD",
    ]);
  });

  it("updates local state on add replace and remove", () => {
    couponsStore.add(coupon({ id: "1", code: "KEEP" }));
    couponsStore.add(coupon({ id: "2", code: "GONE" }));
    expect(couponsStore.getSnapshot().items).toHaveLength(2);

    couponsStore.replace(
      coupon({ id: "1", code: "KEEP", status: "INACTIVE" }),
    );
    expect(
      couponsStore.getSnapshot().items.find((item) => item.id === "1")?.status,
    ).toBe("INACTIVE");

    couponsStore.remove("2");
    expect(couponsStore.getSnapshot().items.map((item) => item.id)).toEqual([
      "1",
    ]);
  });

  it("clears load error when a local mutation succeeds", async () => {
    vi.spyOn(couponsApi, "list").mockRejectedValueOnce(new Error("offline"));
    await couponsStore.load({ force: true });
    expect(couponsStore.getSnapshot().error).toBe("offline");

    couponsStore.add(coupon({ id: "1", code: "NEW" }));
    expect(couponsStore.getSnapshot().error).toBeNull();

    vi.spyOn(couponsApi, "list").mockRejectedValueOnce(new Error("offline again"));
    await couponsStore.load({ force: true });
    expect(couponsStore.getSnapshot().error).toBe("offline again");

    couponsStore.replace(coupon({ id: "1", code: "NEW", status: "INACTIVE" }));
    expect(couponsStore.getSnapshot().error).toBeNull();

    vi.spyOn(couponsApi, "list").mockRejectedValueOnce(new Error("offline yet"));
    await couponsStore.load({ force: true });
    couponsStore.remove("1");
    expect(couponsStore.getSnapshot().error).toBeNull();
  });
});
