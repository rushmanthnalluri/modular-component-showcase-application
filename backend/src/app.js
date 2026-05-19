import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { rateLimit } from "express-rate-limit";
import { MongoMemoryServer } from "mongodb-memory-server";
import captchaRouter from "./controllers/captchaController.js";
import { sendEmail, sendAnnouncementEmail } from "./models/emailManager.js";
import {
    User,
    Component,
    Rating,
    Review,
    Discussion,
    ComponentView,
    ComponentDependency,
    SubmissionHistory,
    ComponentDescription,
    ComponentEmbedding,
    UsageLog,
    createMongoRouter,
    getMongoLogs,
    semanticSearch,
    upsertMongoEmbedding,
    connectMongoWithSrvFallback,
} from "./mongodb/index.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createCsrfMiddleware } from "./middleware/csrf.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createComponentsRouter } from "./routes/componentsRoutes.js";
import { createEmailRouter } from "./routes/emailRoutes.js";
import { createDiscussionsRouter } from "./routes/discussionsRoutes.js";
import { createReviewsRouter } from "./routes/reviewsRoutes.js";
import { createUserRouter } from "./routes/userRoutes.js";
import { createVectorRouter } from "./routes/vectorRoutes.js";
import { createReconciliationRouter } from "./routes/reconciliationRoutes.js";
import {
    createSqlRouter,
    initializeSqlSchema,
    hasSqlConnectionConfig,
    pingSql,
    syncSqlDiscussion,
    syncSqlRating,
    syncSqlReview,
    syncSqlUserAccount,
    syncSqlUserFavorites,
} from "./neondb/index.js";
import logger, { withRequestContext } from "./utils/logger.js";
import { mapAvatarUploadError } from "./middleware/avatarUpload.js";
import { buildError, buildSuccess, sendError } from "./utils/responseHelper.js";
import { idempotencyService } from "./services/idempotencyService.js";
import { startAuditEventConsumer, stopAuditEventConsumer } from "./consumers/auditEventConsumer.js";

const app = express();
const apiRouter = express.Router();
let mongoMode = "disconnected";
let memoryServer = null;
let httpServer = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let isShuttingDown = false;
let resolvedMongoUri = null;

const isProduction = process.env.NODE_ENV === "production";
const allowMemoryFallback =
    !isProduction &&
    (typeof process.env.ALLOW_MEMORY_FALLBACK === "string"
        ? process.env.ALLOW_MEMORY_FALLBACK !== "false"
        : true);
const jwtSecret = process.env.JWT_SECRET || randomBytes(48).toString("hex");
const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";
const mongoUri = process.env.NODE_ENV === "test" && !process.env.MONGODB_URI ? "" : process.env.MONGODB_URI;
const avatarUploadDir = path.resolve(process.env.AVATAR_UPLOAD_DIR || path.join(process.cwd(), "uploads", "avatars"));

process.env.AVATAR_UPLOAD_DIR = avatarUploadDir;
fs.mkdirSync(avatarUploadDir, { recursive: true });

if (process.env.JWT_SECRET && Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    const message = "JWT_SECRET must be at least 32 UTF-8 bytes.";
    if (isProduction) {
        throw new Error(message);
    }
    logger.warn(message);
}

const mongoConnectOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
};

const execFileAsync = (file, args, options) =>
    new Promise((resolve, reject) => {
        execFile(file, args, options, (error, stdout, stderr) => {
            if (error) {
                reject(Object.assign(error, { stdout, stderr }));
                return;
            }

            resolve({ stdout, stderr });
        });
    });

const shouldSeedShowcaseOnStart =
    isProduction || String(process.env.SEED_SHOWCASE_ON_START || "").toLowerCase() === "true";

function normalizeOriginValue(value) {
    const trimmedValue = String(value || "").trim();
    if (!trimmedValue) {
        return "";
    }

    try {
        return new URL(trimmedValue).origin;
    } catch {
        return trimmedValue.replace(/\/+$/, "");
    }
}

const defaultLocalOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173"
];
const defaultProductionOrigins = [
    "https://rushmanthnalluri.github.io",
    "https://modular-component-showcase-frontend.onrender.com",
];
const allowedOrigins = Array.from(new Set([
    ...(isProduction ? defaultProductionOrigins : defaultLocalOrigins),
    ...String(process.env.FRONTEND_ORIGINS || "")
        .split(",")
        .map((origin) => normalizeOriginValue(origin))
        .filter(Boolean),
].map((origin) => normalizeOriginValue(origin)).filter(Boolean)));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Please try again later." },
});

const supportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 429, msg: "Too many support requests. Please try again later." },
});

const componentWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many component write requests. Please try again later." },
});

const rateLimitTracker = {
    totals: {
        all: 0,
        auth: 0,
        componentsWrite: 0,
        support: 0,
    },
    blocked: {
        all: 0,
        auth: 0,
        componentsWrite: 0,
        support: 0,
    },
};

const metricsTracker = {
    startedAt: Date.now(),
    requestsTotal: 0,
    responsesTotal: 0,
    errorsTotal: 0,
};

function createAccessToken(userId) {
    return jwt.sign({ userId, tokenType: "access" }, jwtSecret, { expiresIn: accessTokenExpiresIn });
}

function createRefreshToken(userId) {
    return jwt.sign({ userId, tokenType: "refresh" }, jwtSecret, { expiresIn: refreshTokenExpiresIn });
}

function verifyRefreshToken(token) {
    const payload = jwt.verify(token, jwtSecret);
    if (!payload?.userId || payload?.tokenType !== "refresh") {
        throw new Error("Invalid refresh token payload");
    }

    return payload;
}

const { ensureCsrfCookie, readCsrfToken, requireCsrf } = createCsrfMiddleware({ isProduction });
const { requireAuth, requireDeveloper, issueAuthCookies, clearAuthCookies, readRefreshToken } = createAuthMiddleware({
    User,
    jwtSecret,
    isProduction,
});

app.set("trust proxy", 1);
app.use(
    cors({
        origin: (origin, callback) => {
            const normalizedOrigin = normalizeOriginValue(origin);
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
                callback(null, true);
                return;
            }

            callback(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
    })
);
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);
app.use((req, res, next) => {
    req.id = req.headers["x-request-id"] || randomUUID();
    res.setHeader("x-request-id", req.id);
    next();
});
app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
        const durationMs = Date.now() - startedAt;
        const context = withRequestContext(req);
        logger.info("request_completed", {
            ...context,
            statusCode: res.statusCode,
            durationMs,
        });
    });
    next();
});
app.use(globalLimiter);
app.use((req, res, next) => {
    const path = String(req.path || "").toLowerCase();
    const isAuth = path.startsWith("/api/auth");
    const isComponentWrite = path.startsWith("/api/components") && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const isSupport = path.startsWith("/api/email");

    rateLimitTracker.totals.all += 1;
    if (isAuth) rateLimitTracker.totals.auth += 1;
    if (isComponentWrite) rateLimitTracker.totals.componentsWrite += 1;
    if (isSupport) rateLimitTracker.totals.support += 1;

    res.on("finish", () => {
        metricsTracker.responsesTotal += 1;
        if (res.statusCode >= 500) {
            metricsTracker.errorsTotal += 1;
        }
        if (res.statusCode !== 429) {
            return;
        }
        rateLimitTracker.blocked.all += 1;
        if (isAuth) rateLimitTracker.blocked.auth += 1;
        if (isComponentWrite) rateLimitTracker.blocked.componentsWrite += 1;
        if (isSupport) rateLimitTracker.blocked.support += 1;
    });

    next();
});
app.use((_req, _res, next) => {
    metricsTracker.requestsTotal += 1;
    next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb", parameterLimit: 100 }));
app.use("/app/uploads/avatars", express.static(avatarUploadDir));
app.use("/uploads/avatars", express.static(avatarUploadDir));

apiRouter.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (payload) => {
        if (payload && typeof payload === "object" && "success" in payload) {
            return originalJson(payload);
        }

        if (res.statusCode >= 400) {
            return originalJson(buildError(
                res.statusCode === 400 ? "VALIDATION_ERROR" :
                    res.statusCode === 401 ? "UNAUTHORIZED" :
                    res.statusCode === 404 ? "NOT_FOUND" :
                    res.statusCode === 422 ? "UNPROCESSABLE_ENTITY" :
                    "INTERNAL_ERROR",
                payload?.message || payload?.msg || "Request failed.",
                payload?.details
            ));
        }

        return originalJson(buildSuccess(payload));
    };
    next();
});

app.get("/", (_req, res) => {
    res.json(buildSuccess({ message: "Modular Component Showcase API is running." }));
});

app.get("/health", async (_req, res) => {
    const [mongo, postgres] = await Promise.all([
        Promise.resolve(mongoose.connection.readyState === 1),
        pingSql(),
    ]);

    res.json(buildSuccess({
        status: "ok",
        mongo,
        postgres,
        mode: mongoMode,
        uptimeSeconds: Math.max(0, (Date.now() - metricsTracker.startedAt) / 1000),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "unknown",
    }));
});

