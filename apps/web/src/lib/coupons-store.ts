import type { CouponDto } from "@audax/contracts";
import { couponsApi } from "./coupons-api";

export const CLIENT_LIST_PAGE_SIZE = 1000;

export type CouponsStoreState = {
  items: CouponDto[];
  /** Total reported by the API (may exceed items.length when truncated). */
  total: number;
  /** True when the API has more coupons than CLIENT_LIST_PAGE_SIZE. */
  truncated: boolean;
  loaded: boolean;
  loading: boolean;
  error: string | null;
};

type Listener = () => void;

let state: CouponsStoreState = {
  items: [],
  total: 0,
  truncated: false,
  loaded: false,
  loading: false,
  error: null,
};

const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setState(patch: Partial<CouponsStoreState>): void {
  state = { ...state, ...patch };
  emit();
}

export function sortCouponsByCreatedAtDesc(items: CouponDto[]): CouponDto[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function paginateCoupons(
  items: CouponDto[],
  page: number,
  pageSize: number,
  totalOverride?: number,
): { items: CouponDto[]; total: number; page: number; pageSize: number } {
  const total = totalOverride ?? items.length;
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
  };
}

export const couponsStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): CouponsStoreState {
    return state;
  },

  /** @internal tests */
  _reset(): void {
    state = {
      items: [],
      total: 0,
      truncated: false,
      loaded: false,
      loading: false,
      error: null,
    };
    emit();
  },

  async load(options?: { force?: boolean }): Promise<void> {
    if (state.loading) {
      return;
    }
    if (state.loaded && !options?.force) {
      return;
    }

    setState({ loading: true, error: null });
    try {
      const result = await couponsApi.list(1, CLIENT_LIST_PAGE_SIZE);
      const items = sortCouponsByCreatedAtDesc(result.items);
      setState({
        items,
        total: result.total,
        truncated: result.total > items.length,
        loaded: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        loading: false,
        error:
          err instanceof Error ? err.message : "Falha ao carregar cupons",
      });
    }
  },

  async loadMore(): Promise<void> {
    if (state.loading || !state.truncated) {
      return;
    }

    const nextPage = Math.floor(state.items.length / CLIENT_LIST_PAGE_SIZE) + 1;
    setState({ loading: true, error: null });
    try {
      const result = await couponsApi.list(nextPage, CLIENT_LIST_PAGE_SIZE);
      const seen = new Set(state.items.map((item) => item.id));
      const appended = result.items.filter((item) => !seen.has(item.id));
      const items = sortCouponsByCreatedAtDesc([
        ...state.items,
        ...appended,
      ]);
      setState({
        items,
        total: result.total,
        truncated: result.total > items.length,
        loaded: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        loading: false,
        error:
          err instanceof Error ? err.message : "Falha ao carregar cupons",
      });
    }
  },

  add(coupon: CouponDto): void {
    const items = sortCouponsByCreatedAtDesc([coupon, ...state.items]);
    setState({
      items,
      total: state.total + 1,
      error: null,
      loaded: true,
    });
  },

  replace(coupon: CouponDto): void {
    setState({
      items: sortCouponsByCreatedAtDesc(
        state.items.map((item) => (item.id === coupon.id ? coupon : item)),
      ),
      error: null,
    });
  },

  remove(id: string): void {
    const items = state.items.filter((item) => item.id !== id);
    const removed = items.length < state.items.length;
    setState({
      items,
      total: removed ? Math.max(0, state.total - 1) : state.total,
      error: null,
    });
  },
};
