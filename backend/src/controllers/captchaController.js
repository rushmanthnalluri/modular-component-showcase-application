import express from "express";
import { getCaptcha } from "../models/captchaManager.js";

const router = express.Router();

function sendCaptchaResponse(res, length = 6) {
  const payload = getCaptcha(Number.isFinite(length) ? length : 6);
  res.json(payload);
}

router.get("/", (_req, res) => {
  try {
    sendCaptchaResponse(res, 6);
  } catch (error) {
    console.error("Captcha generation failed:", error.message);
    res.status(500).json({ message: "Unable to generate captcha." });
  }
});

router.get("/getcaptcha/:length", (req, res) => {
  try {
    const length = Number(req.params.length);
    sendCaptchaResponse(res, length);
  } catch (error) {
    console.error("Captcha generation failed:", error.message);
    res.status(500).json({ message: "Unable to generate captcha." });
  }
});

export default router;
