# Ciclo de vida do cupom, mutabilidade e dinheiro em centavos

Este contexto só gerencia cupons (CRUD). Elegibilidade e aplicação do desconto ficam em outra ponta. Status operacional é apenas `ACTIVE` | `INACTIVE`; expiração é regra sobre `Expiration date` (indicação na listagem de gestão; avaliação de elegibilidade na outra ponta) — sem status `EXPIRED`, para não duplicar estado derivado.

`Coupon code` é imutável após criação. Políticas pós-uso vivem nos casos de uso (`application`): com `Usage count > 0` o cupom não pode ser deletado; `Discount type` / `Discount value` ficam imutáveis; `Coupon status` e `Expiration date` continuam editáveis. Com `Usage count === 0`, delete e alteração de desconto são permitidos. Ao definir ou alterar `Expiration date`, ela não pode ser anterior ao dia corrente em UTC **nem um instante já passado** (API e UI usam a mesma regra). A escrita do contador pertence à ponta consumidora; este contexto trata o campo como fato para essas políticas.

Valores monetários (`FIXED`, `Minimum order amount`) usam inteiros em centavos — `Discount value` em `FIXED` é estritamente positivo. Percentual usa inteiro 1–100. Para `FIXED`, `Minimum order amount` é obrigatório e deve ser ≥ ao valor do desconto.
