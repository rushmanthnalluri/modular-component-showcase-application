import jwt from "jsonwebtoken";

const AUTH_COOKIE_NAME = "auth_token";
const AUTH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function authCookieOptions(isProduction) {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: AUTH_TOKEN_MAX_AGE_MS,
    };
}

export function createAuthMiddleware({ User, jwtSecret, isProduction }) {
    function readToken(req) {
        const header = String(req.headers.authorization || "");
        if (header.startsWith("Bearer ")) {
            return header.slice(7).trim();
        }

        return String(req.cookies?.[AUTH_COOKIE_NAME] || "").trim();
    }

    async function requireAuth(req, res, next) {
        try {
            const token = readToken(req);
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

    function issueAuthCookie(res, token) {
        res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions(isProduction));
    }

    function clearAuthCookie(res) {
        const options = authCookieOptions(isProduction);
        res.clearCookie(AUTH_COOKIE_NAME, {
            httpOnly: options.httpOnly,
            secure: options.secure,
            sameSite: options.sameSite,
            path: options.path,
        });
    }

    return {
        issueAuthCookie,
        clearAuthCookie,
        requireAuth,
        requireDeveloper,
    };
}
