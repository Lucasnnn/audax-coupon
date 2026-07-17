# Audax — gestão de cupons

Monorepo (Turborepo + pnpm) com API Nest hexagonal (`apps/api`), web Next.js (`apps/web`) e contratos compartilhados (`packages/contracts`).

## Pré-requisitos

- Node.js 22+
- pnpm 9 (`corepack enable`)
- Docker + Docker Compose (para stack completa com Postgres)

## Subir tudo com Docker

Na raiz do repositório:

```bash
docker compose up --build
```

Serviços:

| Serviço   | URL / porta              |
|-----------|--------------------------|
| Web       | http://localhost:3000    |
| API       | http://localhost:3001    |
| Postgres  | localhost:5432 (`audax` / `audax` / db `audax`) |

A API aplica o schema de cupons na subida quando `DATABASE_URL` está definido. O front no browser chama a API em `http://localhost:3001` (`NEXT_PUBLIC_API_URL`).

Parar:

```bash
docker compose down
```

## Desenvolvimento local (sem Docker da app)

1. Suba só o banco:

```bash
docker compose up postgres -d
```

2. Configure o ambiente:

```bash
cp .env.example .env
```

3. Instale e rode:

```bash
pnpm install
pnpm --filter @audax/api db:migrate
pnpm dev
```

- API: `http://localhost:3001` (Postgres via `DATABASE_URL`)
- Web: `http://localhost:3000`

Sem `DATABASE_URL`, a API usa repositório **in-memory** (útil para testes HTTP).

## Testes

```bash
pnpm test
```

Casos de uso e HTTP usam adapter **in-memory** (sem Postgres), conforme ADR `0003`. O mapper Drizzle tem teste de round-trip isolado.

## Persistência

- Porta: `CouponRepository` no domínio
- Produção / Docker: `DrizzleCouponRepository` + Postgres
- Testes / fallback: `InMemoryCouponRepository`
- Schema SQL: `apps/api/drizzle/0000_init.sql`

## Decisões relevantes

- `CONTEXT.md` e `docs/adr/` descrevem o domínio e as escolhas (hexagonal, regras na application, Drizzle, fluxo git).
- Valores monetários: API em **centavos**; UI em **reais**.
- Após uso (`usageCount > 0`): sem delete; desconto imutável; status e expiração editáveis.

## Escopo consciente

Elegibilidade/aplicação do cupom em pedido fica fora deste contexto. Persistência Drizzle cobre o CRUD de gestão; a ponta consumidora escreveria `usageCount`.
