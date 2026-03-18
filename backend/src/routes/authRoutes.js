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
    createAuthToken,
    issueAuthCookie,
    clearAuthCookie,
    readCsrfToken,
    requireCsrf,
    sendEmail,
}) {
    const router = express.Router();

    router.get("/csrf", (req, res) => {
        return res.json({ csrfToken: readCsrfToken(req) });
    });

    router.post("/register", async (req, res) => {
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

            await User.create({
                fullName,
                email,
                phone,
                passwordHash,
                role,
                isVerifiedDeveloper: role === "developer",
            });

            return res.status(201).json({ message: "Registration successful." });
        } catch (error) {
            console.error("Register error:", error.message, error.stack);
            return res.status(500).json({ message: "Unable to register right now." });
        }
    });

    router.post("/login", async (req, res) => {
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

            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            const token = createAuthToken(user.id);
            issueAuthCookie(res, token);

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
            console.error("Login error:", error.message, error.stack);
            return res.status(500).json({ message: "Unable to login right now." });
        }
    });

    router.post("/logout", requireCsrf, (_req, res) => {
        clearAuthCookie(res);
        return res.json({ message: "Logged out." });
    });

    router.post("/forgot-password", async (req, res) => {
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
                console.warn("Password reset email failed:", mailError.message);
            }

            return res.json({ message: "Password reset successful. Please login with your new password." });
        } catch (error) {
            console.error("Forgot password error:", error.message, error.stack);
            return res.status(500).json({ message: "Unable to reset password right now." });
        }
    });

    return router;
}
