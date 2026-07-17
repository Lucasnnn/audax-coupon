import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@audax/contracts"],
  output: "standalone",
};

export default nextConfig;
