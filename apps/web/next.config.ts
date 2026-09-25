import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { NextConfig } from "next";

// The Next app runs from apps/web, but local configuration is kept at the monorepo root.
const configDirectory = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(configDirectory, "../../.env") });
const nextConfig: NextConfig = { transpilePackages: ["@job-platform/shared", "@job-platform/matching"] };
export default nextConfig;
