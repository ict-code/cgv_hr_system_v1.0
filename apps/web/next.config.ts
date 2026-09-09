import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: deliberately not using output:"standalone" — in this pnpm monorepo
  // its traced output still symlinks back into the workspace root's .pnpm
  // store rather than being truly self-contained (a known pnpm+Next.js
  // monorepo caveat). The Dockerfile installs prod deps fresh in the runtime
  // stage instead, same pattern used for the API (see apps/api/Dockerfile).
};

export default nextConfig;
