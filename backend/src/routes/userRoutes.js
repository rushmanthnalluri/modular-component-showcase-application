import express from "express";

export function createUserRouter({
  User,
  Component,
  SubmissionHistory,
  Review,
  requireAuth,
  requireCsrf,
}) {
  const router = express.Router();

  // GET current user profile
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
        bio: req.user.bio || "",
        avatarUrl: req.user.avatarUrl || "",
        socialLinks: req.user.socialLinks || {},
        stats: req.user.stats || {},
        emailPreferences: req.user.emailPreferences || {},
      },
    });
  });

  // UPDATE user profile
  router.put("/me", requireAuth, requireCsrf, async (req, res) => {
    try {
      const { bio, socialLinks, emailPreferences, avatarUrl } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (bio !== undefined) {
        user.bio = String(bio || "").trim().slice(0, 500);
      }
      if (avatarUrl !== undefined) {
        user.avatarUrl = String(avatarUrl || "").trim();
      }
      if (socialLinks) {
        user.socialLinks = {
          twitter: String(socialLinks.twitter || "").trim(),
          github: String(socialLinks.github || "").trim(),
          portfolio: String(socialLinks.portfolio || "").trim(),
        };
      }
      if (emailPreferences) {
        user.emailPreferences = {
          newComponents: Boolean(emailPreferences.newComponents),
          reviewComments: Boolean(emailPreferences.reviewComments),
          newsletters: Boolean(emailPreferences.newsletters),
        };
      }

      await user.save();

      return res.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          socialLinks: user.socialLinks,
          emailPreferences: user.emailPreferences,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error.message);
      return res.status(500).json({ message: "Unable to update profile." });
    }
  });

  // GET user dashboard
  router.get("/me/dashboard", requireAuth, async (req, res) => {
    try {
      // Get submitted components
      const submittedComponents = await Component.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

      // Get submission history
      const submissionHistory = await SubmissionHistory.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      // Get user's reviews
      const userReviews = await Review.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Calculate statistics
      const totalComponentsViewed = await Component.aggregate([
        { $match: { createdBy: req.user._id } },
        { $group: { _id: null, totalViews: { $sum: "$viewCount" } } },
      ]);

      const averageRating = submittedComponents.length > 0
        ? submittedComponents.reduce((sum, c) => sum + (c.averageRating || 0), 0) / submittedComponents.length
        : 0;

      return res.json({
        stats: {
          totalComponentsSubmitted: submittedComponents.length,
          totalComponentsViewed: totalComponentsViewed[0]?.totalViews || 0,
          averageRating: averageRating.toFixed(2),
          totalReviewsReceived: await Review.countDocuments({
            componentId: { $in: submittedComponents.map(c => c._id) },
          }),
        },
        components: submittedComponents,
        recentHistory: submissionHistory,
        userReviews,
      });
    } catch (error) {
      console.error("Dashboard error:", error.message);
      return res.status(500).json({ message: "Unable to fetch dashboard." });
    }
  });

  // GET user's submitted components
  router.get("/me/components", requireAuth, async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const skip = (page - 1) * limit;
      const components = await Component.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Component.countDocuments({ createdBy: req.user._id });

      return res.json({
        components,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching user components:", error.message);
      return res.status(500).json({ message: "Unable to fetch your components." });
    }
  });

  // GET submission history
  router.get("/me/submission-history", requireAuth, async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const skip = (page - 1) * limit;
      const history = await SubmissionHistory.find({ userId: req.user._id })
        .populate("componentId", "id name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await SubmissionHistory.countDocuments({ userId: req.user._id });

      return res.json({
        history,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching submission history:", error.message);
      return res.status(500).json({ message: "Unable to fetch submission history." });
    }
  });

  // GET favorites
  router.get("/me/favorites", requireAuth, async (req, res) => {
    return res.json({
      favorites: Array.isArray(req.user.favorites) ? req.user.favorites : [],
    });
  });

  // TOGGLE favorite
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

  // GET favorite components with details
  router.get("/me/favorites/components", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("favorites");
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const favorites = Array.isArray(user.favorites) ? user.favorites : [];

      const components = await Component.find({ id: { $in: favorites } })
        .lean();

      return res.json({ components });
    } catch (error) {
      console.error("Error fetching favorite components:", error.message);
      return res.status(500).json({ message: "Unable to fetch favorites." });
    }
  });

  return router;
}

