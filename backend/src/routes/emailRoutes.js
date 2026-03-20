import express from "express";
import { validateSupportTicketPayload } from "../utils/validation.js";

export function createEmailRouter({ sendEmail, supportLimiter, requireCsrf }) {
    const router = express.Router();

    router.post("/send", supportLimiter, requireCsrf, async (req, res) => {
        const validation = validateSupportTicketPayload(req.body || {});
        if (!validation.ok) {
            return res.status(400).json({
                code: 400,
                msg: validation.message,
            });
        }

        const { name, title, category, description } = validation.data;
        // Send ticket to the support team's own configured email address
        const supportEmail = String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
        const response = await sendEmail(supportEmail, { name, title, category, description });
        return res.json(response);
    });

    return router;
}
