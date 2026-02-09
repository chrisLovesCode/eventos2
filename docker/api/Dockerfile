# Multi-Stage Build für Production
FROM node:20-slim as base
ENV NODE_ENV=production

# Installiere Build-Abhängigkeiten
RUN apt-get update && apt-get install -y \
    dumb-init \
    openssl \
    ca-certificates \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================
# Development Stage (used by docker-compose.yml)
# ============================================
FROM base as development
ENV NODE_ENV=development

# Copy package files for better layer caching
COPY ./api/package*.json ./
COPY ./api/prisma ./prisma

# Install dependencies incl. dev deps (Nest start:dev, ts-node, etc.)
RUN npm install

# Copy application source (dev uses bind-mounts in compose, but keeps image runnable)
COPY ./api ./

EXPOSE 3000
EXPOSE 9229

# Verwende dumb-init als PID 1
ENTRYPOINT ["dumb-init", "--"]

# Standard Command für Development
CMD ["npm", "run", "start:dev"]

# ============================================
# Build Stage
# ============================================
FROM base as build

# Dev-Dependencies für Build installieren
ENV NODE_ENV=development

# Kopiere package files
COPY ./api/package*.json ./
COPY ./api/prisma ./prisma

# Installiere ALLE Dependencies (inkl. dev + optional für build)
RUN npm ci --include=optional

# Kopiere Source Code
COPY ./api ./

# Generiere Prisma Client und baue Anwendung (lokales Prisma)
RUN ./node_modules/.bin/prisma generate && \
    npm run build

# Entferne devDependencies
RUN npm prune --omit=dev

# Stelle sicher, dass Sharp Linux-Binaries vorhanden sind (arch-abhängig)
ARG TARGETARCH
RUN ARCH="${TARGETARCH:-$(uname -m)}" && \
        if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ] || [ "$ARCH" = "x64" ]; then \
            PKG_ARCH="x64"; \
        elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
            PKG_ARCH="arm64"; \
        else \
            echo "Unsupported arch: $ARCH" && exit 1; \
        fi && \
        npm install --no-save --include=optional --os=linux --cpu="$PKG_ARCH" \
            "@img/sharp-linux-$PKG_ARCH" "@img/sharp-libvips-linux-$PKG_ARCH"

# ============================================
# Production Stage
# ============================================
FROM base as production

# Erstelle non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nestjs

WORKDIR /app

# Kopiere built files und production dependencies aus build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/src/mail/templates ./src/mail/templates

# Wechsle zu non-root user
USER nestjs

# Exponiere Port
EXPOSE 3000

# Verwende dumb-init als PID 1
ENTRYPOINT ["dumb-init", "--"]

# Start Application
CMD ["node", "dist/src/main.js"]
