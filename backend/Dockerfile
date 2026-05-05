FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Fallback to npm install if npm ci fails (lockfile mismatch)
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN groupadd --system appgroup && useradd --system --gid appgroup --home-dir /app --shell /usr/sbin/nologin appuser && chown -R appuser:appgroup /app
USER appuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:5000/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/app.js"]
