FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
ARG VITE_GATEWAY_URL=http://localhost:8000
ARG VITE_USE_GATEWAY=true
ENV VITE_GATEWAY_URL=${VITE_GATEWAY_URL}
ENV VITE_USE_GATEWAY=${VITE_USE_GATEWAY}
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
