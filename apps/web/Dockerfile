# Build context is the monorepo root (see docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/web apps/web
RUN pnpm --filter web build
# Same approach as apps/api/Dockerfile: pnpm's .pnpm symlink store doesn't
# survive being copied between Docker stages, so produce a self-contained,
# non-symlinked deploy of just the web package for the runtime stage.
RUN pnpm deploy --filter web --prod /repo/out

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/out ./
COPY --from=build /repo/apps/web/.next ./.next
COPY --from=build /repo/apps/web/public ./public
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
