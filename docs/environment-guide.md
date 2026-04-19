# Environment Configuration Guide

This guide explains all environment variables used in the Modular Component Showcase application.

## Quick Start

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GATEWAY_URL=http://localhost:8000
VITE_APP_NAME="Modular Component Showcase"
```

### Backend (.env)

```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://mongo:27017/modular_components
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/modular_components
JWT_SECRET=development-secret-key-change-in-production
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:8000
ALLOW_MEMORY_FALLBACK=false
SQL_AUTO_MIGRATE=true
PGSSL=false
```

### Gateway (.env)

```bash
BACKEND_URL=http://localhost:5000
AUTH_SERVICE_URL=http://localhost:5000
SEARCH_SERVICE_URL=http://localhost:5000
SQL_SERVICE_URL=http://localhost:5000
COMPONENT_SERVICE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:8080
GATEWAY_HOST=0.0.0.0
GATEWAY_PORT=8000
LOG_LEVEL=info
DEBUG=false
```

## Detailed Configuration

### Frontend Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_API_BASE_URL` | URL | `/api` | Express backend API base URL |
| `VITE_GATEWAY_URL` | URL | (empty) | Optional FastAPI gateway URL |
| `VITE_APP_NAME` | String | `App` | Application display name |

**Notes:**
- Set `VITE_API_BASE_URL` to the backend's full URL (e.g., `https://api.example.com`)
- Set `VITE_GATEWAY_URL` to enable optional gateway routing
- Relative paths (like `/api`) work for same-origin requests
- The frontend will fallback to `VITE_API_BASE_URL` if gateway is unavailable

### Backend Variables

| Variable | Type | Default | Required | Production |
|----------|------|---------|----------|------------|
| `PORT` | Number | `5000` | No | Yes |
| `NODE_ENV` | String | `development` | No | Yes (set to `production`) |
| `MONGODB_URI` | URL | N/A | Yes | Yes (Atlas cluster) |
| `DATABASE_URL` | URL | N/A | Yes | Yes (PostgreSQL) |
| `JWT_SECRET` | String | N/A | Yes | Yes (random) |
| `FRONTEND_ORIGINS` | CSV | N/A | No | Yes |
| `ALLOW_MEMORY_FALLBACK` | Boolean | `false` | No | No (always false) |
| `SQL_AUTO_MIGRATE` | Boolean | `false` | No | Conditional |
| `PGSSL` | Boolean | `false` | No | Yes (set to true) |

**Detailed Descriptions:**

#### `MONGODB_URI`
- Connection string to MongoDB Atlas or local MongoDB
- Format: `mongodb://user:pass@host:port/database?options`
- Example (Atlas): `mongodb+srv://user:pass@cluster.mongodb.net/modular_components?retryWrites=true`
- Example (Local): `mongodb://localhost:27017/modular_components`

#### `DATABASE_URL`
- PostgreSQL connection string for SQL catalog
- Format: `postgresql://user:password@host:port/database`
- Example: `postgresql://postgres:password@db.example.com:5432/modular_components`

#### `JWT_SECRET`
- Secret key for signing JWT tokens
- **CRITICAL**: Use strong random value in production
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Changing this invalidates all existing tokens

#### `FRONTEND_ORIGINS`
- Comma-separated list of allowed origins for CORS
- Must include:
  - Frontend URL(s)
  - Gateway URL (if used)
  - localhost variations for development
- Example: `http://localhost:8080,http://localhost:8000,https://app.example.com`

#### `ALLOW_MEMORY_FALLBACK`
- Allow fallback to in-memory storage if databases are unavailable
- **NEVER enable in production** - data will be lost
- Development only for testing without databases

#### `SQL_AUTO_MIGRATE`
- Automatically run schema migrations on startup
- Useful for development and CI/CD
- Disable in production after initial setup

#### `PGSSL`
- Require SSL for PostgreSQL connections
- **Set to true in production** for security
- Can be disabled for local development

### Gateway Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BACKEND_URL` | URL | `http://localhost:5000` | Express backend URL |
| `AUTH_SERVICE_URL` | URL | `(empty)` | Optional auth service URL; falls back to `BACKEND_URL` |
| `SEARCH_SERVICE_URL` | URL | `(empty)` | Optional search service URL; falls back to `BACKEND_URL` |
| `SQL_SERVICE_URL` | URL | `(empty)` | Optional SQL service URL; falls back to `BACKEND_URL` |
| `COMPONENT_SERVICE_URL` | URL | `(empty)` | Optional component service URL; falls back to `BACKEND_URL` |
| `FRONTEND_URL` | URL | `http://localhost:8080` | Frontend URL for CORS |
| `GATEWAY_HOST` | String | `0.0.0.0` | Bind host (0.0.0.0 for all interfaces) |
| `GATEWAY_PORT` | Number | `8000` | Listen port |
| `LOG_LEVEL` | String | `info` | Logging level (debug, info, warning, error) |
| `DEBUG` | Boolean | `false` | Debug mode (reload on changes) |

