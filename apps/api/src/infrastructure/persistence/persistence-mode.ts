export type PersistenceMode = "memory" | "postgres";

/** Prefer `PERSISTENCE=memory` (CLI) over `DATABASE_URL` when both are set. */
export function resolvePersistenceMode(
  env: NodeJS.ProcessEnv = process.env,
): PersistenceMode {
  if (env.PERSISTENCE === "memory") {
    return "memory";
  }

  return env.DATABASE_URL ? "postgres" : "memory";
}
