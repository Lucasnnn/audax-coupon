# Audax — gestão de cupons

Monorepo (Turborepo + pnpm) para CRUD de cupons de desconto: API Nest em arquitetura hexagonal (`apps/api`), UI Next.js (`apps/web`) e contratos compartilhados (`packages/contracts`).

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
apps/web/          Next.js — UI de gestão
packages/contracts DTOs, enums e códigos de erro compartilhados
docs/adr/          decisões de arquitetura
CONTEXT.md         linguagem ubíqua do domínio
```

## Fases do histórico (como ler os commits)

1. **Domínio + TDD** — entidade, casos de uso e HTTP com in-memory (`test:` → `feat:` em fatias).
2. **Persistência** — porta `CouponRepository`, Drizzle/Postgres, Compose só do banco e seed.
3. **Produto / UX** — formulário, paginação, políticas na UI, store local e polish visual.

## Decisões de arquitetura e trade-offs

### Monorepo (Turborepo + pnpm)

**Decisão:** um repositório com `apps/*` e `packages/*`, orquestrado por Turbo.

**Trade-off:** Nx traria geradores, affected e boundaries mais fortes — melhor em times grandes. Aqui priorizamos setup leve e foco no domínio/TDD; Nx seria a evolução natural de governança.

### Hexagonal no backend; contrato na borda

**Decisão:** camadas em `apps/api` (`domain` → `application` → `infrastructure`). O Next consome só HTTP e `@audax/contracts`; **não** importa entidades de domínio.

| Camada | Responsabilidade |
|--------|------------------|
| `domain` | Invariantes da entidade (percentual 1–100, FIXED com min order, etc.) |
| `application` | Políticas de caso de uso (mutabilidade pós-uso, expiração ≥ dia corrente) |
| `infrastructure` | HTTP Nest, Drizzle/Postgres, in-memory |

**Trade-off:** compartilhar pacotes de domínio com o front aceleraria tipagem, mas duplicaria donos do modelo e acoplaria UI ao núcleo. Contracts + `CONTEXT.md` unificam a linguagem sem vazar o domínio.

Casos de uso são registrados como **providers Nest** via `useFactory` + `inject: [COUPON_REPOSITORY]` no `CouponsModule` — DI na infra sem colocar decorators Nest na camada de application.

### Store do front e `pageSize=1000`

**Decisão:** a UI carrega a lista uma vez (`CLIENT_LIST_PAGE_SIZE = 1000`), guarda em store (`useSyncExternalStore`) e pagina no cliente; mutações (criar/atualizar/excluir) atualizam o estado local com a resposta da API, sem relistar.

**Trade-off:** evita GET repetido a cada toggle/página — adequado ao CRUD de gestão com volume moderado. Se o catálogo crescer além disso, trocar para paginação server-side (ou `couponsStore.load({ force: true })` com janelas menores). O teto de `pageSize` na API Zod é 1000, alinhado a esse fetch.

### Persistência: porta + Drizzle/Postgres + in-memory nos testes

**Decisão:** porta `CouponRepository` no domínio; com `DATABASE_URL` usa `DrizzleCouponRepository` + Postgres; testes e CLI (`pnpm dev:memory` / `PERSISTENCE=memory`) usam `InMemoryCouponRepository`.

**Trade-off:** Drizzle favorece SQL revisável (schema/migrations próximos do DBA). Prisma teria DX mais “mágica”; TypeORM foi evitado pelo risco de entidades decoradas misturadas ao domínio. Custo: cuidar de versões do Drizzle e manter SQL sob controle. In-memory facilita o primeiro run sem Docker; dados não sobrevivem ao restart.

### Dinheiro em centavos; UI em reais

**Decisão:** API e domínio usam inteiros em **centavos** (e percentual 1–100). A UI captura/exibe em **reais** e converte na borda HTTP.

**Trade-off:** evita float para dinheiro; exige conversão explícita no front. Moeda implícita neste escopo: BRL.

### Ciclo de vida e mutabilidade pós-uso

**Decisão:** status operacional só `ACTIVE` | `INACTIVE` (sem `EXPIRED` — expiração é regra sobre data). Com `usageCount > 0`:

- **não** deleta
- **não** altera tipo/valor de desconto
- **pode** alterar status e data de expiração

Com `usageCount === 0`, delete e alteração de desconto são permitidos. A escrita do contador pertence à ponta consumidora; aqui o campo é fato de leitura para as políticas.

**Trade-off:** políticas na `application` (não no domínio puro) mantêm a entidade focada em invariantes e a mutabilidade operacional explícita nos casos de uso. O front só valida preventivamente; a API é a fonte de verdade.

### Escopo consciente

Fora deste entregável: elegibilidade do cupom, aplicação em pedido e escrita de `usageCount`. Persistência cobre o CRUD de gestão; a ponta consumidora reutiliza o mesmo contrato/linguagem.

### Detalhamento

Decisões formais: [`docs/adr/`](docs/adr/). Linguagem do domínio: [`CONTEXT.md`](CONTEXT.md).
