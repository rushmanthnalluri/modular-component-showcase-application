import express from "express";
import { getCaptcha } from "../model/captchaManager.js";

const router = express.Router();

router.get("/getcaptcha/:length", (req, res) => {
  const payload = getCaptcha(req.params.length);
  res.json(payload);
});

export default router;
