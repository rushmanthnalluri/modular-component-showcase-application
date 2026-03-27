import express from "express";

export function createUserRouter({ User, requireAuth, requireCsrf }) {
  const router = express.Router();

  router.get("/me", requireAuth, async (req, res) => {
    return res.json({
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isVerifiedDeveloper: Boolean(req.user.isVerifiedDeveloper),
        favorites: Array.isArray(req.user.favorites) ? req.user.favorites : [],
      },
    });
  });

  router.get("/me/favorites", requireAuth, async (req, res) => {
    return res.json({
      favorites: Array.isArray(req.user.favorites) ? req.user.favorites : [],
    });
  });

  router.post("/me/favorites/:componentId", requireAuth, requireCsrf, async (req, res) => {
    const componentId = String(req.params.componentId || "").trim();
    if (!componentId) {
      return res.status(400).json({ message: "componentId is required." });
    }

    const user = await User.findById(req.user.id).select("favorites");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const favorites = Array.isArray(user.favorites) ? user.favorites : [];
    const existingIndex = favorites.indexOf(componentId);
    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
    } else {
      favorites.push(componentId);
    }

    user.favorites = favorites;
    await user.save();

    return res.json({ favorites });
  });

  return router;
}

