"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { CouponDto, DiscountType } from "@audax/contracts";
import { couponsApi } from "@/lib/coupons-api";
import { isCouponExpired } from "@/lib/coupon-expiration";
import { canDeleteCoupon } from "@/lib/coupon-ops";
import { minDatetimeLocalToday, toDatetimeLocalValue } from "@/lib/datetime-local";
import { isExpirationNotBeforeToday } from "@/lib/expiration-guard";
import { centsToReais, reaisToCents } from "@/lib/money";
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
  const [expirationDrafts, setExpirationDrafts] = useState<
    Record<string, string>
  >({});

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
      const discountValue =
        form.discountType === "FIXED"
          ? reaisToCents(form.discountValue)
          : Number(form.discountValue);
      const minOrderAmount =
        form.minOrderAmount.trim() === ""
          ? undefined
          : reaisToCents(form.minOrderAmount);

      if (!form.code.trim()) {
        throw new Error("Coupon code is required");
      }
      if (
        form.discountType === "PERCENTAGE" &&
        !Number.isFinite(discountValue)
      ) {
        throw new Error("Discount value must be a number");
      }
      if (
        form.discountType === "FIXED" &&
        (minOrderAmount === undefined || !Number.isFinite(minOrderAmount))
      ) {
        throw new Error("Fixed coupons require a min order amount in reais");
      }
      if (
        form.expiresAt.trim() !== "" &&
        !isExpirationNotBeforeToday(form.expiresAt)
      ) {
        throw new Error("Expiration date cannot be before today");
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

  async function removeCoupon(coupon: CouponDto) {
    setError(null);
    if (!canDeleteCoupon(coupon.usageCount)) {
      setError("Cupons já utilizados não podem ser removidos");
      return;
    }
    try {
      await couponsApi.remove(coupon.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  }

  function expirationDraft(coupon: CouponDto): string {
    return (
      expirationDrafts[coupon.id] ?? toDatetimeLocalValue(coupon.expiresAt)
    );
  }

  async function saveExpiration(coupon: CouponDto) {
    setError(null);
    try {
      const draft = expirationDraft(coupon).trim();
      if (draft !== "" && !isExpirationNotBeforeToday(draft)) {
        throw new Error("Expiration date cannot be before today");
      }
      await couponsApi.update(coupon.id, {
        expiresAt: draft === "" ? null : new Date(draft).toISOString(),
      });
      setExpirationDrafts((current) => {
        const next = { ...current };
        delete next[coupon.id];
        return next;
      });
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update expiration",
      );
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Audax</p>
          <h1>Cupons</h1>
          <p className={styles.subtitle}>
            Gestão de cupons de desconto. Valores monetários em reais; a API
            recebe centavos.
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
            {form.discountType === "FIXED" ? " (R$)" : " (%)"}
            <input
              value={form.discountValue}
              onChange={(e) =>
                setForm({ ...form, discountValue: e.target.value })
              }
              placeholder={
                form.discountType === "PERCENTAGE" ? "10" : "15,00"
              }
              required
            />
          </label>

          <label>
            Min. pedido (R$)
            <input
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm({ ...form, minOrderAmount: e.target.value })
              }
              placeholder={
                form.discountType === "FIXED" ? "obrigatório, ex.: 50,00" : "opcional"
              }
            />
          </label>

          <label>
            Expira em
            <input
              type="datetime-local"
              min={minDatetimeLocalToday()}
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
                  {coupon.discountType === "PERCENTAGE"
                    ? `${coupon.discountValue}%`
                    : `R$ ${centsToReais(coupon.discountValue)}`}
                  {coupon.minOrderAmount != null
                    ? ` · min R$ ${centsToReais(coupon.minOrderAmount)}`
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
                <label className={styles.inlineField}>
                  Expira em
                  <input
                    type="datetime-local"
                    min={minDatetimeLocalToday()}
                    value={expirationDraft(coupon)}
                    onChange={(e) =>
                      setExpirationDrafts((current) => ({
                        ...current,
                        [coupon.id]: e.target.value,
                      }))
                    }
                  />
                </label>
                <button type="button" onClick={() => void saveExpiration(coupon)}>
                  Salvar expiração
                </button>
                <button type="button" onClick={() => void toggleStatus(coupon)}>
                  {coupon.status === "ACTIVE" ? "Desativar" : "Ativar"}
                </button>
                {canDeleteCoupon(coupon.usageCount) ? (
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => void removeCoupon(coupon)}
                  >
                    Remover
                  </button>
                ) : (
                  <span className={styles.muted}>Usado — sem remoção</span>
                )}
              </div>
            </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
