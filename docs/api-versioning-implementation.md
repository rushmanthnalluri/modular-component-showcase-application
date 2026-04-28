# API Versioning Strategy Implementation

## Overview

This document outlines the API versioning implementation for the Modular Component Showcase Application. It enables backward compatibility while allowing for breaking changes and feature evolution.

## Versioning Strategy

### Current State (Pre-versioning)
- **Base URL:** `https://api.example.com/api/*`
- **All endpoints:** Unversioned
- **Status:** Deprecated (will be removed in Q4 2027)

### Target State (Post-versioning)
- **Base URL:** `https://api.example.com/api/v1/*`
- **Endpoints:** Version-specific
- **Status:** Current (supported until Q4 2029)

---

## Implementation Steps

### Step 1: Update Backend Router Structure

**File:** `backend/src/app.js`

```javascript
// BEFORE: Unversioned routes
app.use("/api", apiRouter);

// AFTER: Versioned routes with legacy support
import v1Router from "./routes/v1/index.js";
import legacyRouter from "./routes/legacy/index.js";

// Current version (recommended)
app.use("/api/v1", v1Router);

// Legacy version (deprecated, supported until June 2027)
app.use("/api", legacyRouter);

// Version 2 (placeholder for future development)
// app.use("/api/v2", v2Router);
```

### Step 2: Create Version-Specific Route Organization

**Directory Structure:**
```
backend/src/routes/
├── v1/                          # Current version
│   ├── index.js                # Route aggregator
│   ├── authRoutes.js
│   ├── componentsRoutes.js
│   ├── userRoutes.js
│   └── ...
├── v2/                          # Future version (prepare now)
│   └── index.js                # Placeholder
└── legacy/                      # Deprecated version (maps to v1)
    └── index.js                # Backward compatibility layer
```

**File:** `backend/src/routes/v1/index.js` (NEW)

```javascript
/**
 * API v1 Route Aggregator
 * Current stable API version
 */

import express from "express";
import authRoutes from "./authRoutes.js";
import componentsRoutes from "./componentsRoutes.js";
import userRoutes from "./userRoutes.js";
import mongoRoutes from "./mongoRoutes.js";
import sqlRoutes from "./sqlRoutes.js";
import vectorRoutes from "./vectorRoutes.js";
import discussionsRoutes from "./discussionsRoutes.js";
import reviewsRoutes from "./reviewsRoutes.js";
import emailRoutes from "./emailRoutes.js";
import reconciliationRoutes from "./reconciliationRoutes.js";

const router = express.Router();

// Version information middleware
router.use((req, res, next) => {
    res.set("API-Version", "1.0");
    res.set("Deprecation", "false");
    res.set("Sunset", "Fri, 01 Jun 2029 00:00:00 GMT");
    next();
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/components", componentsRoutes);
router.use("/users", userRoutes);
router.use("/mongo", mongoRoutes);
router.use("/sql", sqlRoutes);
router.use("/vector", vectorRoutes);
router.use("/discussions", discussionsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/email", emailRoutes);
router.use("/reconciliation", reconciliationRoutes);
router.use("/search", mongoRoutes);  // Alias for semantic search

// Version endpoint
router.get("/version", (req, res) => {
    return res.status(200).json({
        version: "1.0",
        status: "stable",
        released: "2025-01-01",
        sunset: "2029-06-01",
        deprecated: false,
        upgradeUrl: "https://docs.example.com/api/migration/v1-to-v2"
    });
});

export default router;
```

**File:** `backend/src/routes/legacy/index.js` (NEW)