app.get("/metrics", (_req, res) => {
    const uptimeSeconds = Math.max(0, (Date.now() - metricsTracker.startedAt) / 1000);
    const lines = [
        "# HELP app_requests_total Total HTTP requests received by the Node backend.",
        "# TYPE app_requests_total counter",
        `app_requests_total ${metricsTracker.requestsTotal}`,
        "# HELP app_responses_total Total HTTP responses sent by the Node backend.",
        "# TYPE app_responses_total counter",
        `app_responses_total ${metricsTracker.responsesTotal}`,
        "# HELP app_errors_total Total HTTP 5xx responses sent by the Node backend.",
        "# TYPE app_errors_total counter",
        `app_errors_total ${metricsTracker.errorsTotal}`,
        "# HELP app_rate_limited_total Total HTTP 429 responses sent by the Node backend.",
        "# TYPE app_rate_limited_total counter",
        `app_rate_limited_total ${rateLimitTracker.blocked.all}`,
        "# HELP app_uptime_seconds Backend uptime in seconds.",
        "# TYPE app_uptime_seconds gauge",
        `app_uptime_seconds ${uptimeSeconds.toFixed(2)}`,
    ];

    res.type("text/plain; version=0.0.4").send(`${lines.join("\n")}\n`);
});

apiRouter.use(cookieParser());
apiRouter.use(ensureCsrfCookie);
apiRouter.use(requireCsrf);
apiRouter.use("/captcha", captchaRouter);

apiRouter.get("/", (_req, res) => {
    res.json(buildSuccess({
        message: "Modular Component Showcase API",
        status: "running",
        endpoints: {
            health: "GET /health",
            auth: "POST /api/auth/login, /api/auth/register, /api/auth/logout",
            components: "GET/POST /api/components, GET /api/components/:id, PUT/DELETE /api/components/:id",
            users: "GET /api/users/:id, PUT /api/users/:id",
            email: "POST /api/email/contact, /api/email/support",
            sql: "GET/POST /api/sql/components",
            search: "POST /api/search",
            admin: "GET /api/admin/rate-limits (admin)",
        },
    }));
});

apiRouter.use(
    "/auth",
    authLimiter,
    createAuthRouter({
        User,
        createAccessToken,
        createRefreshToken,
        verifyRefreshToken,
        issueAuthCookies,
        clearAuthCookies,
        readRefreshToken,
        readCsrfToken,
        requireCsrf,
        sendEmail,
        logger,
        syncSqlUserAccount,
    })
);
apiRouter.use(
    "/components",
    createComponentsRouter({
        Component,
        Rating,
        Review,
        Discussion,
        ComponentView,
        ComponentDependency,
        SubmissionHistory,
        User,
        sendAnnouncementEmail,
        writeLimiter: componentWriteLimiter,
        requireAuth,
        requireDeveloper,
        requireCsrf,
        syncSqlRating,
        syncSqlReview,
        syncSqlDiscussion,
        syncSqlUserAccount,
    })
);
apiRouter.use(
    "/email",
    requireCsrf,
    createEmailRouter({
        sendEmail,
        supportLimiter,
    })
);

apiRouter.use(
    "/users",
    createUserRouter({
        User,
        Component,
        SubmissionHistory,
        requireAuth,
        requireCsrf,
        syncSqlUserAccount,
        syncSqlUserFavorites,
    })
);

apiRouter.use(
    "/vector",
    createVectorRouter({
        Component,
        ComponentEmbedding,
        UsageLog,
        requireAuth,
        idempotencyService,
    })
);

apiRouter.use(
    "/reconciliation",
    createReconciliationRouter({
        User,
        requireAuth,
    })
);

apiRouter.use("/sql", createSqlRouter());
apiRouter.use(
    "/reviews",
    createReviewsRouter({
        Review,
        Component,
        User,
        requireAuth,
        requireCsrf,
        syncSqlReview,
        syncSqlUserAccount,
    })
);
apiRouter.use(
    "/discussions",
    createDiscussionsRouter({
        Discussion,
        Component,
        User,
        requireAuth,
        requireCsrf,
        syncSqlDiscussion,
        syncSqlUserAccount,
    })
);

const mongoDeps = {
    ComponentDescription,
    ComponentEmbedding,
    Component,
    UsageLog,
};

apiRouter.use(
    "/mongo",
    createMongoRouter(mongoDeps)
);

