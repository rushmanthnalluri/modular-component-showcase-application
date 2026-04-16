import express from "express";
import { getCaptcha } from "../models/captchaManager.js";

const router = express.Router();

router.get("/getcaptcha/:length", (req, res) => {
  try {
    const length = Number(req.params.length);
    const payload = getCaptcha(Number.isFinite(length) ? length : 6);
    res.json(payload);
  } catch (error) {
    console.error("Captcha generation failed:", error.message);
    res.status(500).json({ message: "Unable to generate captcha." });
  }
});

export default router;
