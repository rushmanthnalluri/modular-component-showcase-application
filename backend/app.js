import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { MongoMemoryServer } from "mongodb-memory-server";
import captchaRouter from "./controller/captchaController.js";

const app = express();
let mongoMode = "disconnected";
let memoryServer = null;
const isProduction = process.env.NODE_ENV === "production";
const allowMemoryFallback =
    typeof process.env.ALLOW_MEMORY_FALLBACK === "string"
        ? process.env.ALLOW_MEMORY_FALLBACK !== "false"
        : !isProduction;
const jwtSecret = process.env.JWT_SECRET || randomBytes(48).toString("hex");
let reconnectTimer = null;
let reconnectAttempt = 0;

const mongoConnectOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
};

app.set("trust proxy", 1);

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

const defaultLocalOrigins = ["http://localhost:5173", "http://localhost:8080", "http://localhost:8081"];
const defaultProductionOrigins = ["https://rushmanthnalluri.github.io"];

const allowedOrigins = Array.from(new Set([
    ...(isProduction ? defaultProductionOrigins : defaultLocalOrigins),
    ...String(process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error("Origin not allowed by CORS"));
        },
    })
);
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(globalLimiter);
app.use(express.json({ limit: "1mb" }));
app.use("/captcha", captchaRouter);
app.use("/api/captcha", captchaRouter);
app.use("/api/auth", authLimiter);

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, default: "", trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["user", "developer", "admin"], default: "user" },
        isVerifiedDeveloper: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Add a unique index with sparse option for better in-memory MongoDB compatibility
userSchema.index({ email: 1 }, { unique: true, sparse: true });

const componentSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        tags: { type: [String], default: [] },
        thumbnail: { type: String, default: "" },
        screenshot: { type: String, default: "" },
        code: {
            jsx: { type: String, required: true },
            css: { type: String, default: "" },
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Component = mongoose.model("Component", componentSchema);

function createSlug(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function createComponentId(name) {
    const base = createSlug(name) || "custom-component";
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
}

function normalizePhone(phone) {
    return String(phone || "").replace(/\D/g, "");
}

function isValidPhone(phone) {
    return /^\d{10,15}$/.test(phone);
}

function createAuthToken(userId) {
    return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
}

async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : "";
        if (!token) {
            return res.status(401).json({ message: "Authentication required." });
        }

        const payload = jwt.verify(token, jwtSecret);
        const user = await User.findById(payload.userId).select(
            "fullName email phone role isVerifiedDeveloper"
        );
        if (!user) {
            return res.status(401).json({ message: "Invalid token." });
        }

        req.user = user;
        return next();
    } catch {
        return res.status(401).json({ message: "Invalid token." });
    }
}

function requireDeveloper(req, res, next) {
    const role = String(req.user?.role || "").toLowerCase();
    const canAdd = role === "admin" || role === "developer" || Boolean(req.user?.isVerifiedDeveloper);
    if (!canAdd) {
        return res.status(403).json({ message: "Only developers can add components." });
    }

    return next();
}

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

