# Domínio no backend e contrato na borda

Organizamos o Nest em camadas hexagonais dentro de `apps/api` (`domain` → `application` → `infrastructure`). O Next.js é adapter de UI e consome apenas HTTP; não importa o domínio.

A unificação entre pontas no monorepo acontece por `packages/contracts` (DTOs, enums, códigos de erro) e pela linguagem em `CONTEXT.md`, não por compartilhar entidades de domínio. Assim o domínio permanece encapsulado atrás da porta, mudanças de regra + contrato + UI podem ir no mesmo PR, e o frontend não vira segundo dono do modelo.

**Considered options:** packages de domínio compartilhados com o web; camadas só no API + contracts; BFF sem package de contrato.
