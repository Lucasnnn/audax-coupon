# Audax — gestão de cupons

Monorepo (Turborepo + pnpm) para CRUD de cupons de desconto: API Nest em arquitetura hexagonal (`apps/api`), UI Next.js App Router (`apps/web`) e tipos do contrato HTTP (`packages/contracts`).

Este contexto cobre **cadastro e ciclo de vida operacional** do cupom. Elegibilidade e aplicação do desconto em pedido ficam fora do escopo (outra ponta consumidora).

## Pré-requisitos

- Node.js 22+
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- Docker + Docker Compose — só se for usar Postgres

## Setup

```bash
pnpm install
cp .env.example .env
```

O `.env` na raiz é lido pela API automaticamente. No Windows não é necessário `source` / export manual.

| Variável | Uso |
|----------|-----|
| `PERSISTENCE` | `memory` força repositório in-memory (mesmo com `DATABASE_URL` no `.env`). |
| `DATABASE_URL` | Postgres da API. Ausente + sem `PERSISTENCE=memory` → in-memory. |
| `PORT` | Porta da API (padrão `3001`). |
| `NEXT_PUBLIC_API_URL` | URL da API no browser (padrão `http://localhost:3001`). |

Credenciais do Postgres (Compose): usuário/senha/db `audax`, porta `5432`.

## Execução

Dois caminhos: **in-memory** ou **Postgres no Docker** (API e web sempre no host).

### 1) Local — in-memory (sem banco)

Não precisa de Docker nem Postgres. Dados somem ao reiniciar a API.

```bash
pnpm install
pnpm dev:memory
```

| Serviço | URL |
|---------|-----|
| Web     | http://localhost:3000 |
| API     | http://localhost:3001 (`persistence: memory` no log) |

Só a API: `pnpm dev:api:memory`

### 2) Local — Postgres no Docker

Sobe só o banco no Docker; API e web rodam no host (hot reload).

```bash
pnpm install
cp .env.example .env   # se ainda não tiver
pnpm dev:postgres      # sobe Postgres (healthy) + API + web
```

Equivalente passo a passo:

```bash
pnpm docker:db   # docker compose up postgres -d --wait
pnpm dev         # API lê DATABASE_URL do .env → persistence: postgres
```

| Serviço  | URL / porta |
|----------|-------------|
| Web      | http://localhost:3000 |
| API      | http://localhost:3001 (`persistence: postgres` no log) |
| Postgres | `localhost:5432` |

Com `DATABASE_URL`, a API aplica o schema na subida.

**Seed** (30 cupons mock, incl. `USEDDEMO12` com `usage_count = 12`):

- Em **volume novo**, o Compose aplica `0001_seed_mock_coupons.sql` via `docker-entrypoint-initdb.d`.
- Em volume já existente (ou para reaplicar o dump idempotente):

```bash
pnpm db:seed
```

Parar o Postgres:

```bash
pnpm docker:down
```

### Scripts úteis

| Comando | Efeito |
|---------|--------|
| `pnpm dev:memory` | API + web **in-memory** (sem banco) |
| `pnpm dev:postgres` | Sobe Postgres no Docker e API + web no host |
| `pnpm docker:db` | Só Postgres no Docker (aguarda healthcheck) |
| `pnpm docker:down` | Para o Postgres do Compose |
| `pnpm dev` | API + web (Postgres se `DATABASE_URL` estiver no `.env`) |
| `pnpm dev:api` / `dev:api:memory` / `dev:web` | Só um serviço |
| `pnpm db:seed` | Insere/reaplica dump de 30 cupons mock no Postgres |

## Testes

```bash
pnpm test          # monorepo (Turbo)
pnpm test:api      # só @audax/api
```

CI (GitHub Actions): em todo `push`/`pull_request`, roda `pnpm test` (Node 22 + pnpm 9).

