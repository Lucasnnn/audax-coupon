"use client";

import { useSyncExternalStore } from "react";
import {
  couponsStore,
  paginateCoupons,
  type CouponsStoreState,
} from "./coupons-store";
import {
  filterCoupons,
  type CouponListFilters,
} from "./filter-coupons";

export function useCouponsStore(): CouponsStoreState {
  return useSyncExternalStore(
    couponsStore.subscribe,
    couponsStore.getSnapshot,
    couponsStore.getSnapshot,
  );
}

export function useCouponsPage(
  page: number,
  pageSize: number,
  filters: CouponListFilters,
) {
  const { items, total, truncated, loaded, loading, loadingMore, error } =
    useCouponsStore();
  const filtered = filterCoupons(items, filters);
  const pageData = paginateCoupons(filtered, page, pageSize);
  return {
    items: pageData.items,
    page: pageData.page,
    pageSize: pageData.pageSize,
    loadedCount: filtered.length,
    sourceCount: items.length,
    total,
    truncated,
    loaded,
    loading,
    loadingMore,
    error,
  };
}
