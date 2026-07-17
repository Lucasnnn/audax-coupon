import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";
import { resolve } from "node:path";

// Monorepo: um único `.env` na raiz (mesmo arquivo da API / seed).
loadEnv({ path: resolve(__dirname, "../../.env") });
loadEnv({ path: resolve(__dirname, ".env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@audax/contracts"],
};

export default nextConfig;
