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

        const { toEmail, title, category, description } = validation.data;
        const response = await sendEmail(toEmail, { title, category, description });
        return res.json(response);
    });

    return router;
}
