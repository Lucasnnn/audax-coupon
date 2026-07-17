import type { CouponDto } from "@audax/contracts";
import { couponsApi } from "./coupons-api";

export type CouponsStoreState = {
  items: CouponDto[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
};

type Listener = () => void;

let state: CouponsStoreState = {
  items: [],
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

export function sortCouponsByCode(items: CouponDto[]): CouponDto[] {
  return [...items].sort((a, b) => a.code.localeCompare(b.code));
}

export function paginateCoupons(
  items: CouponDto[],
  page: number,
  pageSize: number,
): { items: CouponDto[]; total: number; page: number; pageSize: number } {
  const total = items.length;
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
      const result = await couponsApi.list(1, 1000);
      setState({
        items: sortCouponsByCode(result.items),
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
    setState({
      items: sortCouponsByCode([...state.items, coupon]),
    });
  },

  replace(coupon: CouponDto): void {
    setState({
      items: sortCouponsByCode(
        state.items.map((item) => (item.id === coupon.id ? coupon : item)),
      ),
    });
  },

  remove(id: string): void {
    setState({
      items: state.items.filter((item) => item.id !== id),
    });
  },
};
