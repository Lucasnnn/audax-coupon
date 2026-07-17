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
  const { items, loaded, loading, error } = useCouponsStore();
  const pageData = paginateCoupons(items, page, pageSize);
  return {
    ...pageData,
    loaded,
    loading,
    error,
  };
}
