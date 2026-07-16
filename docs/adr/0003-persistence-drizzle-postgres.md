# Postgres com Drizzle e repositório in-memory nos testes

A porta de repositório vive no domínio/aplicação. Casos de uso são testados com adapter in-memory (sem banco/HTTP). A API de verdade usa Postgres via Drizzle no adapter de infraestrutura, mantendo o domínio trocável de persistência.

Drizzle foi escolhido em vez de Prisma/TypeORM porque o time pode colaborar com DBA em SQL nativo (schema, migrations e queries próximas do SQL). TypeORM foi rejeitado pelo risco cultural de misturar entidades decoradas com domínio. Prisma permanece alternativa válida de DX, mas com mais atrito na colaboração SQL-first.

**Consequences:** migrations e SQL do adapter são revisáveis por DBA; versões do Drizzle devem estar patchadas; identificadores SQL dinâmicos só com allowlist.
