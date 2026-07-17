"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CouponDto, DiscountType } from "@audax/contracts";
import { couponsApi } from "@/lib/coupons-api";
import { couponsStore } from "@/lib/coupons-store";
import { useCouponsPage } from "@/lib/use-coupons-store";
import { isCouponExpired } from "@/lib/coupon-expiration";
import { canChangeExpiration, canDeleteCoupon } from "@/lib/coupon-ops";
import {
  formatExpirationDisplay,
  minDatetimeLocalToday,
  toDatetimeLocalValue,
} from "@/lib/datetime-local";
import { isExpirationNotBeforeToday } from "@/lib/expiration-guard";
import {
  centsToReais,
  formatReaisInput,
  MAX_REAIS_INPUT_CENTS,
} from "@/lib/money";
import {
  sanitizePositiveDecimalInput,
  sanitizePositiveIntegerInput,
} from "@/lib/numeric-input";
import { validateCreateCouponForm } from "@/lib/validate-create-coupon-form";
import {
  defaultCouponListFilters,
  type CouponListFilters,
  type ExpirationFilter,
  type StatusFilter,
} from "@/lib/filter-coupons";
import styles from "./coupons.module.css";

const PAGE_SIZE = 10;
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
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [minOrderLimitWarning, setMinOrderLimitWarning] = useState(false);
  const [expirationDrafts, setExpirationDrafts] = useState<
    Record<string, string>
  >({});
  const [couponPendingDelete, setCouponPendingDelete] =
    useState<CouponDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [filters, setFilters] = useState<CouponListFilters>(
    defaultCouponListFilters,
  );
  const [filterDraft, setFilterDraft] = useState<CouponListFilters>(
    defaultCouponListFilters,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listSectionRef = useRef<HTMLElement>(null);
  const skipListScrollRef = useRef(true);

  const {
    items: coupons,
    total,
    loadedCount,
    sourceCount,
    truncated,
    loading,
    error: loadError,
  } = useCouponsPage(page, PAGE_SIZE, filters);

  const totalPages = Math.max(1, Math.ceil(loadedCount / PAGE_SIZE));
  const error = actionError ?? loadError;
  const busy = loading || submitting || deleting || mutating;
  const filtersActive =
    filters.status !== "ALL" ||
    filters.expiration !== "ALL" ||
    filters.codeQuery.trim() !== "";

  useEffect(() => {
    void couponsStore.load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.expiration, filters.codeQuery]);

  useEffect(() => {
    if (loadedCount > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, loadedCount, totalPages]);

  useEffect(() => {
    if (skipListScrollRef.current) {
      skipListScrollRef.current = false;
      return;
    }
    listSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const validated = validateCreateCouponForm(form);

      if (
        form.expiresAt.trim() !== "" &&
        !isExpirationNotBeforeToday(form.expiresAt)
      ) {
        throw new Error("A data de expiração não pode ser anterior a hoje");
      }

      const created = await couponsApi.create({
        ...validated,
        expiresAt:
          form.expiresAt.trim() === ""
            ? undefined
            : new Date(form.expiresAt).toISOString(),
      });

      couponsStore.add(created);
      setForm(emptyForm);
      setMinOrderLimitWarning(false);
      setPage(1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Falha ao criar cupom");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(coupon: CouponDto) {
    setActionError(null);
    setMutating(true);
    try {
      const updated = await couponsApi.update(coupon.id, {
        status: coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      couponsStore.replace(updated);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Falha ao atualizar cupom",
      );
    } finally {
      setMutating(false);
    }
  }

  async function removeCoupon(coupon: CouponDto) {
    setActionError(null);
    if (!canDeleteCoupon(coupon.usageCount)) {
      return;
    }
    setDeleting(true);
    try {
      await couponsApi.remove(coupon.id);
      couponsStore.remove(coupon.id);
      setCouponPendingDelete(null);
      if (coupons.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Falha ao excluir cupom",
      );
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
    setActionError(null);
    setMutating(true);
    try {
      if (!canChangeExpiration(coupon.expiresAt)) {
        throw new Error(
          "A data de expiração de um cupom já expirado não pode ser alterada",
        );
      }
      const draft = expirationDraft(coupon).trim();
      if (draft !== "" && !isExpirationNotBeforeToday(draft)) {
        throw new Error("A data de expiração não pode ser anterior a hoje");
      }
      const updated = await couponsApi.update(coupon.id, {
        expiresAt: draft === "" ? null : new Date(draft).toISOString(),
      });
      couponsStore.replace(updated);
      setExpirationDrafts((current) => {
        const next = { ...current };
        delete next[coupon.id];
        return next;
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Falha ao atualizar expiração",
      );
    } finally {
      setMutating(false);
    }
  }

  return (
    <main className={styles.page} aria-busy={busy}>
      {busy ? (
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-label="Carregando"
          aria-valuetext="Em andamento"
        >
          <span className={styles.progressBarIndicator} />
        </div>
      ) : null}
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
      {truncated ? (
        <div className={styles.error} role="status">
          Exibindo os primeiros {loadedCount} de {total} cupons. A listagem
          local está limitada a 1000 itens.
        </div>
      ) : null}

      <section className={styles.panel}>
        <h2>Novo cupom</h2>
        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            <span className={styles.fieldLabel}>
              Código <span className={styles.requiredMark} aria-hidden="true">*</span>
            </span>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="BLACKFRIDAY10"
              required
              aria-required="true"
            />
          </label>

          <label className={styles.discountField}>
            <span className={styles.fieldLabel}>
              Desconto <span className={styles.requiredMark} aria-hidden="true">*</span>
            </span>
            <div className={styles.discountControl}>
              <input
                value={form.discountValue}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountValue:
                      form.discountType === "PERCENTAGE"
                        ? sanitizePositiveIntegerInput(e.target.value)
                        : sanitizePositiveDecimalInput(e.target.value),
                  })
                }
                placeholder={
                  form.discountType === "PERCENTAGE" ? "10" : "15,00"
                }
                inputMode={
                  form.discountType === "PERCENTAGE" ? "numeric" : "decimal"
                }
                required
                aria-required="true"
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

          <label
            className={`${styles.minOrderField}${minOrderLimitWarning ? ` ${styles.minOrderFieldWarn}` : ""}`}
          >
            <span className={styles.fieldLabel}>
              Pedido mínimo (R$)
              {form.discountType === "FIXED" ? (
                <span className={styles.requiredMark} aria-hidden="true"> *</span>
              ) : (
                <span className={styles.optionalMark}> (opcional)</span>
              )}
            </span>
            <input
              value={form.minOrderAmount}
              onChange={(e) => {
                const formatted = formatReaisInput(e.target.value);
                setMinOrderLimitWarning(formatted.exceededMax);
                setForm({
                  ...form,
                  minOrderAmount: formatted.value,
                });
              }}
              placeholder="0,00"
              inputMode="numeric"
              required={form.discountType === "FIXED"}
              aria-required={form.discountType === "FIXED"}
              aria-describedby={
                minOrderLimitWarning ? "min-order-limit-warning" : undefined
              }
            />
            {minOrderLimitWarning ? (
              <p
                id="min-order-limit-warning"
                className={styles.fieldWarning}
                role="status"
              >
                Esse valor não pode ultrapassar R${" "}
                {centsToReais(MAX_REAIS_INPUT_CENTS)}
              </p>
            ) : null}
          </label>

          <label>
            <span className={styles.fieldLabel}>
              Expira em
              <span className={styles.optionalMark}> (opcional)</span>
            </span>
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
            {submitting ? (
              <span className={styles.buttonBusy}>
                <span className={styles.spinner} aria-hidden="true" />
                Salvando…
              </span>
            ) : (
              "Criar cupom"
            )}
          </button>
        </form>
      </section>

      <section className={styles.panel} ref={listSectionRef}>
        <div className={styles.listHeader}>
          <div className={styles.listTitleRow}>
            <h2>Lista</h2>
            <button
              type="button"
              className={`${styles.filterIconButton}${filtersActive ? ` ${styles.filterIconButtonActive}` : ""}`}
              aria-label={
                filtersActive ? "Abrir filtros (ativos)" : "Abrir filtros"
              }
              title="Filtros"
              onClick={() => {
                setFilterDraft(filters);
                setFiltersOpen(true);
              }}
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
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
              {filtersActive ? (
                <span className={styles.filterBadge} aria-hidden="true" />
              ) : null}
            </button>
          </div>
          {!loading && sourceCount > 0 ? (
            <p className={styles.listCount}>
              Página {page} de {totalPages} ·{" "}
              {filtersActive ? (
                <>
                  {loadedCount}{" "}
                  {loadedCount === 1 ? "filtrado" : "filtrados"} · {sourceCount}{" "}
                  carregados
                </>
              ) : (
                <>
                  {total} {total === 1 ? "cupom" : "cupons"}
                  {truncated ? ` (carregados ${loadedCount})` : ""}
                </>
              )}
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className={styles.loadingState} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <span>Carregando cupons…</span>
          </div>
        ) : null}
        {!loading && sourceCount === 0 ? (
          <p className={styles.empty}>Nenhum cupom ainda. Crie o primeiro acima.</p>
        ) : null}
        {!loading && sourceCount > 0 && coupons.length === 0 ? (
          <p className={styles.empty}>
            Nenhum cupom corresponde aos filtros.
          </p>
        ) : null}
        <ul className={styles.list}>
          {coupons.map((coupon) => {
            const expired = isCouponExpired(coupon.expiresAt);
            const inactive = coupon.status === "INACTIVE";
            const expirationEditable = canChangeExpiration(coupon.expiresAt);

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
                  </div>
                </div>

                <div className={styles.itemExpiration}>
                  <label className={styles.expirationField}>
                    <span>Expiração</span>
                    {expirationEditable ? (
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
                          disabled={
                            expirationDraft(coupon) ===
                            toDatetimeLocalValue(coupon.expiresAt)
                          }
                          onClick={() => void saveExpiration(coupon)}
                        >
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <p className={styles.expirationLocked}>
                        {formatExpirationDisplay(coupon.expiresAt) || "—"}
                        <span>Expirado — data bloqueada</span>
                      </p>
                    )}
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
        {!loading && loadedCount > PAGE_SIZE ? (
          <nav className={styles.pagination} aria-label="Paginação da lista">
            <button
              type="button"
              className={styles.pageButton}
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </button>
            <p className={styles.pageStatus}>
              {page} / {totalPages}
            </p>
            <button
              type="button"
              className={styles.pageButton}
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Próxima
            </button>
          </nav>
        ) : null}
      </section>
      {filtersOpen ? (
        <div
          className={styles.dialogBackdrop}
          role="presentation"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="filters-title">Filtros</h3>
            <div className={styles.filterModalFields} role="search">
              <label className={styles.filterField}>
                <span>Código</span>
                <input
                  value={filterDraft.codeQuery}
                  onChange={(e) =>
                    setFilterDraft((current) => ({
                      ...current,
                      codeQuery: e.target.value,
                    }))
                  }
                  placeholder="Buscar código"
                  aria-label="Filtrar por código do cupom"
                  autoFocus
                />
              </label>
              <label className={styles.filterField}>
                <span>Status</span>
                <select
                  value={filterDraft.status}
                  onChange={(e) =>
                    setFilterDraft((current) => ({
                      ...current,
                      status: e.target.value as StatusFilter,
                    }))
                  }
                  aria-label="Filtrar por status"
                >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Ativos</option>
                  <option value="INACTIVE">Inativos</option>
                </select>
              </label>
              <label className={styles.filterField}>
                <span>Expiração</span>
                <select
                  value={filterDraft.expiration}
                  onChange={(e) =>
                    setFilterDraft((current) => ({
                      ...current,
                      expiration: e.target.value as ExpirationFilter,
                    }))
                  }
                  aria-label="Filtrar por expiração"
                >
                  <option value="ALL">Todas</option>
                  <option value="EXPIRED">Expirados</option>
                  <option value="NO_EXPIRATION">Sem data</option>
                </select>
              </label>
            </div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancel}
                onClick={() => {
                  setFilterDraft(defaultCouponListFilters);
                  setFilters(defaultCouponListFilters);
                  setFiltersOpen(false);
                }}
              >
                Limpar
              </button>
              <button
                type="button"
                className={styles.dialogPrimary}
                onClick={() => {
                  setFilters(filterDraft);
                  setFiltersOpen(false);
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
            {canDeleteCoupon(couponPendingDelete.usageCount) ? (
              <>
                <h3 id="delete-coupon-title">Excluir cupom?</h3>
                <p id="delete-coupon-desc">
                  Tem certeza que deseja excluir o cupom{" "}
                  <strong>{couponPendingDelete.code}</strong>? Essa ação não
                  pode ser desfeita.
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
                    {deleting ? (
                      <span className={styles.buttonBusy}>
                        <span className={styles.spinner} aria-hidden="true" />
                        Excluindo…
                      </span>
                    ) : (
                      "Excluir"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 id="delete-coupon-title">Exclusão não permitida</h3>
                <p id="delete-coupon-desc">
                  O cupom <strong>{couponPendingDelete.code}</strong> não pode
                  ser excluído porque já possui{" "}
                  {couponPendingDelete.usageCount}{" "}
                  {couponPendingDelete.usageCount === 1 ? "uso" : "usos"}.
                </p>
                <div className={styles.dialogActions}>
                  <button
                    type="button"
                    className={styles.dialogCancel}
                    onClick={() => setCouponPendingDelete(null)}
                  >
                    Entendi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