- Runner: **Vitest** em todo o monorepo.
- Domínio, casos de uso e HTTP usam **`InMemoryCouponRepository`** — sem Postgres e sem Docker nos testes.
- O mapper Drizzle tem teste de round-trip isolado; a integração real com Postgres fica no caminho local com `DATABASE_URL` (`pnpm docker:db` / `pnpm dev:postgres`).
- Na borda HTTP, **Zod** (`ZodValidationPipe`) valida o contrato do request antes do caso de uso; invariantes de domínio continuam no `domain`/`application`.

## Estrutura

```
apps/api/          Nest — domain / application / infrastructure
apps/web/          Next.js (App Router) — UI de gestão
packages/contracts DTOs/enums do contrato HTTP (consumidos pelo web)
docs/adr/          decisões de arquitetura
CONTEXT.md         linguagem ubíqua do domínio
```

## Fases do histórico (como ler os commits)

1. **Domínio + TDD** — entidade, casos de uso e HTTP com in-memory (`test:` → `feat:` em fatias).
2. **Persistência** — porta `CouponRepository`, Drizzle/Postgres, Compose só do banco e seed.
3. **Produto / UX** — formulário, paginação, políticas na UI, store local e polish visual.

## Superfície da UI vs API

A API expõe CRUD completo: criar, listar (paginação), buscar por id, atualizar e remover.

Na UI de gestão:

- **Criar** com validação de formulário, loading e erros da API.
- **Listar** com paginação no cliente (store carrega até 1000 itens).
- **Atualizar** status e Expiration date na listagem (campos operacionais do dia a dia).
- **Remover** com confirmação (bloqueado se `usageCount > 0`).
- Tipo/valor de desconto e mínimo de pedido são definidos na **criação**; a API já aceita alteração desses campos no `PATCH` enquanto `usageCount === 0` (política na application). Detalhe por id existe na API (`GET /coupons/:id`) e no client (`couponsApi.get`).

## Decisões de arquitetura e trade-offs

Resumo abaixo; o “porquê” formal está em [`docs/adr/`](docs/adr/) e a linguagem em [`CONTEXT.md`](CONTEXT.md).

| Tema | Decisão | Trade-off principal |
|------|---------|---------------------|
| Monorepo | Turborepo + pnpm | Setup leve vs governança Nx (geradores/boundaries) em times maiores — [ADR 0001](docs/adr/0001-monorepo-turborepo-pnpm.md) |
| Hexagonal | `domain` → `application` → `infrastructure`; web só HTTP + contracts | Tipagem compartilhada sem vazar domínio; erros de domínio ficam na API — [ADR 0002](docs/adr/0002-hexagonal-layers-and-contracts.md) |
| Persistência | Porta + Drizzle/Postgres; in-memory em testes e `dev:memory` | SQL revisável vs DX Prisma; dados memory não sobrevivem ao restart — [ADR 0003](docs/adr/0003-persistence-drizzle-postgres.md) |
| Dinheiro / ciclo de vida | Centavos na API; status só ACTIVE/INACTIVE; políticas pós-uso na application | Conversão reais↔centavos no front; sem status EXPIRED — [ADR 0004](docs/adr/0004-coupon-lifecycle-and-money.md) |
| Testes | Vitest no monorepo | Um runner ESM para API e web — [ADR 0005](docs/adr/0005-vitest.md) |
| Git | Commits na `main` com revisão local neste entregável | Em colaboração, branches + PRs — [ADR 0006](docs/adr/0006-git-workflow-main-vs-prs.md) |

**Store do front:** lista uma vez (`pageSize=1000`), pagina no cliente e aplica mutações no estado local — adequado ao volume de gestão; se crescer, paginação server-side.

**DI Nest:** casos de uso como providers via `useFactory` + `inject: [COUPON_REPOSITORY]` — DI na infra sem decorators Nest na application.

**Escopo consciente:** fora deste entregável — elegibilidade, aplicação em pedido e escrita de `usageCount`.
