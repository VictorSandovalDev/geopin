# ---------- deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl && corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile=false

# ---------- build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat openssl && corepack enable
WORKDIR /repo
COPY --from=deps /repo ./
RUN pnpm --filter @geopin/types build \
 && pnpm --filter @geopin/api prisma:generate \
 && pnpm --filter @geopin/api build

# ---------- runtime ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini && corepack enable
WORKDIR /app
ENV NODE_ENV=production

# Preserve the repo layout so pnpm's relative symlinks (apps/api/node_modules
# → ../../node_modules/.pnpm) resolve at runtime.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
