# Teto monetário alinhado a INTEGER (sem bigint por enquanto)

Valores monetários (`FIXED`, `Minimum order amount`) ficam em **centavos como inteiro** e cabem em `INTEGER` do Postgres (`≤ 2_147_483_647` centavos). Na UI o teto de digitação é um pouco mais baixo e redondo: **R$ 21.474.836,00** (`2_147_483_600` centavos), com validação no domínio e aviso no formulário. Isso evita overflow no banco e mantém o modelo simples (`number` / `integer` de ponta a ponta).

**Considered options:** (1) `BIGINT` / string / decimal no schema desde já — rejeitado como overengineering: o teto em reais já é alto para cupons de desconto neste escopo. (2) Lib de precisão arbitrária no domínio — adiada; só faria sentido se o negócio precisar de pedidos ou descontos acima desse limite. (3) Teto explícito + `INTEGER` — escolhido.

**Consequences:** se no futuro o negócio exigir valores maiores, a expansão seria uma mudança deliberada (tipo numérico maior no Postgres + lib adequada no domínio/bordas), não uma “correção” do teto atual. Até lá, rejeitar acima do limite é a política correta.
