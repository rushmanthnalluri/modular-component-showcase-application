import express from "express";
import { sendEmail } from "../model/emailManager.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const toEmail = String(req.body?.toemail || req.body?.toEmail || "").trim();
  const title = String(req.body?.title || "").trim();
  const category = String(req.body?.category || "").trim();
  const description = String(req.body?.description || "").trim();

  if (!toEmail || !title || !category || !description) {
    return res.status(400).json({
      code: 400,
      msg: "title, category, description and toemail are required",
    });
  }

  const response = await sendEmail(toEmail, {
    title,
    category,
    description,
  });
  res.json(response);
});

export default router;
