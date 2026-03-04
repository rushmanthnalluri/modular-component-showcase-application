import { Router } from "express";
import Component from "../models/Component.js";
import { requireAuth, requireDeveloper } from "../middleware/auth.js";
import { createComponentId } from "../utils/slug.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const items = await Component.find({}).sort({ createdAt: -1 }).lean();
    return res.json(items);
  } catch {
    return res.status(500).json({ message: "Unable to fetch components." });
  }
});

router.post("/", requireAuth, requireDeveloper, async (req, res) => {
  try {
    const {
      name = "",
      description = "",
      category = "",
      jsxCode = "",
      cssCode = "",
      thumbnail = "",
      screenshot = "",
    } = req.body || {};

    if (!name.trim() || !description.trim() || !category.trim() || !jsxCode.trim()) {
      return res.status(400).json({ message: "Name, description, category and JSX code are required." });
    }

    const component = await Component.create({
      id: createComponentId(name),
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      tags: [category.trim(), "user-added", ...name.trim().toLowerCase().split(/\s+/)].slice(0, 5),
      thumbnail: String(thumbnail || ""),
      screenshot: String(screenshot || ""),
      code: {
        jsx: jsxCode.trim(),
        css: String(cssCode || "").trim(),
      },
      createdBy: req.user.id,
    });

    return res.status(201).json(component);
  } catch {
    return res.status(500).json({ message: "Unable to save component right now." });
  }
});

export default router;
