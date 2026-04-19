# Gateway Architecture

## Overview

The FastAPI Gateway is an optional reverse proxy layer that sits between the React frontend and the backend services. It provides a single entry point for API requests with built-in health checks, request forwarding, and error handling.

## Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Port 8080)   │
└────────┬────────┘
         │
         ├─────────────────────────┐
         │                         │
         v                         v
    ┌─────────────┐        ┌──────────────┐
    │   Gateway   │        │   Direct API │
    │ (Port 8000) │        │  (Port 5000) │
    └──────┬──────┘        └──────────────┘
           │
           v
    ┌──────────────┐
    │   Backend    │
    │ (Port 5000)  │
    └──────┬───────┘
           │
           ├─────────────┬──────────────┐
           │             │              │
           v             v              v
      ┌─────────┐   ┌────────┐   ┌──────────┐
      │ MongoDB │   │ Postgres   │ External │
      │ Atlas   │   │            │ Services │
      └─────────┘   └────────┘   └──────────┘
```

## Features

### 1. Request Forwarding
- Async HTTP client with retry logic (max 2 retries)
- 30-second default timeout
- Full HTTP method support (GET, POST, PUT, DELETE)
- Automatic error handling and logging

### 2. Request/Response Validation
- Pydantic schemas with type checking
- Email validation (EmailStr)
- String length constraints
- Number range constraints

### 3. CORS Support
- Multiple allowed origins (frontend, localhost variations)
- Credentials enabled
- Dynamic origin configuration via environment variables

### 4. Health & Monitoring
- Aggregate health checks (backend, MongoDB, PostgreSQL)
- Metrics endpoint for monitoring
- Health status tracking (healthy, degraded, unhealthy)
- Timestamp tracking for all health responses

### 5. Error Handling
- HTTPException with appropriate status codes
- Proper error logging
- 500 error responses with details
- Graceful fallbacks for service unavailability

## API Routes

### Authentication Service
```
POST   /authservice/signup           - Register new user
POST   /authservice/signin           - Authenticate user
POST   /authservice/logout          - Logout user
GET    /authservice/csrf            - Get CSRF token
```

### Search Service
```
POST   /searchservice/search        - Perform semantic search
GET    /searchservice/history       - Get search history
GET    /searchservice/health        - Check service health
```

### SQL Service (PostgreSQL Catalog)
```
GET    /sqlservice/components        - List components
POST   /sqlservice/components        - Create component
PUT    /sqlservice/components/{id}   - Update component
DELETE /sqlservice/components/{id}   - Delete component
```

### Component Service
```
GET    /componentservice/components           - List components
GET    /componentservice/components/{id}      - Get component details
POST   /componentservice/components           - Create component
PUT    /componentservice/components/{id}      - Update component
DELETE /componentservice/components/{id}      - Delete component
```

### Health & Monitoring
```
GET    /health                - Aggregate health check
GET    /metrics               - System metrics
GET    /status                - Gateway status
GET    /                      - Gateway info
```

## Environment Configuration

### Gateway Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:5000` | Express backend URL |
| `AUTH_SERVICE_URL` | `BACKEND_URL` | Authentication service URL |
| `SEARCH_SERVICE_URL` | `BACKEND_URL` | Search service URL |
| `SQL_SERVICE_URL` | `BACKEND_URL` | SQL service URL |
| `COMPONENT_SERVICE_URL` | `BACKEND_URL` | Component service URL |
| `FRONTEND_URL` | `http://localhost:8080` | Frontend URL for CORS |
| `GATEWAY_HOST` | `0.0.0.0` | Gateway bind host |
| `GATEWAY_PORT` | `8000` | Gateway listen port |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warning, error) |
| `DEBUG` | `false` | Debug mode (development only) |

### Frontend Integration

Set `VITE_GATEWAY_URL` to enable gateway usage:

```env
# Use gateway with fallback to direct backend
VITE_GATEWAY_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:5000/api

# Or in production
VITE_GATEWAY_URL=https://gateway.example.com
VITE_API_BASE_URL=https://backend.example.com/api
```

The frontend will automatically:
1. Attempt to use gateway if `VITE_GATEWAY_URL` is configured
2. Fall back to direct backend if gateway is unavailable
3. Cache health status to avoid excessive health checks
4. Reset cache on service recovery
5. Route auth, search, SQL, and component requests through gateway-specific paths when available

## Development

### Local Development

```bash
cd gateway
pip install -r requirements.txt
python run.py
```

Gateway will start on `http://localhost:8000` with hot reload enabled.

### Testing

```bash
cd gateway
pytest tests/
```

### Docker Development

```bash
docker-compose up
```

Services:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000`
- Gateway: `http://localhost:8000`
- pgAdmin: `http://localhost:5050`

## Production Deployment

### Render.yaml Configuration

```yaml
- type: web
  name: gateway
  runtime: python
  rootDir: gateway
  buildCommand: pip install -r requirements.txt
  startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
  healthCheckPath: /health
  envVars:
    - key: BACKEND_URL
      value: https://backend.example.com
    - key: FRONTEND_URL
      value: https://app.example.com
    - key: LOG_LEVEL
      value: info
```

### Environment Secrets

Set these in Render dashboard:
- `BACKEND_URL`: Full URL to backend service
- `FRONTEND_URL`: Full URL to frontend service

## Monitoring

### Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "gateway": "up",
  "backend": "up",
  "mongo": "up",
  "postgres": "up",
  "timestamp": "2024-04-19T10:30:00Z"
}
```

### Metrics

```bash
curl http://localhost:8000/metrics
```

Response:
```json
{
  "requests_total": 1000,
  "requests_success": 985,
  "requests_error": 15,
  "avg_response_time_ms": 45.2
}
```

## Troubleshooting

### Gateway Not Starting

1. Check Python version: `python --version` (requires 3.12+)
2. Check dependencies: `pip list | grep fastapi`
3. Check logs: Run with `--log-level debug`

### Requests Timing Out

1. Check backend health: `curl $BACKEND_URL/health`
2. Increase timeout in settings (default: 30s)
3. Check network connectivity

### CORS Errors

1. Verify `FRONTEND_URL` is in allowed origins
2. Check `Allow-Credentials` header is set
3. Verify request method is allowed

### High Error Rate

1. Check backend service status
2. Review gateway logs for specific errors
3. Check database connectivity (MongoDB, PostgreSQL)

## Design Decisions

### Why Async?
- Python async/await enables concurrent request handling
- httpx async client efficiently manages connections
- Supports scalable concurrent request forwarding

### Why Retry Logic?
- Handles transient network failures
- Improves reliability without requiring circuit breaker
- Limited to 2 retries to avoid cascading failures

### Why Optional (Not Required)?
- Allows gradual adoption
- Frontend works with or without gateway
- Reduces operational complexity during rollout
- Simplifies debugging during development

### Why Pydantic?
- Type-safe request validation
- Automatic serialization/deserialization
- Clear error messages for invalid requests
- Self-documenting via schema definitions

## Future Enhancements

- [ ] Request/response caching with TTL
- [ ] Rate limiting per IP/user
- [ ] Request tracing and correlation IDs
- [ ] Metrics export to Prometheus
- [ ] Circuit breaker pattern
- [ ] WebSocket support
- [ ] GraphQL federation
- [ ] API versioning
