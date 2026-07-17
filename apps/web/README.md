# @audax/web

UI de gestão de cupons (Next.js App Router). Faz parte do monorepo Audax — setup, env e scripts estão no [README da raiz](../../README.md).

## Desenvolvimento

Na raiz do repositório:

```bash
pnpm install
pnpm dev:memory    # API in-memory + web
# ou
pnpm dev:postgres  # Postgres no Docker + API + web
```

| Serviço | URL |
|---------|-----|
| Web     | http://localhost:3000 |
| API     | http://localhost:3001 |

A home redireciona para `/coupons`. A URL da API no browser vem de `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3001`) — ver `.env.example` na raiz.

## Scripts deste pacote

| Comando | Efeito |
|---------|--------|
| `pnpm --filter @audax/web dev` | Next em `:3000` |
| `pnpm --filter @audax/web test` | Vitest |
| `pnpm --filter @audax/web lint` | ESLint |
| `pnpm --filter @audax/web build` | Build de produção |

Linguagem ubíqua: [`CONTEXT.md`](../../CONTEXT.md). Decisões: [`docs/adr/`](../../docs/adr/).
