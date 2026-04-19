import jwt from "jsonwebtoken";
import { createCookieOptions } from "../utils/cookiePolicy.js";

const ACCESS_COOKIE_NAME = "auth_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createAuthMiddleware({ User, jwtSecret, isProduction }) {
    function readToken(req) {
        const header = String(req.headers.authorization || "");
        if (header.startsWith("Bearer ")) {
            return header.slice(7).trim();
        }

        return String(req.cookies?.[ACCESS_COOKIE_NAME] || "").trim();
    }

    function readRefreshToken(req) {
        return String(req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || "").trim();
    }

    async function requireAuth(req, res, next) {
        try {
            const token = readToken(req);
            if (!token) {
                return res.status(401).json({ message: "Authentication required." });
            }

            const payload = jwt.verify(token, jwtSecret);
            if (payload?.tokenType && payload.tokenType !== "access") {
                return res.status(401).json({ message: "Invalid token." });
            }
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

    function issueAuthCookies(req, res, tokens) {
        const accessToken = String(tokens?.accessToken || "").trim();
        const refreshToken = String(tokens?.refreshToken || "").trim();

        if (!accessToken || !refreshToken) {
            throw new Error("Both accessToken and refreshToken are required.");
        }

        res.cookie(
            ACCESS_COOKIE_NAME,
            accessToken,
            createCookieOptions(req, {
                isProduction,
                httpOnly: true,
                maxAge: ACCESS_TOKEN_MAX_AGE_MS,
            })
        );

        res.cookie(
            REFRESH_COOKIE_NAME,
            refreshToken,
            createCookieOptions(req, {
                isProduction,
                httpOnly: true,
                maxAge: REFRESH_TOKEN_MAX_AGE_MS,
            })
        );
    }

    function clearCookie(req, res, cookieName) {
        const options = createCookieOptions(req, {
            isProduction,
            httpOnly: true,
            maxAge: REFRESH_TOKEN_MAX_AGE_MS,
        });
        res.clearCookie(cookieName, {
            httpOnly: options.httpOnly,
            secure: options.secure,
            sameSite: options.sameSite,
            path: options.path,
        });
    }

    function clearAuthCookies(req, res) {
        clearCookie(req, res, ACCESS_COOKIE_NAME);
        clearCookie(req, res, REFRESH_COOKIE_NAME);
    }

    return {
        issueAuthCookies,
        clearAuthCookies,
        readRefreshToken,
        requireAuth,
        requireDeveloper,
    };
}
