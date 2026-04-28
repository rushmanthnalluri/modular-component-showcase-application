import express from "express";
import { validateSupportTicketPayload } from "../utils/validation.js";
import { createValidatedBodyMiddleware } from "../middleware/requestValidation.js";

export function createEmailRouter({ sendEmail, supportLimiter }) {
    const router = express.Router();
    const validateSupportTicketBody = createValidatedBodyMiddleware(validateSupportTicketPayload, { status: 400 });

    router.post("/send", supportLimiter, validateSupportTicketBody, async (req, res) => {
        const { name, title, category, description } = req.validatedBody;
        // Send ticket to the support team's own configured email address
        const supportEmail = String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
        const response = await sendEmail(supportEmail, { name, title, category, description });
        return res.json(response);
    });

    return router;
}
