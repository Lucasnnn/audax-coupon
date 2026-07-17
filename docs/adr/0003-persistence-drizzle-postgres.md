# Postgres com Drizzle e repositório in-memory nos testes

A porta de repositório vive no domínio. Casos de uso e testes HTTP usam o adapter in-memory (sem banco). Em runtime, com `DATABASE_URL` (e sem `PERSISTENCE=memory`), a API usa Postgres via Drizzle; `pnpm dev:memory` / ausência de URL forçam in-memory. O domínio permanece trocável de persistência.

Drizzle foi escolhido em vez de Prisma/TypeORM porque o time pode colaborar com DBA em SQL nativo (schema, migrations e queries próximas do SQL). TypeORM foi rejeitado pelo risco cultural de misturar entidades decoradas com domínio. Prisma permanece alternativa válida de DX, mas com mais atrito na colaboração SQL-first.

**Consequences:** migrations e SQL do adapter são revisáveis por DBA; versões do Drizzle devem estar patchadas; identificadores SQL dinâmicos só com allowlist; listagem in-memory e Postgres devem ordenar de forma estável por `created_at` descendente (mais recentes primeiro) para paginação previsível.
