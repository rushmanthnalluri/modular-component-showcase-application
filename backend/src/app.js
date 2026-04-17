import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
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
    BlogPost,
    ComponentDescription,
    ComponentEmbedding,
    UsageLog,
} from "./models/appModels.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createCsrfMiddleware } from "./middleware/csrf.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createComponentsRouter } from "./routes/componentsRoutes.js";
import { createEmailRouter } from "./routes/emailRoutes.js";
import { createDiscussionsRouter } from "./routes/discussionsRoutes.js";
import {
    createMongoRouter,
    getMongoLogs,
    semanticSearch,
    upsertMongoEmbedding,
} from "./routes/mongoRoutes.js";
import { createReviewsRouter } from "./routes/reviewsRoutes.js";
import { createSqlRouter } from "./routes/sqlRoutes.js";
import { createUserRouter } from "./routes/userRoutes.js";
import { initializeSqlSchema } from "./sql/initSchema.js";
import { hasSqlConnectionConfig, pingSql } from "./sql/db.js";
import { syncSqlDiscussion, syncSqlRating, syncSqlReview, syncSqlUserAccount, syncSqlUserFavorites } from "./services/userSyncService.js";
import { connectMongoWithSrvFallback, expandMongoSrvUri, isMongoSrvUri } from "./utils/mongoSrvFallback.js";

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
const PORT = Number(process.env.PORT || 5000);
const mongoUri = process.env.NODE_ENV === "test" ? "" : process.env.MONGODB_URI;

const mongoConnectOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
};

const defaultLocalOrigins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:4173"
];
const defaultProductionOrigins = ["https://rushmanthnalluri.github.io"];
const allowedOrigins = Array.from(new Set([
    ...(isProduction ? defaultProductionOrigins : defaultLocalOrigins),
    ...String(process.env.FRONTEND_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
]));

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

function createAuthToken(userId) {
    return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
}

const { ensureCsrfCookie, readCsrfToken, requireCsrf } = createCsrfMiddleware({ isProduction });
const { requireAuth, requireDeveloper, issueAuthCookie, clearAuthCookie } = createAuthMiddleware({
    User,
    jwtSecret,
    isProduction,
});

app.set("trust proxy", 1);
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
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
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
    res.json({ message: "Modular Component Showcase API is running." });
});

app.get("/health", async (_req, res) => {
    const [mongo, postgres] = await Promise.all([
        Promise.resolve(mongoose.connection.readyState === 1),
        pingSql(),
    ]);

    res.json({
        status: "ok",
        mongo,
        postgres,
        mode: mongoMode,
    });
});

app.use("/captcha", captchaRouter);
apiRouter.use(cookieParser());
apiRouter.use(ensureCsrfCookie);
apiRouter.use(requireCsrf);
apiRouter.use("/captcha", captchaRouter);

apiRouter.get("/", (_req, res) => {
    res.json({
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
            content: "GET /api/content/tutorials, POST /api/content/tutorials (admin)",
            admin: "GET /api/admin/rate-limits (admin)",
        },
    });
});

apiRouter.use(
    "/auth",
    authLimiter,
    createAuthRouter({
        User,
        createAuthToken,
        issueAuthCookie,
        clearAuthCookie,
        readCsrfToken,
        requireCsrf,
        sendEmail,
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
        Rating,
        Review,
        requireAuth,
        requireCsrf,
        syncSqlUserAccount,
        syncSqlUserFavorites,
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

apiRouter.get("/content/tutorials", async (_req, res) => {
    try {
        const posts = await BlogPost.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .select("slug title summary tags createdAt updatedAt")
            .lean();
        return res.json({ posts });
    } catch {
        return res.json({ posts: [] });
    }
});

apiRouter.get("/content/tutorials/:slug", async (req, res) => {
    try {
        const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true }).lean();
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }
        return res.json({ post });
    } catch {
        return res.status(500).json({ message: "Unable to fetch tutorial." });
    }
});

function toSlug(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

apiRouter.post("/content/tutorials", requireAuth, requireCsrf, async (req, res) => {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }

    const title = String(req.body?.title || "").trim();
    const markdown = String(req.body?.markdown || "").trim();
    const summary = String(req.body?.summary || "").trim();
    const slug = toSlug(req.body?.slug || title);
    const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];

    if (!title || !markdown || !slug) {
        return res.status(400).json({ message: "title, markdown and slug are required." });
    }

    try {
        const post = await BlogPost.create({
            slug,
            title,
            summary,
            markdown,
            tags,
            authorId: req.user._id,
            isPublished: req.body?.isPublished !== false,
        });
        return res.status(201).json({ post });
    } catch (error) {
        if (String(error?.message || "").toLowerCase().includes("duplicate")) {
            return res.status(409).json({ message: "A tutorial with this slug already exists." });
        }
        return res.status(500).json({ message: "Unable to create tutorial." });
    }
});

