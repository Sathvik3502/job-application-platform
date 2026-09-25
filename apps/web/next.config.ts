import type { NextConfig } from "next";
const nextConfig: NextConfig = { transpilePackages: ["@job-platform/shared", "@job-platform/matching"] };
export default nextConfig;
