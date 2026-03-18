import { randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function csrfCookieOptions(isProduction) {
    return {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
    };
}

function tokensMatch(left, right) {
    const a = Buffer.from(String(left || ""));
    const b = Buffer.from(String(right || ""));
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
        return false;
    }

    return timingSafeEqual(a, b);
}

function generateCsrfToken() {
    return randomBytes(24).toString("hex");
}

export function createCsrfMiddleware({ isProduction }) {
    function ensureCsrfCookie(req, res, next) {
        const existingToken = String(req.cookies?.[CSRF_COOKIE_NAME] || "");
        if (existingToken) {
            return next();
        }

        const token = generateCsrfToken();
        const options = csrfCookieOptions(isProduction);
        res.cookie(CSRF_COOKIE_NAME, token, options);
        req.cookies = {
            ...(req.cookies || {}),
            [CSRF_COOKIE_NAME]: token,
        };

        return next();
    }

    function readCsrfToken(req) {
        return String(req.cookies?.[CSRF_COOKIE_NAME] || "");
    }

    function requireCsrf(req, res, next) {
        if (SAFE_METHODS.has(String(req.method || "").toUpperCase())) {
            return next();
        }

        const authHeader = String(req.headers.authorization || "");
        if (authHeader.startsWith("Bearer ")) {
            return next();
        }

        const cookieToken = readCsrfToken(req);
        const headerToken = String(req.get(CSRF_HEADER_NAME) || "").trim();

        if (!tokensMatch(cookieToken, headerToken)) {
            return res.status(403).json({ message: "Invalid CSRF token." });
        }

        return next();
    }

    return {
        ensureCsrfCookie,
        readCsrfToken,
        requireCsrf,
    };
}
