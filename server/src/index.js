import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import componentRoutes from "./routes/components.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI;

const allowedOrigins = String(process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/components", componentRoutes);

app.use((err, _req, res, _next) => {
  if (String(err?.message || "").includes("CORS")) {
    return res.status(403).json({ message: "CORS blocked for this origin." });
  }

  return res.status(500).json({ message: "Server error." });
});

async function start() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required.");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required.");
  }

  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
