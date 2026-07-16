# Ciclo de vida do cupom, mutabilidade e dinheiro em centavos

Este contexto só gerencia cupons (CRUD). Elegibilidade e aplicação do desconto ficam em outra ponta. Status operacional é apenas `ACTIVE` | `INACTIVE`; expiração é regra sobre `Expiration date` (filtro aqui, avaliação lá) — sem status `EXPIRED`, para não duplicar estado derivado.

`Coupon code` é imutável após criação. Políticas pós-uso vivem nos casos de uso (`application`): com `Usage count > 0` o cupom não pode ser deletado; `Discount type` / `Discount value` ficam imutáveis; `Coupon status` e `Expiration date` continuam editáveis. Com `Usage count === 0`, delete e alteração de desconto são permitidos. A escrita do contador pertence à ponta consumidora; este contexto trata o campo como fato para essas políticas.

Valores monetários (`FIXED`, `Minimum order amount`) usam inteiros em centavos. Percentual usa inteiro 1–100. Para `FIXED`, `Minimum order amount` é obrigatório e deve ser ≥ ao valor do desconto.
