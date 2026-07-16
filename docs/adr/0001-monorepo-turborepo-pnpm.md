# Monorepo com Turborepo e pnpm

Escolhemos Turborepo + pnpm workspaces para orquestrar `apps/api`, `apps/web` e `packages/*` com setup leve e foco no domínio, na arquitetura hexagonal e no TDD.

**Considered options:** Nx; Turborepo + pnpm; monorepos separados.

Nx seria preferível em ambiente corporativo com mais pessoas e crescimento do monorepo: geradores, graph/affected e module boundaries que enforce padrões de dependência a longo prazo. Para este entregável, priorizamos simplicidade e clareza de avaliação; Nx permanece a evolução natural de governança.
