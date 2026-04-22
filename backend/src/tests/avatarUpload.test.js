/**
 * avatarUpload.test.js
 *
 * Tests for the avatar upload middleware and the user profile route.
 * Covers: mapAvatarUploadError mapping, JSON avatarUrl update via PUT /api/users/me,
 * and unauthenticated rejection.
 */
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import express from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import { avatarUpload, mapAvatarUploadError } from "../middleware/avatarUpload.js";
import { createUserRouter } from "../routes/userRoutes.js";

// ── helpers ────────────────────────────────────────────────────────────────

async function withServer(app, run) {
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    try {
        await run(baseUrl);
    } finally {
        await new Promise((resolve, reject) =>
            server.close((err) => (err ? reject(err) : resolve()))
        );
    }
}

function makeUser(overrides = {}) {
    return {
        _id: "user-obj-id",
        id: "user-1",
        fullName: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        role: "user",
        isVerifiedDeveloper: false,
        favorites: [],
        bio: "",
        avatarImage: "",
        socialLinks: { twitter: "", github: "", portfolio: "" },
        stats: {},
        emailPreferences: { newComponents: true, reviewComments: true, newsletters: false },
        save: async function () { return this; },
        ...overrides,
    };
}

function buildApp() {
    const user = makeUser();
    const User = {
        findById: () => Promise.resolve(user),
        // Route calls: User.findOne({...}).select("_id") — must return chainable obj
        findOne: () => ({ select: () => Promise.resolve(null) }),
    };

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-test-"));
    process.env.AVATAR_UPLOAD_DIR = tmpDir;

    const requireAuth = (req, _res, next) => {
        req.user = { id: "user-obj-id", _id: "user-obj-id", role: "user" };
        next();
    };
    const requireCsrf = (_req, _res, next) => next();
    const syncSqlUserAccount = async () => { };

    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(
        "/api/users",
        createUserRouter({ User, Component: {}, SubmissionHistory: {}, requireAuth, requireCsrf, syncSqlUserAccount })
    );

    // Mirror the global error handler in app.js
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
        const avatarError = mapAvatarUploadError(err);
        if (avatarError) return res.status(avatarError.status).json({ message: avatarError.message });
        res.status(500).json({ message: err?.message || "Server error." });
    });

    return { app, tmpDir };
}

// ── unit tests: mapAvatarUploadError ──────────────────────────────────────

test("mapAvatarUploadError — maps LIMIT_FILE_SIZE to 400 with size message", () => {
    const err = new multer.MulterError("LIMIT_FILE_SIZE");
    const result = mapAvatarUploadError(err);
    assert.equal(result?.status, 400);
    assert.match(result?.message || "", /5MB/i);
});

test("mapAvatarUploadError — maps LIMIT_UNEXPECTED_FILE to 400 with type message", () => {
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "avatar");
    const result = mapAvatarUploadError(err);
    assert.equal(result?.status, 400);
    assert.match(result?.message || "", /jpg|jpeg|png|webp/i);
});

test("mapAvatarUploadError — returns null for non-multer errors", () => {
    const err = new Error("Generic server error");
    assert.equal(mapAvatarUploadError(err), null);
});

// ── integration: JSON avatarUrl update ────────────────────────────────────

test("PUT /api/users/me — JSON avatarUrl update succeeds", async () => {
    const { app } = buildApp();
    await withServer(app, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/users/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Test User",
                email: "test@example.com",
                phone: "1234567890",
                avatarUrl: "https://example.com/avatar.png",
            }),
        });

        assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
        const body = await res.json();
        assert.ok(body.user, "Response must contain user object");
        assert.equal(body.user.avatarUrl, "https://example.com/avatar.png");
        assert.equal(body.user.avatarImage, "https://example.com/avatar.png");
    });
});

test("PUT /api/users/me — avatarImage field also accepted as alias", async () => {
    const { app } = buildApp();
    await withServer(app, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/users/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Test User",
                email: "test@example.com",
                phone: "1234567890",
                avatarImage: "https://example.com/profile.jpg",
            }),
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.user.avatarImage, "https://example.com/profile.jpg");
    });
});

test("PUT /api/users/me — invalid avatarUrl returns 400", async () => {
    const { app } = buildApp();
    await withServer(app, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/users/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Test User",
                email: "test@example.com",
                phone: "1234567890",
                avatarUrl: "not-a-url",
            }),
        });

        assert.equal(res.status, 400);
        const body = await res.json();
        assert.ok(body.message, "Error response must have message");
    });
});

// ── integration: auth check ───────────────────────────────────────────────

test("PUT /api/users/me — unauthenticated returns 401", async () => {
    const User = { findById: () => Promise.resolve(makeUser()) };
    const requireAuth = (_req, res) => res.status(401).json({ message: "Authentication required." });
    const requireCsrf = (_req, _res, next) => next();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-auth-"));
    process.env.AVATAR_UPLOAD_DIR = tmpDir;

    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(
        "/api/users",
        createUserRouter({ User, Component: {}, SubmissionHistory: {}, requireAuth, requireCsrf })
    );
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(500).json({ message: "Server error." }));

    await withServer(app, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/users/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName: "None", email: "none@example.com", phone: "1234567890" }),
        });
        assert.equal(res.status, 401);
    });
});
