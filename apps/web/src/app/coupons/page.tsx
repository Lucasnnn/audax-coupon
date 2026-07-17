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
  const [couponPendingDelete, setCouponPendingDelete] =
    useState<CouponDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await couponsApi.list(1, 50);
      setCoupons(page.items);
      setTotal(page.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar cupons");
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
        throw new Error("O código do cupom é obrigatório");
      }
      if (
        form.discountType === "PERCENTAGE" &&
        !Number.isFinite(discountValue)
      ) {
        throw new Error("O valor do desconto deve ser um número");
      }
      if (
        form.discountType === "FIXED" &&
        (minOrderAmount === undefined || !Number.isFinite(minOrderAmount))
      ) {
        throw new Error("Desconto fixo exige um valor mínimo de pedido");
      }
      if (
        form.expiresAt.trim() !== "" &&
        !isExpirationNotBeforeToday(form.expiresAt)
      ) {
        throw new Error("A data de expiração não pode ser anterior a hoje");
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
      setError(err instanceof Error ? err.message : "Falha ao criar cupom");
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
      setError(err instanceof Error ? err.message : "Falha ao atualizar cupom");
    }
  }

  async function removeCoupon(coupon: CouponDto) {
    setError(null);
    if (!canDeleteCoupon(coupon.usageCount)) {
      setError("Cupons já utilizados não podem ser excluídos");
      setCouponPendingDelete(null);
      return;
    }
    setDeleting(true);
    try {
      await couponsApi.remove(coupon.id);
      setCouponPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir cupom");
    } finally {
      setDeleting(false);
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
        throw new Error("A data de expiração não pode ser anterior a hoje");
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
        err instanceof Error ? err.message : "Falha ao atualizar expiração",
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
              <select
                className={styles.discountUnitSelect}
                value={form.discountType}
                aria-label="Tipo de desconto"
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountType: e.target.value as DiscountType,
                  })
                }
              >
                <option value="PERCENTAGE">%</option>
                <option value="FIXED">R$</option>
              </select>
            </div>
          </label>

          <label>
            Pedido mínimo (R$)
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
                        onClick={() => setCouponPendingDelete(coupon)}
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

      {couponPendingDelete ? (
        <div
          className={styles.dialogBackdrop}
          role="presentation"
          onClick={() => {
            if (!deleting) {
              setCouponPendingDelete(null);
            }
          }}
        >
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-coupon-title"
            aria-describedby="delete-coupon-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="delete-coupon-title">Excluir cupom?</h3>
            <p id="delete-coupon-desc">
              Tem certeza que deseja excluir o cupom{" "}
              <strong>{couponPendingDelete.code}</strong>? Essa ação não pode
              ser desfeita.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancel}
                disabled={deleting}
                onClick={() => setCouponPendingDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.dialogConfirm}
                disabled={deleting}
                onClick={() => void removeCoupon(couponPendingDelete)}
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