```javascript
/**
 * Legacy API Routes (Backward Compatibility Layer)
 * Maps /api/* requests to /api/v1/* endpoints
 * 
 * Deprecated: This version will be removed on June 1, 2027
 * Migration Guide: https://docs.example.com/api/migration
 */

import express from "express";

const router = express.Router();

// Add deprecation warnings to all legacy endpoints
router.use((req, res, next) => {
    res.set("Deprecation", "true");
    res.set("Sunset", "Fri, 01 Jun 2027 00:00:00 GMT");
    res.set("Warning", '299 - "API version v1 is deprecated and will be sunset on June 1, 2027. Please migrate to /api/v1/ endpoints."');
    res.set("API-Version", "1.0-legacy");
    
    console.warn(`[DEPRECATED] ${req.method} ${req.path} - Legacy API endpoint used`);
    next();
});

// Import v1 routes
import v1Router from "../v1/index.js";

// Mount v1 routes without the /v1 prefix
router.use("/", v1Router);

// Deprecation notice endpoint
router.get("/deprecation-notice", (req, res) => {
    return res.status(200).json({
        message: "This API version is deprecated",
        status: "deprecated",
        sunset: "2027-06-01",
        migrateUrl: "https://docs.example.com/api/v1-migration-guide",
        newBaseUrl: "https://api.example.com/api/v1",
        timeline: {
            "2026-06-01": "Deprecation warning added to all requests",
            "2027-01-01": "All new features only in v1",
            "2027-06-01": "Legacy endpoints removed"
        }
    });
});

export default router;
```

### Step 3: Update Middleware for Version Awareness

**File:** `backend/src/middleware/versionMiddleware.js` (NEW)

```javascript
/**
 * API Version Middleware
 * Handles version-specific behavior and deprecated endpoints
 */

export function detectApiVersion(req, res, next) {
    // Extract version from URL
    const versionMatch = req.path.match(/^\/api\/(v\d+)\//);
    const version = versionMatch ? versionMatch[1] : "legacy";

    req.apiVersion = version;
    req.isLegacyApi = version === "legacy";

    next();
}

export function deprecationWarning(req, res, next) {
    if (req.isLegacyApi) {
        res.set("Deprecation", "true");
        res.set("Sunset", "Fri, 01 Jun 2027 00:00:00 GMT");
        res.set("Warning", '299 - "This API version is deprecated. Please use /api/v1/"');
    }
    next();
}

export function versionGuard(supportedVersions = ["v1"]) {
    return (req, res, next) => {
        if (!supportedVersions.includes(req.apiVersion)) {
            return res.status(400).json({
                error: "Unsupported API version",
                version: req.apiVersion,
                supported: supportedVersions,
                message: `API version ${req.apiVersion} is no longer supported. Please upgrade to ${supportedVersions[supportedVersions.length - 1]}`
            });
        }
        next();
    };
}
```

### Step 4: Update Client Code

**File:** `frontend/src/config/apiConfig.js` (NEW)

```javascript
/**
 * API Configuration with Version Support
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Current API version (update when changing versions)
const CURRENT_API_VERSION = "v1";

// Supported API versions in priority order
const SUPPORTED_VERSIONS = ["v1"];

// Deprecated versions (with sunset dates)
const DEPRECATED_VERSIONS = {
    "legacy": {
        deprecated: true,
        sunset: "2027-06-01",
        message: "Please migrate to v1 endpoints"
    }
};

export const apiConfig = {
    baseUrl: API_BASE_URL,
    currentVersion: CURRENT_API_VERSION,
    supportedVersions: SUPPORTED_VERSIONS,
    deprecatedVersions: DEPRECATED_VERSIONS,
    
    getVersionedUrl(endpoint, version = null) {
        const v = version || CURRENT_API_VERSION;
        return `${API_BASE_URL}/api/${v}${endpoint}`;
    },
    
    isVersionDeprecated(version) {
        return DEPRECATED_VERSIONS.hasOwnProperty(version);
    },
    
    getDeprecationWarning(version) {
        const deprecation = DEPRECATED_VERSIONS[version];
        return deprecation ? {
            deprecated: true,
            sunset: deprecation.sunset,
            message: deprecation.message
        } : null;
    }
};
```

**File:** `frontend/src/services/apiClient.js` (UPDATE)