apiRouter.post("/search", (req, res) => semanticSearch(req, res, mongoDeps));
apiRouter.get("/search", (req, res) => semanticSearch(req, res, mongoDeps));
apiRouter.post("/embeddings", (req, res) => upsertMongoEmbedding(req, res, mongoDeps));
apiRouter.post("/embeddings/upsert", (req, res) => upsertMongoEmbedding(req, res, mongoDeps));
apiRouter.get("/logs", (req, res) => getMongoLogs(req, res, mongoDeps));

apiRouter.get("/admin/rate-limits", requireAuth, async (req, res) => {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }

    return res.json({
        trackedAt: new Date().toISOString(),
        requests: rateLimitTracker.totals,
        blocked: rateLimitTracker.blocked,
    });
});

apiRouter.get("/admin/dashboard", requireAuth, async (req, res) => {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }

    try {
        const [users, components, reviews, discussions] = await Promise.all([
            User.countDocuments(),
            Component.countDocuments(),
            Review.countDocuments(),
            Discussion.countDocuments(),
        ]);

        const [mostViewed, topRated] = await Promise.all([
            Component.find()
                .sort({ views: -1, createdAt: -1 })
                .limit(5)
                .select("id name views averageRating category")
                .lean(),
            Component.find()
                .sort({ averageRating: -1, ratingsCount: -1, createdAt: -1 })
                .limit(5)
                .select("id name averageRating ratingsCount category")
                .lean(),
        ]);

        return res.json({
            trackedAt: new Date().toISOString(),
            counts: {
                users,
                components,
                reviews,
                discussions,
            },
            mostViewed,
            topRated,
            rateLimits: {
                requests: rateLimitTracker.totals,
                blocked: rateLimitTracker.blocked,
            },
        });
    } catch (error) {
        logger.error("admin_dashboard_failed", { error: error.message });
        return res.status(500).json({ message: "Unable to fetch dashboard data." });
    }
});

app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
    if (String(err?.message || "").includes("CORS")) {
        return sendError(res, "FORBIDDEN", "CORS blocked for this origin.", 403);
    }

    if (err?.type === "entity.too.large") {
        return sendError(res, "PAYLOAD_TOO_LARGE", "Request payload too large.", 413);
    }

    const avatarUploadError = mapAvatarUploadError(err);
    if (avatarUploadError) {
        return sendError(res, "VALIDATION_ERROR", avatarUploadError.message, avatarUploadError.status);
    }

    logger.error("unhandled_server_error", {
        error: err?.message || String(err),
        stack: err?.stack,
    });
    return sendError(res, "INTERNAL_ERROR", "Server error.", 500);
});

if (!process.env.JWT_SECRET) {
    logger.warn("JWT_SECRET is not set. Using an auto-generated runtime secret; tokens will reset on restart.");
}

if (isProduction && process.env.ALLOW_MEMORY_FALLBACK === "true") {
    logger.warn("ALLOW_MEMORY_FALLBACK is ignored in production. Configure MONGODB_URI for persistent data.");
}

function assertProductionConfig() {
    if (isProduction && allowedOrigins.length === 0) {
        throw new Error("FRONTEND_ORIGINS must be configured in production.");
    }

    if (!isProduction) {
        return;
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET must be configured in production.");
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI must be configured in production.");
    }

    if (!process.env.DATABASE_URL && !hasSqlConnectionConfig()) {
        throw new Error("DATABASE_URL (or PG* connection variables) must be configured in production.");
    }
}

function clearReconnectTimer() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function scheduleAtlasReconnect() {
    if (
        isShuttingDown ||
        process.env.NODE_ENV === "test" ||
        !mongoUri ||
        mongoMode === "memory" ||
        mongoMode === "memory-bootstrap" ||
        reconnectTimer
    ) {
        return;
    }

    reconnectAttempt += 1;
    const delayMs = Math.min(30000, 1000 * 2 ** Math.min(reconnectAttempt, 5));
    mongoMode = "atlas-reconnecting";

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;

        try {
            logger.warn(`MongoDB reconnect attempt ${reconnectAttempt}...`);
            await connectToAtlas();
            reconnectAttempt = 0;
            mongoMode = "atlas";
            logger.info("MongoDB Atlas reconnected");
        } catch (error) {
            logger.error("MongoDB reconnect failed", { error: error.message });
            scheduleAtlasReconnect();
        }
    }, delayMs);
}

mongoose.connection.on("connected", () => {
    clearReconnectTimer();
    reconnectAttempt = 0;
    if (mongoMode !== "memory") {
        mongoMode = "atlas";
    }
});

