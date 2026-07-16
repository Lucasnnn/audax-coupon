"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { CouponDto, DiscountType } from "@audax/contracts";
import { couponsApi } from "@/lib/coupons-api";
import { isCouponExpired } from "@/lib/coupon-expiration";
import styles from "./coupons.module.css";

type FormState = {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  expiresAt: string;
};

const emptyForm: FormState = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  expiresAt: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await couponsApi.list(1, 50);
      setCoupons(page.items);
      setTotal(page.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const discountValue = Number(form.discountValue);
      const minOrderAmount =
        form.minOrderAmount.trim() === ""
          ? undefined
          : Number(form.minOrderAmount);

      if (!form.code.trim()) {
        throw new Error("Coupon code is required");
      }
      if (!Number.isFinite(discountValue)) {
        throw new Error("Discount value must be a number");
      }
      if (
        form.discountType === "FIXED" &&
        (minOrderAmount === undefined || !Number.isFinite(minOrderAmount))
      ) {
        throw new Error("Fixed coupons require a min order amount in cents");
      }

      await couponsApi.create({
        code: form.code,
        discountType: form.discountType,
        discountValue,
        minOrderAmount,
        expiresAt:
          form.expiresAt.trim() === ""
            ? undefined
            : new Date(form.expiresAt).toISOString(),
      });

      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(coupon: CouponDto) {
    setError(null);
    try {
      await couponsApi.update(coupon.id, {
        status: coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update coupon");
    }
  }

  async function removeCoupon(id: string) {
    setError(null);
    try {
      await couponsApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Audax</p>
          <h1>Cupons</h1>
          <p className={styles.subtitle}>
            Gestão de cupons de desconto. Valores monetários em centavos.
          </p>
        </div>
        <p className={styles.meta}>{total} cadastrados</p>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.panel}>
        <h2>Novo cupom</h2>
        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Código
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="BLACKFRIDAY10"
              required
            />
          </label>

          <label>
            Tipo
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountType: e.target.value as DiscountType,
                })
              }
            >
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED">FIXED</option>
            </select>
          </label>

          <label>
            Valor
            <input
              value={form.discountValue}
              onChange={(e) =>
                setForm({ ...form, discountValue: e.target.value })
              }
              placeholder={form.discountType === "PERCENTAGE" ? "10" : "1500"}
              required
            />
          </label>

          <label>
            Min. pedido (centavos)
            <input
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm({ ...form, minOrderAmount: e.target.value })
              }
              placeholder={form.discountType === "FIXED" ? "obrigatório" : "opcional"}
            />
          </label>

          <label>
            Expira em
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) =>
                setForm({ ...form, expiresAt: e.target.value })
              }
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Criar cupom"}
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Lista</h2>
        {loading ? <p className={styles.muted}>Carregando...</p> : null}
        {!loading && coupons.length === 0 ? (
          <p className={styles.muted}>Nenhum cupom ainda.</p>
        ) : null}
        <ul className={styles.list}>
          {coupons.map((coupon) => {
            const expired = isCouponExpired(coupon.expiresAt);

            return (
            <li key={coupon.id} className={styles.item}>
              <div>
                <strong>{coupon.code}</strong>
                <p className={styles.muted}>
                  {coupon.discountType} · {coupon.discountValue}
                  {coupon.minOrderAmount != null
                    ? ` · min ${coupon.minOrderAmount}`
                    : ""}{" "}
                  · usos {coupon.usageCount}
                  {coupon.expiresAt
                    ? ` · expira ${new Date(coupon.expiresAt).toLocaleString("pt-BR")}`
                    : " · sem expiração"}
                </p>
              </div>
              <div className={styles.actions}>
                <span
                  className={
                    coupon.status === "ACTIVE" ? styles.badgeOk : styles.badgeOff
                  }
                >
                  {coupon.status}
                </span>
                {expired ? (
                  <span className={styles.badgeOff}>EXPIRADO</span>
                ) : null}
                <button type="button" onClick={() => void toggleStatus(coupon)}>
                  {coupon.status === "ACTIVE" ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => void removeCoupon(coupon.id)}
                >
                  Remover
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
