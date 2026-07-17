import type { DiscountType } from "@audax/contracts";
import { reaisToCents } from "./money";

export type CreateCouponFormInput = {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  expiresAt: string;
};

export type ValidatedCreateCoupon = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
};

export function validateCreateCouponForm(
  form: CreateCouponFormInput,
): ValidatedCreateCoupon {
  const code = form.code.trim();
  if (!code) {
    throw new Error("O código do cupom é obrigatório");
  }

  if (form.discountType === "PERCENTAGE") {
    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue)) {
      throw new Error("O valor do desconto deve ser um número");
    }
    if (
      !Number.isInteger(discountValue) ||
      discountValue < 1 ||
      discountValue > 100
    ) {
      throw new Error("O valor percentual deve ser um inteiro entre 1 e 100");
    }

    return {
      code,
      discountType: "PERCENTAGE",
      discountValue,
      minOrderAmount:
        form.minOrderAmount.trim() === ""
          ? undefined
          : reaisToCents(form.minOrderAmount),
    };
  }

  const discountValue = reaisToCents(form.discountValue);
  if (discountValue <= 0) {
    throw new Error(
      "O valor do desconto fixo deve ser um inteiro estritamente positivo",
    );
  }

  if (form.minOrderAmount.trim() === "") {
    throw new Error("Desconto fixo exige um valor mínimo de pedido");
  }

  const minOrderAmount = reaisToCents(form.minOrderAmount);
  if (minOrderAmount < discountValue) {
    throw new Error(
      "O valor mínimo do pedido deve ser maior ou igual ao valor do desconto fixo",
    );
  }

  return {
    code,
    discountType: "FIXED",
    discountValue,
    minOrderAmount,
  };
}
