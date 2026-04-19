import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";

import { createAuthRouter } from "../routes/authRoutes.js";

function createApp(overrides = {}) {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    const user = {
        id: "u1",
        fullName: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        role: "user",
        isVerifiedDeveloper: false,
    };

    const User = {
        findById: () => ({
            select: async () => user,
        }),
    };

    const router = createAuthRouter({
        User,
        createAccessToken: () => "access-token",
        createRefreshToken: () => "refresh-token",
        verifyRefreshToken: () => ({ userId: "u1", tokenType: "refresh" }),
        issueAuthCookies: (_req, res, tokens) => {
            res.cookie("auth_token", tokens.accessToken);
            res.cookie("refresh_token", tokens.refreshToken);
        },
        clearAuthCookies: () => {},
        readRefreshToken: (req) => req.cookies.refresh_token || req.body.refreshToken,
        readCsrfToken: () => "csrf-token",
        requireCsrf: (_req, _res, next) => next(),
        sendEmail: async () => {},
        logger: { error: () => {}, warn: () => {} },
        ...overrides,
    });

    app.use("/auth", router);
    return app;
}

async function withServer(app, run) {
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        await run(baseUrl);
    } finally {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
}

test("POST /auth/refresh returns new auth payload", async () => {
    const app = createApp();

    await withServer(app, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: "refresh_token=refresh-cookie-value",
            },
            body: JSON.stringify({}),
        });
        const payload = await response.json();

        assert.equal(response.status, 200);
        assert.equal(payload.token, "access-token");
        assert.equal(payload.user.email, "test@example.com");
    });
});

test("POST /auth/refresh returns 401 when token verification fails", async () => {
    const app = createApp({
        verifyRefreshToken: () => {
            throw new Error("invalid");
        },
    });

    await withServer(app, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken: "bad-token" }),
        });
        const payload = await response.json();

        assert.equal(response.status, 401);
        assert.equal(payload.message, "Invalid refresh token.");
    });
});
