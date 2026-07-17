import { describe, expect, it } from "vitest";
import { resolvePersistenceMode } from "./persistence-mode.js";

describe("resolvePersistenceMode", () => {
  it("uses memory when PERSISTENCE=memory even if DATABASE_URL is set", () => {
    expect(
      resolvePersistenceMode({
        PERSISTENCE: "memory",
        DATABASE_URL: "postgresql://localhost/audax",
      }),
    ).toBe("memory");
  });

  it("uses postgres when DATABASE_URL is set and PERSISTENCE is not memory", () => {
    expect(
      resolvePersistenceMode({
        DATABASE_URL: "postgresql://localhost/audax",
      }),
    ).toBe("postgres");
  });

  it("uses memory when DATABASE_URL is absent", () => {
    expect(resolvePersistenceMode({})).toBe("memory");
  });
});