apiRouter.put("/content/tutorials/:slug", requireAuth, requireCsrf, async (req, res) => {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }

    const updates = {
        title: req.body?.title,
        summary: req.body?.summary,
        markdown: req.body?.markdown,
        tags: Array.isArray(req.body?.tags) ? req.body.tags : undefined,
        isPublished: typeof req.body?.isPublished === "boolean" ? req.body.isPublished : undefined,
    };

    Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
            delete updates[key];
        }
    });

    try {
        const post = await BlogPost.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: updates },
            { new: true }
        );
        if (!post) {
            return res.status(404).json({ message: "Tutorial not found." });
        }
        return res.json({ post });
    } catch {
        return res.status(500).json({ message: "Unable to update tutorial." });
    }
});

apiRouter.delete("/content/tutorials/:slug", requireAuth, requireCsrf, async (req, res) => {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }

    const deleted = await BlogPost.findOneAndDelete({ slug: req.params.slug });
    if (!deleted) {
        return res.status(404).json({ message: "Tutorial not found." });
    }

    return res.json({ message: "Tutorial deleted." });
});

app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
    if (String(err?.message || "").includes("CORS")) {
        return res.status(403).json({ message: "CORS blocked for this origin." });
    }

    console.error("Unhandled server error:", err?.message || err);
    return res.status(500).json({ message: "Server error." });
});

if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set. Using an auto-generated runtime secret; tokens will reset on restart.");
}

if (isProduction && process.env.ALLOW_MEMORY_FALLBACK === "true") {
    console.warn("ALLOW_MEMORY_FALLBACK is ignored in production. Configure MONGODB_URI for persistent data.");
}

function assertProductionConfig() {
    if (isProduction && allowedOrigins.length === 0) {
        throw new Error("FRONTEND_ORIGINS must be configured in production.");
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
            console.warn(`MongoDB reconnect attempt ${reconnectAttempt}...`);
            await connectToAtlas();
            reconnectAttempt = 0;
            mongoMode = "atlas";
            console.log("MongoDB Atlas reconnected");
        } catch (error) {
            console.error("MongoDB reconnect failed:", error.message);
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
        console.warn("MongoDB disconnected");
        scheduleAtlasReconnect();
    }
});

mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
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
            console.warn("Cached MongoDB direct-host URI failed. Re-resolving Atlas SRV record.");
        }
    }

    if (isMongoSrvUri(mongoUri)) {
        try {
            const directUri = await expandMongoSrvUri(mongoUri);
            const connectionResult = await connectMongoWithSrvFallback({
                mongoUri: directUri,
                connect: (uri, options) => mongoose.connect(uri, options),
                connectOptions: mongoConnectOptions,
            });

            resolvedMongoUri = connectionResult.connectionUri;
            return;
        } catch (error) {
            console.warn(`Direct Atlas resolution failed, falling back to standard SRV connection: ${error.message}`);
        }
    }

    const connectionResult = await connectMongoWithSrvFallback({
        mongoUri,
        connect: (uri, options) => mongoose.connect(uri, options),
        connectOptions: mongoConnectOptions,
    });

    resolvedMongoUri = connectionResult.connectionUri;

    if (connectionResult.usedSrvFallback) {
        console.warn("MongoDB SRV lookup failed. Connected using direct Atlas hosts resolved via DNS-over-HTTPS.");
    }
}

export async function connectWithFallback() {
    if (!mongoUri) {
        if (!allowMemoryFallback) {
            throw new Error("MONGODB_URI is required when memory fallback is disabled.");
        }

        console.warn("MONGODB_URI is not set. Falling back to in-memory MongoDB.");
    }

    try {
        if (mongoUri) {
            await connectToAtlas();
            mongoMode = "atlas";
            console.log("MongoDB Atlas connected");
            return;
        }
    } catch (atlasError) {
        console.error("MongoDB Atlas connection failed:", atlasError.message);

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
        console.log("MongoDB memory fallback connected");

        await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
        await Component.collection.createIndex({ id: 1 }, { unique: true });
    } catch (memoryError) {
        console.error("MongoDB memory fallback failed:", memoryError.message);
        throw memoryError;
    }
}

export async function startServer() {
    isShuttingDown = false;
    assertProductionConfig();
    await connectWithFallback();

    if (process.env.SQL_AUTO_MIGRATE !== "false") {
        if (hasSqlConnectionConfig()) {
            try {
                await initializeSqlSchema();
            } catch (error) {
                console.warn(`Skipping PostgreSQL schema initialization: ${error.message}`);
            }
        } else {
            console.warn("Skipping PostgreSQL schema initialization: no SQL connection is configured.");
        }
    }

    await new Promise((resolve, reject) => {
        httpServer = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            resolve();
        });

        httpServer.on("error", reject);
    });

    return httpServer;
}

export async function shutdownServer() {
    isShuttingDown = true;
    clearReconnectTimer();

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
        console.error("Failed to start server:", error.message);
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
