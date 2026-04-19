import express from "express";
import bcrypt from "bcryptjs";
import {
    normalizePhone,
    validateForgotPasswordPayload,
    validateLoginPayload,
    validateRegistrationPayload,
} from "../utils/validation.js";

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
        return res.json({ csrfToken: readCsrfToken(req) });
    });

    router.post("/register", requireCsrf, async (req, res) => {
        try {
            const validation = validateRegistrationPayload(req.body || {});
            if (!validation.ok) {
                return res.status(400).json({ message: validation.message });
            }

            const { fullName, email, phone, password, role } = validation.data;
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ message: "An account with this email already exists." });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await User.create({
                fullName,
                email,
                phone,
                passwordHash,
                role,
                isVerifiedDeveloper: role === "developer",
            });

            await syncSqlUserAccount(user);

            return res.status(201).json({ message: "Registration successful." });
        } catch (error) {
            logger.error("Register error", { error: error.message, stack: error.stack });
            return res.status(500).json({ message: "Unable to register right now." });
        }
    });

    router.post("/login", requireCsrf, async (req, res) => {
        try {
            const validation = validateLoginPayload(req.body || {});
            if (!validation.ok) {
                return res.status(400).json({ message: validation.message });
            }

            const { email, password } = validation.data;
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            const isValidPassword = await verifyPassword(user, password);
            if (!isValidPassword) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            await syncSqlUserAccount(user);

            const accessToken = createAccessToken(user.id);
            const refreshToken = createRefreshToken(user.id);
            issueAuthCookies(req, res, { accessToken, refreshToken });

            return res.json({
                token: accessToken,
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
            logger.error("Login error", { error: error.message, stack: error.stack });
            return res.status(500).json({ message: "Unable to login right now." });
        }
    });

    router.post("/refresh", requireCsrf, async (req, res) => {
        try {
            const refreshToken = readRefreshToken(req);
            if (!refreshToken) {
                return res.status(401).json({ message: "Refresh token is required." });
            }

            const payload = verifyRefreshToken(refreshToken);
            const user = await User.findById(payload.userId).select(
                "fullName email phone role isVerifiedDeveloper"
            );

            if (!user) {
                return res.status(401).json({ message: "Invalid refresh token." });
            }

            const newAccessToken = createAccessToken(user.id);
            const newRefreshToken = createRefreshToken(user.id);
            issueAuthCookies(req, res, { accessToken: newAccessToken, refreshToken: newRefreshToken });

            return res.json({
                token: newAccessToken,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerifiedDeveloper: Boolean(user.isVerifiedDeveloper),
                },
            });
        } catch {
            return res.status(401).json({ message: "Invalid refresh token." });
        }
    });

    router.post("/logout", requireCsrf, (req, res) => {
        clearAuthCookies(req, res);
        return res.json({ message: "Logged out." });
    });

    router.post("/forgot-password", requireCsrf, async (req, res) => {
        try {
            const validation = validateForgotPasswordPayload(req.body || {});
            if (!validation.ok) {
                return res.status(400).json({ message: validation.message });
            }

            const { email, phone, newPassword } = validation.data;
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "Account not found." });
            }

            const savedPhone = normalizePhone(user.phone);
            if (savedPhone !== phone) {
                return res.status(400).json({ message: "Phone number does not match this account." });
            }

            user.passwordHash = await bcrypt.hash(newPassword, 10);
            await user.save();

            try {
                await sendEmail(user.email);
            } catch (mailError) {
                logger.warn("Password reset email failed", { error: mailError.message });
            }

            await syncSqlUserAccount(user);

            return res.json({ message: "Password reset successful. Please login with your new password." });
        } catch (error) {
            logger.error("Forgot password error", { error: error.message, stack: error.stack });
            return res.status(500).json({ message: "Unable to reset password right now." });
        }
    });

    return router;
}
