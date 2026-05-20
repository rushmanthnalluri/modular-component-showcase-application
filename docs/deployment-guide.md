# Deployment Guide

This guide covers deploying the Modular Component Showcase to production using Render.

## Pre-Deployment Checklist

- [ ] All tests passing: `npm run lint && npm run test && npm --prefix backend run test`
- [ ] Build succeeds: `npm run build`
- [ ] Docker builds: `docker-compose build`
- [ ] `.env` files created from `.env.example` templates
- [ ] Secrets configured in Render dashboard
- [ ] Database URLs verified (MongoDB Atlas, PostgreSQL)
- [ ] JWT secret generated securely
- [ ] CORS origins list updated
- [ ] SSL certificates ready

## Render Deployment

### Step 1: Create Render Services

1. Go to https://dashboard.render.com
2. Create 3 web services:
   - Frontend (static)
   - Backend (Node)
   - Gateway (Python) - optional

### Step 2: Configure Frontend

```
Service Name: modular-component-showcase-frontend
Environment: Static Site
Runtime: Node 20
Build Command: npm install && npm run build
Publish Directory: dist
```

**Environment Variables:**
```
NODE_VERSION=20
VITE_API_BASE_URL=https://modular-component-showcase-gateway.onrender.com
VITE_GATEWAY_URL=https://modular-component-showcase-gateway.onrender.com
VITE_APP_NAME=Modular Component Showcase
```

### Step 3: Configure Backend

```
Service Name: modular-component-showcase-backend
Environment: Node
Runtime: Node 20
Build Command: npm install
Start Command: npm start
Root Directory: backend
Health Check Path: /health
```

**Environment Variables:**
```
NODE_VERSION=20
NODE_ENV=production
PORT=5000
PGSSL=true
SQL_AUTO_MIGRATE=false
ALLOW_MEMORY_FALLBACK=false
FRONTEND_ORIGINS=https://your-frontend.onrender.com,https://your-gateway.onrender.com
```

**Environment Secrets (set in Render dashboard):**
- `MONGODB_URI`: MongoDB Atlas connection string
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Step 4: Configure Gateway (Optional)

```
Service Name: modular-component-showcase-gateway
Environment: Python
Runtime: Python 3.12
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Root Directory: gateway
Health Check Path: /health
```

**Environment Variables:**
```
PYTHON_VERSION=3.12
PORT=8000
BACKEND_URL=https://your-backend.onrender.com
AUTH_SERVICE_URL=https://your-backend.onrender.com
SEARCH_SERVICE_URL=https://your-backend.onrender.com
SQL_SERVICE_URL=https://your-backend.onrender.com
COMPONENT_SERVICE_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
LOG_LEVEL=warning
DEBUG=false
```

**Environment Secrets:**
- `BACKEND_URL`: Full URL to your backend service
- `FRONTEND_URL`: Full URL to your frontend service

## Database Setup

### MongoDB Atlas

1. Create cluster at https://www.mongodb.com/cloud/atlas
2. Create database user with strong password
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/modular_components`
4. Add IP whitelist: 0.0.0.0/0 (or specific Render IP)
5. Set as `MONGODB_URI` in Render dashboard

### PostgreSQL

You have two options:

#### Option A: Render Postgres (Recommended for this scale)

1. Create Postgres instance in Render
2. Copy connection string from Render dashboard
3. Create database `modular_components` if needed
4. Set as `DATABASE_URL` in Render dashboard
5. Run migrations on first backend deployment

#### Option B: External PostgreSQL

1. Create database on external provider (e.g., Railway, Azure)
2. Whitelist Render IP ranges
3. Get connection string
4. Set as `DATABASE_URL` in Render dashboard

### Initial Data

On first deployment, the backend will:

1. Auto-migrate PostgreSQL schema (if `SQL_AUTO_MIGRATE=true`)
2. Run initial seed data if present

To seed showcase components:

```bash
cd backend
npm install
MONGODB_URI=<your-atlas-uri> node src/scripts/seedShowcaseComponents.js
MONGODB_URI=<your-atlas-uri> node src/scripts/seedComponentEmbeddings.js
```

## Deployment Steps

### 1. Push Code to Repository

```bash
git add -A
git commit -m "Production deployment"
git push origin main
```

### 2. Trigger Builds

Render automatically builds on push if connected to GitHub.

Or manually trigger builds in Render dashboard:

1. Go to each service
2. Click "Manual Deploy"
3. Select "Clear build cache and deploy"

### 3. Monitor Deployment

1. Check build logs in Render dashboard
2. Verify health checks passing:
   - Frontend: `/` returns HTML
   - Backend: `/health` returns 200
   - Gateway: `/health` returns health status
3. Test API endpoints manually

### 4. Verify Production

```bash
# Check backend health
curl https://your-backend.onrender.com/health

