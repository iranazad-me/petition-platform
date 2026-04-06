FROM node:22-bookworm-slim AS base
RUN npm config set registry https://mirror2.chabokan.net/npm/
ARG PNPM_VERSION=10.33.0
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Install pnpm directly via npm instead of corepack

# Install pnpm globally
RUN npm install -g pnpm@${PNPM_VERSION} && \
    pnpm --version

# Dependencies stage - install with frozen lockfile for reproducibility
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Builder stage - build the application
FROM deps AS builder
COPY . .
# Install dev dependencies for build
RUN pnpm install --frozen-lockfile
# Build production assets
RUN pnpm build
# Remove dev dependencies
RUN pnpm prune --prod

# Production runtime stage - minimal final image
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN groupadd --system nodejs && \
    useradd --system --gid nodejs --home /app nodejs

# Copy production dependencies and built artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./server.js
COPY --from=builder --chown=nodejs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nodejs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
# Copy src directory for server-side dynamic imports (#/lib/petition-server)
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Copy and set up entrypoint
COPY --from=builder --chown=nodejs:nodejs /app/scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose port and set health check
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node /app/scripts/healthcheck.mjs || exit 1

# Set the default command
CMD ["/app/scripts/entrypoint.sh"]
