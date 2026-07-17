# Domínio no backend e contrato na borda

Organizamos o Nest em camadas hexagonais dentro de `apps/api` (`domain` → `application` → `infrastructure`). O Next.js é adapter de UI e consome apenas HTTP; não importa o domínio.

Invariantes da entidade (ex.: faixa de percentual, FIXED com min order) ficam no `domain`. Políticas de caso de uso (ex.: o que pode mudar ou ser deletado após uso) ficam na `application` — única fonte de verdade para mutabilidade operacional. O frontend espelha essas regras só como validação preventiva antes do request; a API continua rejeitando o que for inválido.

A unificação tipada entre pontas no monorepo acontece por `packages/contracts` (DTOs e enums do contrato HTTP) e pela linguagem em `CONTEXT.md`, não por compartilhar entidades de domínio. A API valida o request com Zod na borda HTTP e mantém mensagens/invariantes de erro no domínio (`CouponErrors`); o web tipa request/response via contracts. Assim o domínio permanece encapsulado atrás da porta e o frontend não vira segundo dono do modelo.

**Considered options:** packages de domínio compartilhados com o web; camadas só no API + contracts; BFF sem package de contrato; regras de mutabilidade no domain vs application; códigos de erro no package de contracts (rejeitado: mensagens de domínio ficam com a entidade/casos de uso).