# Check gateway health
curl https://your-gateway.onrender.com/health

# Test API endpoint
curl https://your-backend.onrender.com/api/components

# Check CORS headers
curl -i https://your-backend.onrender.com/api/components
```

## Post-Deployment

### 1. Update DNS (if custom domain)

1. Add CNAME record to your domain pointing to Render service
2. Wait for DNS propagation (5-60 minutes)
3. Enable SSL in Render dashboard

### 2. Test Frontend

1. Visit https://your-frontend.onrender.com
2. Check browser console for errors
3. Test signup/login flow
4. Test search functionality
5. Test favorites, reviews, discussions
6. Test SQL admin page

### 3. Monitor Production

1. Enable error tracking in Render dashboard
2. Set up logging alerts
3. Monitor database connection pool
4. Watch for memory leaks

### 4. Update Documentation

1. Update live URLs in README
2. Document any configuration-specific notes
3. Add runbook for common issues

## Troubleshooting Deployment

### Build Failures

**"npm: command not found"**
- Check Node version in Render: should be 20.x
- Ensure package.json is in correct root directory
- Try clearing build cache and redeploying

**"pip: command not found"**
- Check Python version: should be 3.12
- Ensure requirements.txt exists in gateway/
- Check working directory

### Runtime Errors

**"Cannot connect to MongoDB"**
- Verify `MONGODB_URI` is set and valid
- Check MongoDB Atlas whitelist includes Render IPs
- Test connection locally with same URI
- Check database exists

**"Cannot connect to PostgreSQL"**
- Verify `DATABASE_URL` is set and valid
- Check database exists and user has permissions
- Ensure PGSSL setting matches database requirements
- Test connection with `psql` command-line tool

**"CORS error"**
- Check `FRONTEND_ORIGINS` includes your frontend URL
- Verify protocol (http vs https) matches exactly
- Restart backend after updating environment variables
- Check gateway configuration if using gateway

**"Health check failing"**
- Check logs in Render dashboard for errors
- Verify databases are accessible from Render
- Increase health check timeout if services are slow
- Check for port binding issues

### Performance Issues

**High memory usage**
- Check for connection leaks in database services
- Enable connection pooling if available
- Monitor request patterns for unusual load

**Slow API responses**
- Check MongoDB indexes are created
- Verify PostgreSQL queries are optimized
- Monitor network latency between services
- Check database connection pool size

## Rollback Procedure

If deployment is problematic:

1. Go to Render dashboard
2. Select affected service
3. Go to "Deploys" tab
4. Select previous successful deploy
5. Click "Redeploy"

Previous version will be restored immediately.

## CI/CD Pipeline

### GitHub Actions (Optional)

Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm run test && npm --prefix backend run test
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        run: |
          curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
```

## Security Checklist

- [ ] `JWT_SECRET` is strong and unique
- [ ] Database passwords are strong and unique
- [ ] `ALLOW_MEMORY_FALLBACK` is false
- [ ] `NODE_ENV` is "production"
- [ ] `PGSSL` is true
- [ ] `FRONTEND_ORIGINS` lists only valid origins
- [ ] No hardcoded secrets in code
- [ ] No debug mode enabled
- [ ] Rate limiting is enabled
- [ ] HELMET security headers are configured
- [ ] Regular security updates scheduled

## Scaling Considerations

As traffic grows:

1. **Database**: Upgrade MongoDB/PostgreSQL tier
2. **Backend**: Use Render's auto-scaling (if available)
3. **Gateway**: Add caching layer for frequent requests
4. **CDN**: Use Cloudflare or Render's CDN for static assets
5. **Monitoring**: Set up error tracking (Sentry, LogRocket)

## Support

For issues:

1. Check Render documentation: https://render.com/docs
2. Check application logs in Render dashboard
3. Test locally to reproduce issues
4. Verify environment variables and secrets
5. Check database connectivity and permissions
