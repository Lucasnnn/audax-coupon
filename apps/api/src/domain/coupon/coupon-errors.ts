export const CouponErrors = {
  notFound: "Cupom não encontrado",
  codeEmpty: "O código do cupom não pode ser vazio",
  codeUnique: "O código do cupom deve ser único",
  invalidUsageCount: "A contagem de uso deve ser um inteiro não negativo",
  invalidStatus: "Status do cupom inválido",
  percentageRange: "O valor percentual deve ser um inteiro entre 1 e 100",
  fixedRequiresMin: "Desconto fixo exige um valor mínimo de pedido",
  fixedPositive:
    "O valor do desconto fixo deve ser um inteiro estritamente positivo",
  minOrderTooLow:
    "O valor mínimo do pedido deve ser maior ou igual ao valor do desconto fixo",
  expirationBeforeToday: "A data de expiração não pode ser anterior a hoje",
  expirationNotInFuture: "A data de expiração deve ser um instante futuro",
  usedCannotDelete: "Cupons já utilizados não podem ser excluídos",
  usedCannotChangeDiscount:
    "Tipo e valor do desconto não podem ser alterados após o uso do cupom",
  incompleteDiscountPatch:
    "Para alterar o desconto, informe discountType e discountValue juntos",
  expiredCannotChangeExpiration:
    "A data de expiração de um cupom já expirado não pode ser alterada",
} as const;