mongoose.connection.on("disconnected", () => {
    if (
        !isShuttingDown &&
        process.env.NODE_ENV !== "test" &&
        mongoMode !== "memory" &&
        mongoMode !== "memory-bootstrap"
    ) {
        logger.warn("MongoDB disconnected");
        scheduleAtlasReconnect();
    }
});

mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", { error: error.message });
});

async function connectToAtlas() {
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not configured.");
    }

    if (resolvedMongoUri && resolvedMongoUri !== mongoUri) {
        try {
            await mongoose.connect(resolvedMongoUri, mongoConnectOptions);
            return;
        } catch {
            resolvedMongoUri = null;
            logger.warn("Cached MongoDB direct-host URI failed. Re-resolving Atlas SRV record.");
        }
    }

    // Skip pre-expansion - let connectMongoWithSrvFallback handle SRV expansion with fallback
    const connectionResult = await connectMongoWithSrvFallback({
        mongoUri,
        connect: (uri, options) => mongoose.connect(uri, options),
        connectOptions: mongoConnectOptions,
    });

    resolvedMongoUri = connectionResult.connectionUri;

    if (connectionResult.usedSrvFallback) {
        logger.warn("MongoDB SRV lookup failed. Connected using direct Atlas hosts resolved via DNS-over-HTTPS.");
    }
}

export async function connectWithFallback() {
    if (!mongoUri) {
        if (!allowMemoryFallback) {
            throw new Error("MONGODB_URI is required when memory fallback is disabled.");
        }

        logger.warn("MONGODB_URI is not set. Falling back to in-memory MongoDB.");
    }

    try {
        if (mongoUri) {
            await connectToAtlas();
            mongoMode = "atlas";
            logger.info("MongoDB Atlas connected");
            return;
        }
    } catch (atlasError) {
        logger.error("MongoDB Atlas connection failed", { error: atlasError.message });

        if (!allowMemoryFallback) {
            throw atlasError;
        }
    }

    try {
        clearReconnectTimer();
        mongoMode = "memory-bootstrap";

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri("modularcomponent");
        mongoMode = "memory";
        await mongoose.connect(memoryUri, mongoConnectOptions);
        logger.info("MongoDB memory fallback connected");

        await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
        await Component.collection.createIndex({ id: 1 }, { unique: true });
    } catch (memoryError) {
        logger.error("MongoDB memory fallback failed", { error: memoryError.message });
        throw memoryError;
    }
}

export async function startServer() {
    isShuttingDown = false;
    assertProductionConfig();
    startAuditEventConsumer();
    await connectWithFallback();

    if (process.env.SQL_AUTO_MIGRATE !== "false") {
        if (hasSqlConnectionConfig()) {
            try {
                await initializeSqlSchema();
            } catch (error) {
                logger.warn(`Skipping PostgreSQL schema initialization: ${error.message}`);
            }
        } else {
            logger.warn("Skipping PostgreSQL schema initialization: no SQL connection is configured.");
        }
    }

    if (shouldSeedShowcaseOnStart) {
        try {
            await execFileAsync(process.execPath, ["src/scripts/seedShowcaseComponents.js"], {
                cwd: process.cwd(),
                env: process.env,
                maxBuffer: 10 * 1024 * 1024,
                timeout: 120_000,
                killSignal: "SIGTERM",
            });
            logger.info("Showcase seed completed on startup.");
        } catch (error) {
            logger.warn(`Skipping startup showcase seed: ${error.message}`);
        }
    }

    await new Promise((resolve, reject) => {
        httpServer = app.listen(PORT, HOST, () => {
            logger.info(`Server is running on http://${HOST}:${PORT}`);
            resolve();
        });

        httpServer.on("error", reject);
    });

    return httpServer;
}

export async function shutdownServer() {
    isShuttingDown = true;
    clearReconnectTimer();
    stopAuditEventConsumer();

    if (httpServer) {
        await new Promise((resolve, reject) => {
            httpServer.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
        httpServer = null;
    }

    if (memoryServer) {
        await memoryServer.stop();
        memoryServer = null;
    }

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}

if (process.env.NODE_ENV !== "test") {
    startServer().catch((error) => {
        logger.error("Failed to start server", { error: error.message });
        process.exit(1);
    });

    process.on("SIGINT", async () => {
        await shutdownServer();
        process.exit(0);
    });

    process.on("SIGTERM", async () => {
        await shutdownServer();
        process.exit(0);
    });
}

export { app };
