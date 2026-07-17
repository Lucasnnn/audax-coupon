import type {
  CouponDto,
  CreateCouponRequest,
  PaginatedCoupons,
  UpdateCouponRequest,
} from "@audax/contracts";
import { parseApiErrorMessage } from "./parse-api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      parseApiErrorMessage(text) || `Falha na requisição (${response.status})`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const couponsApi = {
  list(page = 1, pageSize = 10) {
    return request<PaginatedCoupons>(`/coupons?page=${page}&pageSize=${pageSize}`);
  },
  get(id: string) {
    return request<CouponDto>(`/coupons/${id}`);
  },
  create(body: CreateCouponRequest) {
    return request<CouponDto>("/coupons", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: UpdateCouponRequest) {
    return request<CouponDto>(`/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return request<void>(`/coupons/${id}`, { method: "DELETE" });
  },
};
