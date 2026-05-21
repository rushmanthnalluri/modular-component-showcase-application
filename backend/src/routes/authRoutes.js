import express from "express";
import bcrypt from "bcryptjs";
import path from "node:path";
import {
    normalizePhone,
    validateForgotPasswordPayload,
    validateLoginPayload,
    validateRegistrationPayload,
} from "../utils/validation.js";
import { createValidatedBodyMiddleware } from "../middleware/requestValidation.js";
import { resolvePublicUrl, resolveRequestOrigin } from "../utils/url.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export function createAuthRouter({
    User,
    createAccessToken,
    createRefreshToken,
    verifyRefreshToken,
    issueAuthCookies,
    clearAuthCookies,
    readRefreshToken,
    readCsrfToken,
    requireCsrf,
    sendEmail,
    logger = console,
    syncSqlUserAccount = async () => {},
}) {
    const router = express.Router();

    function successPayload(res, payload = {}, status = 200) {
        return sendSuccess(res, payload, status);
    }

    function errorPayload(res, code, message, status = 500, details = null) {
        return sendError(res, code, message, status, details);
    }

    const validateRegistrationBody = createValidatedBodyMiddleware(validateRegistrationPayload);
    const validateLoginBody = createValidatedBodyMiddleware(validateLoginPayload);
    const validateForgotPasswordBody = createValidatedBodyMiddleware(validateForgotPasswordPayload);

    function requestBaseUrl(req) {
        return resolveRequestOrigin(req);
    }

    function resolveAvatarReference(value, req) {
        const avatar = String(value || "").trim();
        if (!avatar || avatar.startsWith("data:image") || /^https?:\/\//i.test(avatar)) {
            return avatar;
        }

        if (avatar.startsWith("/app/uploads/avatars/") || avatar.startsWith("/uploads/avatars/")) {
            const baseUrl = requestBaseUrl(req);
            const publicPath = `/uploads/avatars/${path.basename(avatar)}`;
            return baseUrl ? resolvePublicUrl(publicPath, baseUrl) : publicPath;
        }

        return avatar;
    }

    function looksLikeBcryptHash(value) {
        return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
    }

    async function verifyPassword(user, password) {
        const storedPassword = String(user?.passwordHash || "");
        if (!storedPassword) {
            return false;
        }

        if (looksLikeBcryptHash(storedPassword)) {
            return bcrypt.compare(password, storedPassword);
        }

        // Legacy support: allow one-time plain text match, then upgrade storage to bcrypt.
        if (password !== storedPassword) {
            return false;
        }

        user.passwordHash = await bcrypt.hash(password, 10);
        await user.save();
        return true;
    }

    router.get("/csrf", (req, res) => {
        const csrfToken = readCsrfToken(req);
        return successPayload(res, { csrfToken });
    });

    router.post("/register", requireCsrf, validateRegistrationBody, async (req, res) => {
        try {
            const {
                fullName,
                email,
                phone,
                password,
                role,
                bio,
                avatarImage,
                socialLinks,
                emailPreferences,
            } = req.validatedBody;
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return errorPayload(res, "CONFLICT", "An account with this email already exists.", 409);
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await User.create({
                fullName,
                email,
                phone,
                passwordHash,
                role,
                isVerifiedDeveloper: role === "developer",
                bio,
                avatarImage,
                socialLinks,
                emailPreferences,
            });

            await syncSqlUserAccount(user);

            return successPayload(res, { message: "Registration successful." }, 201);
        } catch (error) {
            logger.error("Register error", { error: error.message, stack: error.stack });
            return errorPayload(res, "SERVER_ERROR", "Unable to register right now.", 500);
        }
    });

    router.post("/login", requireCsrf, validateLoginBody, async (req, res) => {
        try {
            const { email, password } = req.validatedBody;
            const user = await User.findOne({ email });
            if (!user) {
                return errorPayload(res, "UNAUTHORIZED", "Invalid email or password.", 401);
            }

            const isValidPassword = await verifyPassword(user, password);
            if (!isValidPassword) {
                return errorPayload(res, "UNAUTHORIZED", "Invalid email or password.", 401);
            }

            await syncSqlUserAccount(user);

            const accessToken = createAccessToken(user.id, user.email, user.role);
            const refreshToken = createRefreshToken(user.id, user.email, user.role);
            issueAuthCookies(req, res, { accessToken, refreshToken });

            return successPayload(res, {
                token: accessToken,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerifiedDeveloper: Boolean(user.isVerifiedDeveloper),
                    avatarImage: resolveAvatarReference(user.avatarImage || "", req),
                },
            });
        } catch (error) {
            logger.error("Login error", { error: error.message, stack: error.stack });
            return errorPayload(res, "SERVER_ERROR", "Unable to login right now.", 500);
        }
    });

    router.post("/refresh", requireCsrf, async (req, res) => {
        try {
            const refreshToken = readRefreshToken(req);
            if (!refreshToken) {
                return errorPayload(res, "UNAUTHORIZED", "Refresh token is required.", 401);
            }

            const payload = verifyRefreshToken(refreshToken);
            const user = await User.findById(payload.userId).select(
                "fullName email phone role isVerifiedDeveloper avatarImage"
            );

            if (!user) {
                return errorPayload(res, "UNAUTHORIZED", "Invalid refresh token.", 401);
            }

            const newAccessToken = createAccessToken(user.id, user.email, user.role);
            const newRefreshToken = createRefreshToken(user.id, user.email, user.role);
            issueAuthCookies(req, res, { accessToken: newAccessToken, refreshToken: newRefreshToken });

            return successPayload(res, {
                token: newAccessToken,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerifiedDeveloper: Boolean(user.isVerifiedDeveloper),
                    avatarImage: resolveAvatarReference(user.avatarImage || "", req),
                },
            });
        } catch {
            return errorPayload(res, "UNAUTHORIZED", "Invalid refresh token.", 401);
        }
    });

    router.post("/logout", requireCsrf, (req, res) => {
        clearAuthCookies(req, res);
        return successPayload(res, { message: "Logged out." });
    });

    router.post("/forgot-password", requireCsrf, validateForgotPasswordBody, async (req, res) => {
        try {
            const { email, phone, newPassword } = req.validatedBody;
            const user = await User.findOne({ email });
            if (!user) {
                return errorPayload(res, "NOT_FOUND", "Account not found.", 404);
            }

            const savedPhone = normalizePhone(user.phone);
            if (savedPhone !== phone) {
                return errorPayload(res, "VALIDATION_ERROR", "Phone number does not match this account.", 400);
            }

            user.passwordHash = await bcrypt.hash(newPassword, 10);
            await user.save();

            try {
                await sendEmail(user.email);
            } catch (mailError) {
                logger.warn("Password reset email failed", { error: mailError.message });
            }

            await syncSqlUserAccount(user);

            return successPayload(res, { message: "Password reset successful. Please login with your new password." });
        } catch (error) {
            logger.error("Forgot password error", { error: error.message, stack: error.stack });
            return errorPayload(res, "SERVER_ERROR", "Unable to reset password right now.", 500);
        }
    });

    return router;
}
