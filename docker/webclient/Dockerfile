# Multi-stage Dockerfile für Next.js Webclient
FROM node:20-slim as base

# Installiere grundlegende Abhängigkeiten
RUN apt-get update && apt-get install -y \
    dumb-init \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Setze Arbeitsverzeichnis
WORKDIR /app

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Kopiere package files zuerst (besseres Layer-Caching)
COPY ./webclient/package*.json ./

# Installiere Dependencies falls package.json existiert
RUN if [ -f package.json ]; then npm install; fi

# Kopiere Source Code vom webclient Ordner
COPY ./webclient .

# Exponiere Port für Next.js dev server
EXPOSE 3000

# Verwende dumb-init als PID 1
ENTRYPOINT ["dumb-init", "--"]

# Standard Command für Development
CMD ["npm", "run", "dev"]

# Production build stage
FROM base as build
ENV NODE_ENV=production

# Kopiere package files vom webclient Ordner
COPY ./webclient/package*.json ./

# Installiere dependencies (inkl. dev für next.config.ts)
RUN npm ci --include=dev && npm cache clean --force

# Kopiere Source Code vom webclient Ordner
COPY ./webclient .

# Build-time environment variables für Next.js (NEXT_PUBLIC_* muss beim Build gesetzt sein)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Baue die Next.js Anwendung
RUN npm run build

# Production stage
FROM node:20-slim as production
ENV NODE_ENV=production

# Installiere dumb-init und curl
RUN apt-get update && apt-get install -y \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Erstelle non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Kopiere public assets
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Kopiere Next.js standalone output
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Wechsle zu non-root user
USER nextjs

# Exponiere Port
EXPOSE 3000

# Verwende dumb-init als PID 1
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js
CMD ["node", "server.js"]