app.post("/api/auth/register", async (req, res) => {
    try {
        const { fullName = "", email = "", phone = "", password = "", role = "user" } = req.body || {};
        const normalizedPhone = normalizePhone(phone);
        
        if (!fullName.trim() || !email.trim() || !password.trim()) {
            return res.status(400).json({ message: "Full name, email and password are required." });
        }
        if (!isValidPhone(normalizedPhone)) {
            return res.status(400).json({ message: "Phone number must be 10 to 15 digits." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password should be at least 6 characters." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const normalizedRole = role === "developer" ? "developer" : "user";
        const passwordHash = await bcrypt.hash(password, 10);

        await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
            role: normalizedRole,
            isVerifiedDeveloper: normalizedRole === "developer",
        });

        return res.status(201).json({ message: "Registration successful." });
    } catch (error) {
        console.error("Register error:", error.message, error.stack);
        return res.status(500).json({ message: "Unable to register right now." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email = "", password = "" } = req.body || {};
        if (!email.trim() || !password.trim()) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = createAuthToken(user.id);
        return res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerifiedDeveloper: Boolean(user.isVerifiedDeveloper),
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Unable to login right now." });
    }
});

app.post("/api/auth/forgot-password", async (req, res) => {
    try {
        const { email = "", phone = "", newPassword = "" } = req.body || {};
        if (!email.trim() || !phone.trim() || !newPassword.trim()) {
            return res.status(400).json({ message: "Email, phone and new password are required." });
        }

        const normalizedPhone = normalizePhone(phone);
        if (!isValidPhone(normalizedPhone)) {
            return res.status(400).json({ message: "Phone number must be 10 to 15 digits." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password should be at least 6 characters." });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "Account not found." });
        }

        const savedPhone = normalizePhone(user.phone);
        if (savedPhone !== normalizedPhone) {
            return res.status(400).json({ message: "Phone number does not match this account." });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({ message: "Password reset successful. Please login with your new password." });
    } catch (error) {
        console.error("Forgot password error:", error.message, error.stack);
        return res.status(500).json({ message: "Unable to reset password right now." });
    }
});

app.get("/api/components", async (_req, res) => {
    try {
        const items = await Component.find({}).sort({ createdAt: -1 }).lean();
        return res.json(items);
    } catch {
        return res.status(500).json({ message: "Unable to fetch components." });
    }
});

app.post("/api/components", requireAuth, requireDeveloper, async (req, res) => {
    try {
        const {
            name = "",
            description = "",
            category = "",
            jsxCode = "",
            cssCode = "",
            thumbnail = "",
            screenshot = "",
        } = req.body || {};

        if (!name.trim() || !description.trim() || !category.trim() || !jsxCode.trim()) {
            return res.status(400).json({ message: "Name, description, category and JSX code are required." });
        }

        const item = await Component.create({
            id: createComponentId(name),
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            tags: [category.trim(), "user-added", ...name.trim().toLowerCase().split(/\s+/)].slice(0, 5),
            thumbnail: String(thumbnail || ""),
            screenshot: String(screenshot || ""),
            code: {
                jsx: jsxCode.trim(),
                css: String(cssCode || "").trim(),
            },
            createdBy: req.user.id,
        });

        return res.status(201).json(item);
    } catch {
        return res.status(500).json({ message: "Unable to save component right now." });
    }
});

app.use((err, _req, res, _next) => {
    if (String(err?.message || "").includes("CORS")) {
        return res.status(403).json({ message: "CORS blocked for this origin." });
    }

    return res.status(500).json({ message: "Server error." });
});

const PORT = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI;

if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set. Using an auto-generated runtime secret; tokens will reset on restart.");
}

if (isProduction && allowedOrigins.length === 0) {
    console.error("FRONTEND_ORIGINS must be configured in production.");
    process.exit(1);
}

async function connectWithFallback() {
    if (!mongoUri) {
        if (!allowMemoryFallback) {
            console.error("MONGODB_URI is required in production when memory fallback is disabled.");
            process.exit(1);
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
            process.exit(1);
        }
    }

    try {
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri("modularcomponent");
        await mongoose.connect(memoryUri, mongoConnectOptions);
        mongoMode = "memory";
        console.log("MongoDB memory fallback connected");
        
        // Build indices for in-memory database
        await User.collection.createIndex({ email: 1 }, { unique: true, sparse:true });
        console.log("User email index created");
        
        await Component.collection.createIndex({ id: 1 }, { unique: true });
        console.log("Component id index created");
    } catch (memoryError) {
        console.error("MongoDB memory fallback failed:", memoryError.message);
        process.exit(1);
    }
}

function clearReconnectTimer() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function scheduleAtlasReconnect() {
    if (!mongoUri || mongoMode === "memory" || reconnectTimer) {
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
    if (mongoMode !== "memory") {
        console.warn("MongoDB disconnected");
        scheduleAtlasReconnect();
    }
});

mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
});

connectWithFallback().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});

process.on("SIGINT", async () => {
    clearReconnectTimer();
    if (memoryServer) {
        await memoryServer.stop();
    }
    process.exit(0);
});
