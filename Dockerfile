# syntax=docker/dockerfile:1.6
# T21 — production image for the frontend (Next.js standalone).
#
# Deliberate constraints (same as the backend image, different runtime fact):
#   1. every base layer is digest-pinned — the image built today is the image
#      built in CI, bit for bit;
#   2. `next build` produces `.next/standalone`: a server.js plus exactly the
#      node_modules it needs — the runtime stage carries no devDependencies,
#      no sources, no tests, no .env files;
#   3. the process is non-root (the official node user, uid 1000) and carries a
#      HEALTHCHECK on `/robots.txt` — served by the Next server itself, so it
#      verifies ONLY this process, never the (separate) API backend. The real
#      end-to-end readiness lives in the backend container's /api/v1/health/ready.
#
# Note on budgets: `pnpm build` (next build && bundle-budget) is the CI and
# developer gate; the image build runs `next build` directly so image builds
# stay fast and the budget gate stays a CI artifact, not a docker artifact.
#
# Update the digest, never `docker pull` a moving tag:
#   docker manifest inspect node:22-bookworm-slim

FROM node:22-bookworm-slim@sha256:ea11b74b986d520137cdef9a5346e447a00f275ecc4abc0055b7151226231e09 AS base

# PNPM_VERSION mirrors packageManager in package.json — the ARG is the visible,
# cache-busting surface.
ARG PNPM_VERSION=12.15.0
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable \
    && corepack prepare "pnpm@$PNPM_VERSION" --activate

# --- deps: full install (build toolchain needed by next build) --------------
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# -- the store cache mount makes restarts cheap and keeps the layer reproducible
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# --- build: compile the Next app incl. the standalone server -----------------
FROM build AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm exec next build

# --- runtime: standalone server + static assets only -------------------------
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
# Next's standalone server binds to $HOSTNAME. Docker sets HOSTNAME to the
# container id, which would leave loopback (and therefore HEALTHCHECK) refused;
# 0.0.0.0 is the standard standalone-image binding.
ENV HOSTNAME=0.0.0.0

# .next/standalone already carries its own minimal node_modules + server.js
COPY --from=builder --chown=node:node /app/.next/standalone ./
# static chunks and public files must be layered externally (standalone does
# not package them by default)
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# node (uid 1000) ships with the official image — no user creation, no chown
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
