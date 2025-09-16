import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Avoid failing production builds on ESLint errors (generated code, etc.)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
