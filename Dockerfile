# --- Build frontend (Vue + Vite) ---
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./

# Rutas relativas al API en producción (mismo origen que Express)
ENV VITE_API_URL=

RUN pnpm run build

# --- Runtime: Express sirve API + estáticos ---
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache wget \
  && corepack enable \
  && corepack prepare pnpm@9.15.4 --activate

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "index.js"]
