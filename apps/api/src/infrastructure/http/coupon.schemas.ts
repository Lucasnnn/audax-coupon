import {
  COUPON_STATUSES,
  DISCOUNT_TYPES,
  type CreateCouponRequest,
  type UpdateCouponRequest,
} from "@audax/contracts";
import { z } from "zod";

const discountTypeSchema = z.enum(DISCOUNT_TYPES, {
  errorMap: () => ({ message: "Tipo de desconto inválido" }),
});

const couponStatusSchema = z.enum(COUPON_STATUSES, {
  errorMap: () => ({ message: "Status inválido" }),
});

const isoDateTimeSchema = z
  .string({ required_error: "Data de expiração inválida" })
  .datetime({ message: "Data de expiração inválida" });

export const createCouponBodySchema = z.object({
  code: z
    .string({ required_error: "O código do cupom é obrigatório" })
    .min(1, "O código do cupom é obrigatório"),
  discountType: discountTypeSchema,
  discountValue: z
    .number({
      required_error: "O valor do desconto deve ser um número",
      invalid_type_error: "O valor do desconto deve ser um número",
    })
    .int("O valor do desconto deve ser um inteiro")
    .positive("O valor do desconto deve ser positivo"),
  minOrderAmount: z
    .number({
      invalid_type_error: "O valor mínimo do pedido deve ser um número",
    })
    .int("O valor mínimo do pedido deve ser um inteiro")
    .positive("O valor mínimo do pedido deve ser positivo")
    .optional(),
  expiresAt: isoDateTimeSchema.optional(),
}) satisfies z.ZodType<CreateCouponRequest>;

export const updateCouponBodySchema = z
  .object({
    status: couponStatusSchema.optional(),
    discountType: discountTypeSchema.optional(),
    discountValue: z
      .number({
        invalid_type_error: "O valor do desconto deve ser um número",
      })
      .int("O valor do desconto deve ser um inteiro")
      .positive("O valor do desconto deve ser positivo")
      .optional(),
    minOrderAmount: z
      .number({
        invalid_type_error: "O valor mínimo do pedido deve ser um número",
      })
      .int("O valor mínimo do pedido deve ser um inteiro")
      .positive("O valor mínimo do pedido deve ser positivo")
      .optional(),
    expiresAt: isoDateTimeSchema.nullable().optional(),
  })
  .refine(
    (body) =>
      body.status !== undefined ||
      body.discountType !== undefined ||
      body.minOrderAmount !== undefined ||
      body.discountValue !== undefined ||
      body.expiresAt !== undefined,
    { message: "Informe ao menos um campo para atualizar" },
  ) satisfies z.ZodType<UpdateCouponRequest>;

export const listCouponsQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "page inválido" })
    .int("page deve ser inteiro")
    .positive("page deve ser positivo")
    .default(1),
  pageSize: z.coerce
    .number({ invalid_type_error: "pageSize inválido" })
    .int("pageSize deve ser inteiro")
    .positive("pageSize deve ser positivo")
    .max(1000, "pageSize máximo é 1000")
    .default(10),
});

export type CreateCouponBody = z.infer<typeof createCouponBodySchema>;
export type UpdateCouponBody = z.infer<typeof updateCouponBodySchema>;
export type ListCouponsQuery = z.infer<typeof listCouponsQuerySchema>;
