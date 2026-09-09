# Build context is the monorepo root (see docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# Full workspace install (pnpm's .pnpm symlink store doesn't survive being
# copied between Docker layers/stages, so we install once, in the stage that
# actually runs — not copy node_modules across stages).
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/db packages/db
COPY apps/api apps/api
RUN pnpm --filter @egaps/db exec prisma generate
RUN pnpm --filter api build
RUN pnpm deploy --filter api --prod /repo/out

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/out ./
COPY --from=build /repo/apps/api/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
