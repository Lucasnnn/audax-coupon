"use client";

import { useSyncExternalStore } from "react";
import {
  couponsStore,
  paginateCoupons,
  type CouponsStoreState,
} from "./coupons-store";

export function useCouponsStore(): CouponsStoreState {
  return useSyncExternalStore(
    couponsStore.subscribe,
    couponsStore.getSnapshot,
    couponsStore.getSnapshot,
  );
}

export function useCouponsPage(page: number, pageSize: number) {
  const { items, total, truncated, loaded, loading, error } = useCouponsStore();
  // Pagination is client-side over the loaded window only.
  const pageData = paginateCoupons(items, page, pageSize);
  return {
    items: pageData.items,
    page: pageData.page,
    pageSize: pageData.pageSize,
    loadedCount: items.length,
    total,
    truncated,
    loaded,
    loading,
    error,
  };
}
