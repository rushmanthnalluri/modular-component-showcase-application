import express from "express";
import { sendEmail } from "../model/emailManager.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const toEmail = String(req.body?.toemail || req.body?.toEmail || "").trim();
  if (!toEmail) {
    return res.status(400).json({ code: 400, msg: "toemail is required" });
  }

  const response = await sendEmail(toEmail);
  res.json(response);
});

export default router;