**Production Gateway Configuration:**

```bash
BACKEND_URL=https://backend.example.com
AUTH_SERVICE_URL=https://backend.example.com
SEARCH_SERVICE_URL=https://backend.example.com
SQL_SERVICE_URL=https://backend.example.com
COMPONENT_SERVICE_URL=https://backend.example.com
FRONTEND_URL=https://app.example.com
GATEWAY_HOST=0.0.0.0
GATEWAY_PORT=8000
LOG_LEVEL=warning
DEBUG=false
```

## Development Setup

### Local Development (Docker Compose)

```bash
# Start all services
docker-compose up

# Services available at:
# - Frontend: http://localhost:8080
# - Backend API: http://localhost:5000
# - Gateway: http://localhost:8000
# - PostgreSQL: localhost:5432
# - MongoDB: localhost:27017
# - pgAdmin: http://localhost:5050
```

### Manual Development Setup

```bash
# Frontend
cd .
npm install
VITE_API_BASE_URL=http://localhost:5000/api npm run dev

# Backend
cd backend
npm install
npm run dev  # or: npm start

# Gateway (optional)
cd gateway
pip install -r requirements.txt
python run.py
```

## Production Deployment

### Render.yaml Configuration

```yaml
# Frontend (Static Build)
- type: web
  name: frontend
  runtime: static
  buildCommand: npm install && npm run build
  staticPublishPath: dist
  envVars:
    - key: VITE_API_BASE_URL
      value: https://api.example.com
    - key: VITE_GATEWAY_URL
      value: https://gateway.example.com

# Backend (Node.js)
- type: web
  name: backend
  runtime: node
  buildCommand: npm install
  startCommand: npm start
  healthCheckPath: /health
  envVars:
    - key: NODE_ENV
      value: production
    - key: PORT
      value: 5000
    - key: MONGODB_URI
      sync: false  # Set via Render dashboard
    - key: DATABASE_URL
      sync: false
    - key: JWT_SECRET
      generateValue: true
    - key: PGSSL
      value: true

# Gateway (Python)
- type: web
  name: gateway
  runtime: python
  buildCommand: pip install -r requirements.txt
  startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
  healthCheckPath: /health
  envVars:
    - key: BACKEND_URL
      sync: false  # Set via Render dashboard
    - key: FRONTEND_URL
      sync: false
    - key: LOG_LEVEL
      value: warning
    - key: DEBUG
      value: false
```

### Environment Secrets (Render Dashboard)

Set these as environment variables in Render dashboard:

**For Backend:**
- `MONGODB_URI`: MongoDB Atlas connection string
- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_ORIGINS`: Include all frontend and gateway URLs

**For Gateway:**
- `BACKEND_URL`: Full backend service URL
- `FRONTEND_URL`: Full frontend service URL

## Security Considerations

### Development
- Use weak secrets for convenience
- Disable PGSSL for local testing
- Allow broad CORS origins for localhost testing

### Production
- Always use strong random `JWT_SECRET`
- Enable `PGSSL` for PostgreSQL
- List specific `FRONTEND_ORIGINS` (never use wildcards)
- Disable `ALLOW_MEMORY_FALLBACK`
- Set `NODE_ENV=production`
- Use `LOG_LEVEL=warning` or higher
- Set `DEBUG=false`
- Use environment-specific backends (Atlas for MongoDB)

## Validation

### Check Frontend Configuration

```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_GATEWAY_URL);
```

### Check Backend Configuration

```bash
npm --prefix backend run test
```

### Check Gateway Configuration

```bash
curl http://localhost:8000/status
```

## Troubleshooting

### "CORS error" or "No Access-Control-Allow-Origin"
- Check `FRONTEND_ORIGINS` includes your frontend URL
- Check protocol (http vs https) matches exactly
- Check port number is included
- Restart backend after changing `FRONTEND_ORIGINS`

### "Connection refused" to MongoDB/PostgreSQL
- Check `MONGODB_URI` and `DATABASE_URL` are correct
- Check services are running (Docker or local)
- Check firewall allows connections
- Check credentials in connection string

### "Invalid JWT token"
- Occurs after changing `JWT_SECRET`
- Users need to re-login
- Clear browser cookies/local storage if stuck

### "Gateway timeout"
- Check backend is running and healthy: `curl $BACKEND_URL/health`
- Check network connectivity between gateway and backend
- Increase timeout if backend is slow

## Environment File Examples

### `.env.example` (Frontend)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GATEWAY_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=Modular Component Showcase
```

### `.env.example` (Backend)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/modular_components
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/modular_components

# Security
JWT_SECRET=your-secret-key-here
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:8080

# Features
ALLOW_MEMORY_FALLBACK=false
SQL_AUTO_MIGRATE=true
PGSSL=false
```

### `.env.example` (Gateway)
```bash
# Backend Configuration
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:8080

# Server Configuration
GATEWAY_HOST=0.0.0.0
GATEWAY_PORT=8000

# Logging
LOG_LEVEL=info
DEBUG=false
```
