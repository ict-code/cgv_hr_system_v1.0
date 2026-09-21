import type { NextConfig } from "next";

const PMIS_ROUTES = ["appointment-statuses", "branding", "casual-appointments", "coming-soon", "contractual-appointments", "dashboard", "departments", "employees", "employment-statuses", "plantilla", "plantilla-appointments", "positions", "roles", "salary-grades", "service-records", "users"];

const nextConfig: NextConfig = {
  // PMIS pages live under /pmis; redirect the old top-level URLs so existing
  // bookmarks keep working.
  async redirects() {
    return PMIS_ROUTES.map((route) => ({
      source: `/${route}/:path*`,
      destination: `/pmis/${route}/:path*`,
      permanent: false,
    }));
  },

  // NOTE: deliberately not using output:"standalone" — in this pnpm monorepo
  // its traced output still symlinks back into the workspace root's .pnpm
  // store rather than being truly self-contained (a known pnpm+Next.js
  // monorepo caveat). The Dockerfile installs prod deps fresh in the runtime
  // stage instead, same pattern used for the API (see apps/api/Dockerfile).
};

export default nextConfig;
