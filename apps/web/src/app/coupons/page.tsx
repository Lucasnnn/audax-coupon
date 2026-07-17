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
            Gestão de cupons de desconto.
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

          <label className={styles.discountField}>
            Desconto
            <div className={styles.discountControl}>
              <input
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                placeholder={
                  form.discountType === "PERCENTAGE" ? "10" : "15,00"
                }
                inputMode="decimal"
                required
                aria-label="Valor do desconto"
              />
              <div
                className={styles.discountUnit}
                role="group"
                aria-label="Tipo de desconto"
              >
                <button
                  type="button"
                  className={
                    form.discountType === "PERCENTAGE"
                      ? styles.discountUnitActive
                      : undefined
                  }
                  aria-pressed={form.discountType === "PERCENTAGE"}
                  onClick={() =>
                    setForm({ ...form, discountType: "PERCENTAGE" })
                  }
                >
                  %
                </button>
                <button
                  type="button"
                  className={
                    form.discountType === "FIXED"
                      ? styles.discountUnitActive
                      : undefined
                  }
                  aria-pressed={form.discountType === "FIXED"}
                  onClick={() => setForm({ ...form, discountType: "FIXED" })}
                >
                  R$
                </button>
              </div>
            </div>
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
        <div className={styles.listHeader}>
          <h2>Lista</h2>
          {!loading && total > 0 ? (
            <p className={styles.listCount}>
              {total} {total === 1 ? "cupom" : "cupons"}
            </p>
          ) : null}
        </div>
        {loading ? <p className={styles.muted}>Carregando...</p> : null}
        {!loading && coupons.length === 0 ? (
          <p className={styles.empty}>Nenhum cupom ainda. Crie o primeiro acima.</p>
        ) : null}
        <ul className={styles.list}>
          {coupons.map((coupon) => {
            const expired = isCouponExpired(coupon.expiresAt);
            const inactive = coupon.status === "INACTIVE";

            return (
              <li
                key={coupon.id}
                className={`${styles.item}${inactive ? ` ${styles.itemInactive}` : ""}`}
              >
                <div className={styles.itemTop}>
                  <div className={styles.itemIdentity}>
                    <div className={styles.itemTitleRow}>
                      <strong className={styles.itemCode}>{coupon.code}</strong>
                      {expired ? (
                        <span className={styles.badgeExpired}>Expirado</span>
                      ) : null}
                    </div>
                    <ul className={styles.itemMeta}>
                      <li>
                        {coupon.discountType === "PERCENTAGE"
                          ? `${coupon.discountValue}%`
                          : `R$ ${centsToReais(coupon.discountValue)}`}
                      </li>
                      {coupon.minOrderAmount != null ? (
                        <li>mín. R$ {centsToReais(coupon.minOrderAmount)}</li>
                      ) : null}
                      <li>
                        {coupon.usageCount === 0
                          ? "sem uso"
                          : `${coupon.usageCount} uso${coupon.usageCount === 1 ? "" : "s"}`}
                      </li>
                    </ul>
                  </div>

                  <div className={styles.itemTools}>
                    <label className={styles.toggle}>
                      <span className={styles.toggleLabel}>
                        {coupon.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={coupon.status === "ACTIVE"}
                        aria-label={
                          coupon.status === "ACTIVE"
                            ? "Desativar cupom"
                            : "Ativar cupom"
                        }
                        onChange={() => void toggleStatus(coupon)}
                      />
                      <span className={styles.toggleTrack} aria-hidden="true" />
                    </label>
                    {canDeleteCoupon(coupon.usageCount) ? (
                      <button
                        type="button"
                        className={styles.iconDanger}
                        aria-label="Remover cupom"
                        title="Remover"
                        onClick={() => void removeCoupon(coupon)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className={styles.itemExpiration}>
                  <label className={styles.expirationField}>
                    <span>Expiração</span>
                    <div className={styles.expirationControls}>
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
                      <button
                        type="button"
                        className={styles.saveExpiration}
                        onClick={() => void saveExpiration(coupon)}
                      >
                        Salvar
                      </button>
                    </div>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
