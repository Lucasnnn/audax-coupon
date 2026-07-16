# Ciclo de vida do cupom, mutabilidade e dinheiro em centavos

Este contexto só gerencia cupons (CRUD). Elegibilidade e aplicação do desconto ficam em outra ponta. Status operacional é apenas `ACTIVE` | `INACTIVE`; expiração é regra sobre `Expiration date` (filtro aqui, avaliação lá) — sem status `EXPIRED`, para não duplicar estado derivado.

`Coupon code` é imutável após criação. `Discount type` e `Discount value` só podem mudar enquanto `Usage count` for zero; depois ficam imutáveis para nenhum consumidor ver o mesmo código com regras diferentes. A escrita do contador pertence à ponta consumidora; este contexto trata o campo como fato para a regra de mutabilidade.

Valores monetários (`FIXED`, `Minimum order amount`) usam inteiros em centavos. Percentual usa inteiro 1–100. Para `FIXED`, `Minimum order amount` é obrigatório e deve ser ≥ ao valor do desconto.
