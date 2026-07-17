import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@audax/contracts"],
};

export default nextConfig;
