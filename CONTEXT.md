# Coupon Management

Contexto responsável por definir e gerenciar cupons de desconto (cadastro e ciclo de vida operacional). A avaliação de elegibilidade e a aplicação do desconto em um pedido pertencem a outra ponta consumidora.

## Language

**Coupon**:
A definição gerenciável de uma regra de desconto: código, tipo e valor, restrições de política (como valor mínimo) e ciclo de vida operacional. Sua identidade estável é um ID técnico; o código é chave de negócio única, não a identidade.
_Avoid_: Voucher, promo code (como sinônimo da entidade), Deal

**Coupon code**:
Identificador legível e único de negócio (ex.: `BLACKFRIDAY10`). Normalizado (trim + maiúsculas). Não é a identidade técnica do cupom e é imutável após a criação — assim consumidores externos não veem o mesmo código com significados diferentes.
_Avoid_: SKU, slug, name (como se fossem o código)

**Discount type**:
Como o desconto é expresso: percentual (`PERCENTAGE`) ou valor fixo (`FIXED`). Cada tipo tem invariantes próprios de valor.
_Avoid_: Kind, mode, strategy (como sinônimo deste conceito)

**Discount value**:
A magnitude do desconto interpretada conforme o Discount type: em `PERCENTAGE`, inteiro de 1 a 100 (pontos percentuais); em `FIXED`, valor monetário em centavos (inteiro estritamente positivo).
_Avoid_: Amount, price, rate (sem qualificar o tipo); float para dinheiro

**Coupon status**:
Estado operacional controlado pelo operador: `ACTIVE` (disponível para consumo por outras pontas) ou `INACTIVE` (desligado). Expiração por data não é um status.
_Avoid_: EXPIRED (como status), Enabled, Disabled, Published

**Expiration date**:
Instante opcional a partir do qual o cupom deixa de ser considerado válido. Na gestão, ao definir ou alterar a Expiration date, ela não pode ser anterior ao dia corrente (política na application; a UI valida preventivamente). Na listagem de gestão, a mesma regra (“já passou da Expiration date?”) marca o cupom como expirado na UI; a outra ponta reutiliza a noção ao avaliar elegibilidade.
_Avoid_: Expiry status, Validity flag

**Minimum order amount**:
Valor mínimo de pedido exigido pela política do cupom, em centavos. Obrigatório quando o Discount type é `FIXED`, e nesse caso deve ser maior ou igual ao Discount value (também em centavos); opcional quando o tipo é `PERCENTAGE`.
_Avoid_: Threshold, floor (como termos canônicos); float para dinheiro

**Money (centavos)**:
Representação de valores monetários como inteiro em centavos (ex.: `1500` = R$ 15,00). Usada em Discount value quando `FIXED` e em Minimum order amount no contrato/API. Moeda implícita: BRL neste escopo. Na UI de gestão, esses valores são capturados e exibidos em reais e convertidos para centavos na borda HTTP.
_Avoid_: float/double para dinheiro; Decimal como tipo de domínio neste entregável

**Usage count**:
Quantidade de vezes que o cupom já foi utilizado com sucesso. Neste contexto de gestão, o campo é somente leitura e alimenta políticas de mutabilidade na camada de application: enquanto for zero, o cupom pode ser deletado e `Discount type` / `Discount value` podem ser alterados; após o primeiro uso, o cupom não pode mais ser deletado e só `Coupon status` e `Expiration date` permanecem editáveis. A escrita do contador pertence à ponta consumidora (registro de uso), não ao fluxo de gestão deste contexto.
_Avoid_: Hits, redemptions count (como termo canônico)
