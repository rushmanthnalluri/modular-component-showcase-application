import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import express from "express";
import cookieParser from "cookie-parser";
import { createUserRouter } from "../routes/userRoutes.js";

// Write a dummy image file
const dummyImagePath = path.join(os.tmpdir(), "dummy.jpg");
fs.writeFileSync(dummyImagePath, Buffer.alloc(100));

function requireCsrfTestOnlyBypass(_req, _res, next) {
    // Test-only bypass used to validate multipart parsing and avatar handling.
    if (process.env.NODE_ENV !== "test") {
        return next(new Error("CSRF test bypass is only allowed in NODE_ENV=test"));
    }
    return next();
}

test("Multipart upload", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-test-"));
    process.env.AVATAR_UPLOAD_DIR = tmpDir;

    const User = {
        findById: () => Promise.resolve({
            _id: "user-obj-id",
            id: "user-1",
            fullName: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            save: async function () { return this; },
        }),
        findOne: () => ({ select: () => Promise.resolve(null) }),
    };

    const requireAuth = (req, _res, next) => {
        req.user = { id: "user-obj-id", _id: "user-obj-id" };
        next();
    };
    process.env.NODE_ENV = "test";
    const requireCsrf = requireCsrfTestOnlyBypass;

    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use("/api/users", createUserRouter({ User, Component: {}, SubmissionHistory: {}, requireAuth, requireCsrf }));
    app.use((err, _req, res, _next) => {
        console.error("EXPRESS ERROR:", err);
        res.status(500).json({ message: err.message });
    });

    const server = app.listen(0, "127.0.0.1");
    await new Promise(r => server.on("listening", r));
    const port = server.address().port;

    try {
        const formData = new FormData();
        formData.append("fullName", "Test");
        formData.append("email", "test@example.com");
        
        formData.append("socialLinks", JSON.stringify({ twitter: "x" }));
        formData.append("emailPreferences", JSON.stringify({ newsletters: true }));
        const blob = new Blob([fs.readFileSync(dummyImagePath)], { type: "image/jpeg" });
        formData.append("avatar", blob, "dummy.jpg");

        const res = await fetch(`http://127.0.0.1:${port}/api/users/me`, {
            method: "PUT",
            body: formData,
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.user.email, "test@example.com");
        assert.match(body.user.avatarUrl, /\/uploads\/avatars\/.+\.jpg$/);
    } finally {
        server.close();
    }
});
