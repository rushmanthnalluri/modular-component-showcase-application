FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 8080
RUN addgroup -S appgroup && adduser -S -G appgroup appuser && chown -R appuser:appgroup /app
USER appuser

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
