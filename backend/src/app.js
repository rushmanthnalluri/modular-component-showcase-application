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
import captchaRouter from "./controller/captchaController.js";
import { sendEmail } from "./model/emailManager.js";
import { User, Component } from "./model/appModels.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createCsrfMiddleware } from "./middleware/csrf.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createComponentsRouter } from "./routes/componentsRoutes.js";
import { createEmailRouter } from "./routes/emailRoutes.js";

const app = express();
let mongoMode = "disconnected";
let memoryServer = null;
let httpServer = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let isShuttingDown = false;

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
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(ensureCsrfCookie);

app.use("/captcha", captchaRouter);
app.use("/api/captcha", captchaRouter);
app.use(
    "/api/auth",
    authLimiter,
    createAuthRouter({
        User,
        createAuthToken,
        issueAuthCookie,
        clearAuthCookie,
        readCsrfToken,
        requireCsrf,
        sendEmail,
    })
);
app.use(
    "/api/components",
    createComponentsRouter({
        Component,
        writeLimiter: componentWriteLimiter,
        requireAuth,
        requireDeveloper,
        requireCsrf,
    })
);
app.use(
    "/api/email",
    createEmailRouter({
        sendEmail,
        supportLimiter,
        requireCsrf,
    })
);

app.get("/", (_req, res) => {
    res.json("Started.....");
});

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        mode: mongoMode,
    });
});

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
            await mongoose.connect(mongoUri, mongoConnectOptions);
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

export async function connectWithFallback() {
    if (!mongoUri) {
        if (!allowMemoryFallback) {
            throw new Error("MONGODB_URI is required when memory fallback is disabled.");
        }

        console.warn("MONGODB_URI is not set. Falling back to in-memory MongoDB.");
    }

    try {
        if (mongoUri) {
            await mongoose.connect(mongoUri, mongoConnectOptions);
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