```javascript
import { apiConfig } from '../config/apiConfig.js';

async function callApi(method, endpoint, body = null, options = {}) {
    // Use versioned endpoints
    const url = apiConfig.getVersionedUrl(endpoint);
    
    const headers = {
        "Content-Type": "application/json",
        "API-Client-Version": "1.0",
        ...options.headers
    };

    // Add CSRF token if not a safe method
    if (!SAFE_METHODS.has(method)) {
        const csrfToken = memoryCsrfToken || getCookieValue("csrf_token");
        if (csrfToken) {
            headers["x-csrf-token"] = csrfToken;
        }
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: isFormDataBody(body) ? body : JSON.stringify(body),
            credentials: "include",
            signal: options.signal
        });

        // Check for deprecation headers
        const deprecationHeader = response.headers.get("Deprecation");
        if (deprecationHeader === "true") {
            const sunset = response.headers.get("Sunset");
            console.warn(`API version is deprecated and will be removed on ${sunset}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API call failed:", error);
        throw error;
    }
}
```

---

## Documentation Updates

### File: `docs/api-reference.md` (UPDATE)

Add to top of document:

```markdown
# API Reference

## Versioning

This API uses semantic versioning with explicit version numbers in the URL.

### Current Version
- **Version:** `v1`
- **Status:** Stable
- **Base URL:** `https://api.example.com/api/v1`
- **Supported Until:** June 1, 2029

### Deprecated Versions
- **Version:** `legacy` (unversioned endpoints)
- **Status:** Deprecated
- **Base URL:** `https://api.example.com/api`
- **Sunset:** June 1, 2027
- **Migration Guide:** [Migrate to v1](./api/v1-migration-guide.md)

## Making Requests

### Current (Recommended)
```bash
curl https://api.example.com/api/v1/components
```

### Legacy (Deprecated - Do Not Use)
```bash
curl https://api.example.com/api/components
```

## Version Information Endpoint

Get current API version information:

```bash
GET /api/v1/version
```

Response:
```json
{
  "version": "1.0",
  "status": "stable",
  "released": "2025-01-01",
  "sunset": "2029-06-01",
  "deprecated": false,
  "upgradeUrl": "https://docs.example.com/api/migration/v1-to-v2"
}
```

## Deprecation Headers

Legacy endpoints return these headers:

```
Deprecation: true
Sunset: Fri, 01 Jun 2027 00:00:00 GMT
Warning: 299 - "API version v1 is deprecated..."
```

## Rate Limits

Rate limits apply per API version. Each version has independent quotas:

| Endpoint | v1 Limit | Legacy Limit |
|---|---|---|
| Global | 500 req/15min | 500 req/15min |
| Auth | 50 req/15min | 50 req/15min |
| Components Write | 80 req/15min | 80 req/15min |

## Error Responses

Version-related errors:

```json
{
  "error": "Unsupported API version",
  "version": "v2",
  "supported": ["v1"],
  "message": "API version v2 is no longer supported. Please upgrade to v1"
}
```
```

### File: `docs/api/v1-migration-guide.md` (NEW)

```markdown
# Migration Guide: Legacy API → v1

## Overview

The Modular Component Showcase API has introduced versioning to support better backward compatibility while enabling new features.

## Timeline

- **Now:** Start migration to v1
- **June 1, 2027:** Legacy endpoints stop accepting requests
- **June 1, 2029:** v1 support ends (v2 planned)

## Migration Steps

### 1. Update Base URL

**Before:**
```javascript
const BASE_URL = "https://api.example.com/api";
fetch(`${BASE_URL}/components`);
```

**After:**
```javascript
const BASE_URL = "https://api.example.com/api/v1";
fetch(`${BASE_URL}/components`);
```

### 2. Update All Endpoints

Replace all `/api/` calls with `/api/v1/`:

```bash
# Before
curl https://api.example.com/api/components

# After
curl https://api.example.com/api/v1/components
```

### 3. Check Response Headers

Verify no deprecation warnings:

```bash
curl -i https://api.example.com/api/v1/components
# Should NOT include: Deprecation: true
# Should include: API-Version: 1.0
```

### 4. Update Your Code

#### Node.js/JavaScript
```javascript
// Update API client configuration
const apiClient = new ApiClient({
    baseUrl: "https://api.example.com/api/v1"  // Add /v1
});
```

#### Python
```python
# Update requests URL
response = requests.get(
    "https://api.example.com/api/v1/components"  # Add /v1
)
```

#### cURL
```bash
# Update all script calls
curl https://api.example.com/api/v1/components
```

## What's Changed

**No breaking changes in v1.** All endpoint signatures, request/response formats are identical between legacy and v1.

## Breaking Changes (Future)

When v2 is released, there may be:
- Changed response formats
- Removed deprecated endpoints
- New required parameters
- Different authentication scheme

See [v1 to v2 Migration Guide](./v1-to-v2-migration.md) when available.

## Support

- **Migration Issues:** support@example.com
- **Documentation:** https://docs.example.com/api
- **Status:** https://status.example.com
```

---

## Monitoring & Compliance

### File: `backend/src/monitoring/versionTracking.js` (NEW)

```javascript
/**
 * Tracks API version usage for deprecation planning
 */

const versionUsageMetrics = {
    "v1": { requests: 0, lastUsed: null },
    "legacy": { requests: 0, lastUsed: null }
};

export function trackVersionUsage(version) {
    if (versionUsageMetrics[version]) {
        versionUsageMetrics[version].requests++;
        versionUsageMetrics[version].lastUsed = new Date();
    }
}

export function getVersionMetrics() {
    return {
        timestamp: new Date(),
        metrics: versionUsageMetrics,
        totalRequests: Object.values(versionUsageMetrics).reduce((sum, m) => sum + m.requests, 0),
        legacyPercentage: (versionUsageMetrics.legacy.requests / (versionUsageMetrics.v1.requests + versionUsageMetrics.legacy.requests) * 100).toFixed(2) + "%"
    };
}

// Expose metrics endpoint
router.get("/api/admin/version-metrics", (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(getVersionMetrics());
});
```

---

## Deployment Checklist

- [ ] Create v1 route directory
- [ ] Create legacy compatibility layer
- [ ] Update app.js to register both routers
- [ ] Add version middleware
- [ ] Update documentation
- [ ] Update client configuration
- [ ] Test all endpoints on both /api and /api/v1
- [ ] Verify deprecation headers on legacy
- [ ] Deploy to staging
- [ ] Announce deprecation timeline
- [ ] Monitor version usage metrics
- [ ] Plan v2 development

---

## Future: Preparing for v2

**File:** `backend/src/routes/v2/index.js` (PLACEHOLDER)

```javascript
/**
 * API v2 (Placeholder for Future Development)
 * 
 * Planned breaking changes:
 * - Unified response envelope (v2Response { data, meta })
 * - ISO8601 timestamps everywhere
 * - Pagination standardization
 * - New authentication scheme (OAuth 2.0)
 * 
 * Estimated Release: Q1 2028
 */

import express from "express";

const router = express.Router();

router.get("/version", (req, res) => {
    return res.json({
        version: "2.0",
        status: "in-development",
        estimatedRelease: "2028-Q1",
        breakingChanges: [
            "Response envelope structure changed",
            "Timestamps now ISO8601 format",
            "Pagination parameters standardized",
            "OAuth 2.0 authentication required"
        ]
    });
});

export default router;
```

---

## Summary

This implementation provides:
- ✅ Clear versioning strategy
- ✅ Backward compatibility during transition
- ✅ Automatic deprecation warnings
- ✅ Documentation for migration
- ✅ Metrics for tracking adoption
- ✅ Foundation for future versions

The legacy API will continue working until June 1, 2027, giving clients 2 years to migrate.
