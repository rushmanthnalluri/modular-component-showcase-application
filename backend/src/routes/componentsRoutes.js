import express from "express";
import crypto from "crypto";
import { createComponentId, validateComponentPayload } from "../utils/validation.js";

export function createComponentsRouter({
    Component,
    Rating,
    Review,
    Discussion,
    ComponentView,
    ComponentDependency,
    SubmissionHistory,
    User,
    sendAnnouncementEmail,
    writeLimiter,
    requireAuth,
    requireDeveloper,
    requireCsrf,
    syncSqlRating = async () => {},
    syncSqlReview = async () => {},
    syncSqlDiscussion = async () => {},
    syncSqlUserAccount = async () => {},
}) {
    const router = express.Router();
    const announcementQueue = new Map();
    let flushTimer = null;
    const ALLOWED_LIST_CATEGORIES = new Set([
        "buttons",
        "cards",
        "forms",
        "navigation",
        "feedback",
        "data",
    ]);
    const COMPONENT_PUBLIC_ID_REGEX = /^[a-z0-9-]{3,160}$/;

    function escapeRegex(value) {
        return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function toSafeInteger(value, { defaultValue, min, max }) {
        const parsed = Number.parseInt(String(value ?? ""), 10);
        if (!Number.isFinite(parsed)) {
            return defaultValue;
        }
        return Math.min(max, Math.max(min, parsed));
    }

    function normalizePublicComponentId(value) {
        const normalized = String(value || "").trim().toLowerCase();
        if (!COMPONENT_PUBLIC_ID_REGEX.test(normalized)) {
            return "";
        }
        return normalized;
    }

    // Helper to track view
    async function trackView(componentId, userId = null, req = null) {
        try {
            const viewRecord = await ComponentView.create({
                componentId,
                userId,
                sessionId: req?.sessionID || null,
                ipHash: req ? crypto.createHash("sha256").update(req.ip || "").digest("hex") : null,
            });
            
            // Update component view count
            await Component.findByIdAndUpdate(componentId, { $inc: { viewCount: 1 } });
            return viewRecord;
        } catch (error) {
            console.error("Error tracking view:", error.message);
        }
    }

    async function flushAnnouncementQueue() {
        const pending = Array.from(announcementQueue.entries());
        announcementQueue.clear();
        flushTimer = null;

        const sends = pending.map(([email, values]) => {
            const list = values.slice(0, 8).map((entry) => `<li><strong>${entry.name}</strong> (${entry.category})</li>`).join("");
            return sendAnnouncementEmail({
                toEmail: email,
                subject: "New Components Digest",
                markdown: `New components this cycle: ${values.map((entry) => entry.name).join(", ")}`,
                html: `<h3>New Components Published</h3><ul>${list}</ul>`,
            });
        });

        await Promise.allSettled(sends);
    }

    function queueAnnouncement(toEmail, item) {
        if (!announcementQueue.has(toEmail)) {
            announcementQueue.set(toEmail, []);
        }
        announcementQueue.get(toEmail).push({ name: item.name, category: item.category });

        if (!flushTimer) {
            flushTimer = setTimeout(() => {
                flushAnnouncementQueue().catch((error) => {
                    console.error("Announcement queue flush failed:", error.message);
                });
            }, 30000);
        }
    }

    async function notifyNewComponent(item, authorId) {
        try {
            if (!sendAnnouncementEmail || !User) {
                return;
            }

            const recipients = await User.find({
                _id: { $ne: authorId },
                "emailPreferences.newComponents": true,
            })
                .select("email fullName")
                .limit(100)
                .lean();

            recipients.forEach((recipient) => {
                if (recipient?.email) {
                    queueAnnouncement(recipient.email, item);
                }
            });
        } catch (error) {
            console.error("Component announcement failed:", error.message);
        }
    }

    // GET all components with advanced filtering
    router.get("/", async (req, res) => {
        try {
            const { search, category, tags, sortBy, minRating, page = 1, limit = 20 } = req.query;
            const safeSearch = String(search || "").trim().slice(0, 80);
            const safeCategory = String(category || "").trim().toLowerCase();
            const safePage = toSafeInteger(page, { defaultValue: 1, min: 1, max: 100000 });
            const safeLimit = toSafeInteger(limit, { defaultValue: 20, min: 1, max: 50 });
            const parsedMinRating = Number.parseFloat(String(minRating ?? ""));
            const safeMinRating = Number.isFinite(parsedMinRating)
                ? Math.min(5, Math.max(0, parsedMinRating))
                : null;
            
            let query = { isPublished: true };

            // Search by name or description
            if (safeSearch) {
                const safeSearchRegex = new RegExp(escapeRegex(safeSearch), "i");
                query.$or = [
                    { name: safeSearchRegex },
                    { description: safeSearchRegex },
                    { tags: { $in: [safeSearchRegex] } },
                ];
            }

            // Filter by category
            if (safeCategory && safeCategory !== "all" && ALLOWED_LIST_CATEGORIES.has(safeCategory)) {
                query.category = safeCategory;
            }

            // Filter by tags
            if (tags) {
                const tagArray = (Array.isArray(tags) ? tags : [tags])
                    .map((tag) => String(tag || "").trim().toLowerCase())
                    .filter((tag) => /^[a-z0-9-]{1,24}$/.test(tag))
                    .slice(0, 12);
                if (tagArray.length > 0) {
                query.tags = { $in: tagArray };
                }
            }

            // Filter by minimum rating
            if (safeMinRating !== null) {
                query.averageRating = { $gte: safeMinRating };
            }

            // Sort logic
            let sortOption = { createdAt: -1 };
            if (sortBy === "popularity") {
                sortOption = { viewCount: -1 };
            } else if (sortBy === "rating") {
                sortOption = { averageRating: -1 };
            } else if (sortBy === "recent") {
                sortOption = { updatedAt: -1 };
            } else if (sortBy === "trending") {
                // More complex trending logic could go here
                sortOption = { viewCount: -1, averageRating: -1 };
            }

            const skip = (safePage - 1) * safeLimit;
            const items = await Component.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(safeLimit)
                .lean();

            const total = await Component.countDocuments(query);

            return res.json({
                items,
                pagination: {
                    total,
                    page: safePage,
                    limit: safeLimit,
                    pages: Math.ceil(total / safeLimit),
                },
            });
        } catch (error) {
            console.error("Fetch components error:", error.message);
            return res.status(500).json({ message: "Unable to fetch components." });
        }
    });

    // GET most viewed components
    router.get("/stats/most-viewed", async (req, res) => {
        try {
            const { limit = 10, timeframe = "all" } = req.query;
            let createdAfter = null;

            if (timeframe === "week") {
                createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            } else if (timeframe === "month") {
                createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            }

            let query = { isPublished: true };
            if (createdAfter) {
                query.createdAt = { $gte: createdAfter };
            }

            const items = await Component.find(query)
                .sort({ viewCount: -1 })
                .limit(parseInt(limit))
                .lean();

            return res.json(items);
        } catch (error) {
            console.error("Error fetching most viewed components:", error.message);
            return res.status(500).json({ message: "Unable to fetch statistics." });
        }
    });

    // GET top-rated components
    router.get("/stats/top-rated", async (req, res) => {
        try {
            const { limit = 10, minReviews = 1 } = req.query;

            const items = await Component.find({
                isPublished: true,
                totalReviews: { $gte: parseInt(minReviews) },
            })
                .sort({ averageRating: -1 })
                .limit(parseInt(limit))
                .lean();

            return res.json(items);
        } catch (error) {
            console.error("Error fetching top-rated components:", error.message);
            return res.status(500).json({ message: "Unable to fetch statistics." });
        }
    });

    // GET single component with detailed info
    router.get("/:id", async (req, res) => {
        try {
            const component = await Component.findOne({ id: req.params.id })
                .populate("createdBy", "fullName email avatarUrl stats")
                .lean();

            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            await trackView(component._id, req.user?._id || null, req);

            const [reviews, dependencies] = await Promise.all([
                Review.find({ componentId: component._id, status: "approved" })
                    .populate("userId", "fullName avatarUrl")
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .lean(),
                ComponentDependency.find({ componentId: component._id })
                    .populate("dependencyId", "name id category")
                    .lean(),
            ]);

            return res.json({
                ...component,
                reviews,
                dependencies,
                versionHistory: component.versions || [],
            });
        } catch (error) {
            console.error("Fetch component error:", error.message);
            return res.status(500).json({ message: "Unable to fetch component." });
        }
    });

    // CREATE new component
    router.post("/", writeLimiter, requireAuth, requireCsrf, requireDeveloper, async (req, res) => {
        try {
            const validation = validateComponentPayload(req.body || {});
            if (!validation.ok) {
                return res.status(400).json({ message: validation.message });
            }

            const {
                name,
                description,
                descriptionMarkdown,
                category,
                tags,
                jsxCode,
                cssCode,
                thumbnail,
                screenshot,
                props,
                usageExamples,
                bestPractices,
                commonPitfalls,
                dependencies,
                relatedComponents,
                importStatements,
            } = validation.data;

            const componentId = createComponentId(name);

            const item = await Component.create({
                id: componentId,
                name,
                description,
                descriptionMarkdown: descriptionMarkdown || "",
                category,
                tags: Array.from(
                    new Set([
                        category,
                        "user-added",
                        ...String(name).toLowerCase().split(/\s+/).filter(Boolean),
                        ...(Array.isArray(tags) ? tags : []),
                    ])
                ).slice(0, 12),
                thumbnail,
                screenshot,
                code: {
                    jsx: jsxCode,
                    css: cssCode,
                },
                version: "1.0.0",
                versions: [
                    {
                        version: "1.0.0",
                        code: { jsx: jsxCode, css: cssCode },
                        changelog: "Initial version",
                        createdAt: new Date(),
                    },
                ],
                props: props || [],
                usageExamples: usageExamples || [],
                bestPractices: bestPractices || [],
                commonPitfalls: commonPitfalls || [],
                dependencies: dependencies || [],
                relatedComponents: relatedComponents || [],
                importStatements: importStatements || {},
                createdBy: req.user._id,
            });

            // Track submission history
            await SubmissionHistory.create({
                userId: req.user._id,
                componentId: item._id,
                action: "created",
                changes: { name, category, tags },
            });

            await notifyNewComponent(item, req.user._id);

            return res.status(201).json(item);
        } catch (error) {
            console.error("Create component error:", error.message, error.stack);
            return res.status(500).json({ message: "Unable to save component right now." });
        }
    });

    // UPDATE component
    router.put("/:id", writeLimiter, requireAuth, requireCsrf, async (req, res) => {
        try {
            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const isOwner = String(component.createdBy) === String(req.user._id);
            const isAdmin = String(req.user.role).toLowerCase() === "admin";
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ message: "You can only edit your own components." });
            }

            const {
                name,
                description,
                descriptionMarkdown,
                category,
                tags,
                jsxCode,
                cssCode,
                thumbnail,
                screenshot,
                changelog,
                props,
                usageExamples,
                bestPractices,
                commonPitfalls,
                dependencies,
                relatedComponents,
                importStatements,
            } = req.body;

            // Track changes for history
            const changes = {};
            if (name && name !== component.name) changes.name = { from: component.name, to: name };
            if (description && description !== component.description) changes.description = { from: component.description, to: description };
            if (category && category !== component.category) changes.category = { from: component.category, to: category };

            // If code changed, create new version
            let newVersion = component.version;
            if (jsxCode !== component.code.jsx || cssCode !== component.code.css) {
                const versionParts = component.version.split(".");
                versionParts[2] = parseInt(versionParts[2] || 0) + 1;
                newVersion = versionParts.join(".");

                component.versions.push({
                    version: newVersion,
                    code: { jsx: component.code.jsx, css: component.code.css },
                    changelog: changelog || `Updated to ${newVersion}`,
                    createdAt: new Date(),
                });
            }

            // Update component
            Object.assign(component, {
                name: name || component.name,
                description: description || component.description,
                descriptionMarkdown: descriptionMarkdown !== undefined ? descriptionMarkdown : component.descriptionMarkdown,
                category: category || component.category,
                tags: tags || component.tags,
                code: {
                    jsx: jsxCode || component.code.jsx,
                    css: cssCode || component.code.css,
                },
                thumbnail: thumbnail !== undefined ? thumbnail : component.thumbnail,
                screenshot: screenshot !== undefined ? screenshot : component.screenshot,
                version: newVersion,
                props: props || component.props,
                usageExamples: usageExamples || component.usageExamples,
                bestPractices: bestPractices || component.bestPractices,
                commonPitfalls: commonPitfalls || component.commonPitfalls,
                dependencies: dependencies || component.dependencies,
                relatedComponents: relatedComponents || component.relatedComponents,
                importStatements: importStatements || component.importStatements,
            });

            await component.save();

            // Track submission history
            await SubmissionHistory.create({
                userId: req.user._id,
                componentId: component._id,
                action: "updated",
                changes,
                reason: changelog,
            });

            return res.json(component);
        } catch (error) {
            console.error("Update component error:", error.message);
            return res.status(500).json({ message: "Unable to update component." });
        }
    });

    // DELETE component
    router.delete("/:id", writeLimiter, requireAuth, requireCsrf, async (req, res) => {
        try {
            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const isOwner = String(component.createdBy) === String(req.user._id);
            const isAdmin = String(req.user.role).toLowerCase() === "admin";
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ message: "You can only delete your own components." });
            }

            // Track submission history
            await SubmissionHistory.create({
                userId: req.user._id,
                componentId: component._id,
                action: "deleted",
                changes: { name: component.name, category: component.category },
            });

            await Component.deleteOne({ id: req.params.id });
            return res.json({ message: "Component deleted." });
        } catch (error) {
            console.error("Delete component error:", error.message);
            return res.status(500).json({ message: "Unable to delete component." });
        }
    });

    // Add rating
    router.post("/:id/ratings", requireAuth, requireCsrf, async (req, res) => {
        try {
            const { rating } = req.body;
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: "Rating must be between 1 and 5." });
            }

            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            // Update or create rating
            const existingRating = await Rating.findOne({
                componentId: component._id,
                userId: req.user._id,
            });

            if (existingRating) {
                existingRating.rating = rating;
                await existingRating.save();
            } else {
                await Rating.create({
                    componentId: component._id,
                    userId: req.user._id,
                    rating,
                });
            }

            const user = (await User.findById(req.user._id).lean()) || req.user;
            await syncSqlUserAccount(user);
            const latestRating = existingRating || (await Rating.findOne({ componentId: component._id, userId: req.user._id }).lean());
            await syncSqlRating(latestRating, { user, componentMongoId: component.id });

            // Recalculate average rating
            const ratings = await Rating.find({ componentId: component._id });
            const average = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : 0;

            component.averageRating = average;
            await component.save();

            return res.json({ rating: average, totalRatings: ratings.length });
        } catch (error) {
            console.error("Rating error:", error.message);
            return res.status(500).json({ message: "Unable to save rating." });
        }
    });

    // Get ratings
    router.get("/:id/ratings", async (req, res) => {
        try {
            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const ratings = await Rating.find({ componentId: component._id }).lean();
            const average = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : 0;

            return res.json({
                average,
                total: ratings.length,
                ratings: ratings.map(r => ({ userId: r.userId, rating: r.rating })),
            });
        } catch (error) {
            console.error("Error fetching ratings:", error.message);
            return res.status(500).json({ message: "Unable to fetch ratings." });
        }
    });

    // Add review/comment
    router.post("/:id/reviews", requireAuth, requireCsrf, async (req, res) => {
        try {
            const { rating, title, comment } = req.body;
            if (!rating || !comment || rating < 1 || rating > 5) {
                return res.status(400).json({ message: "Invalid review data." });
            }

            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const review = await Review.create({
                componentId: component._id,
                userId: req.user._id,
                rating,
                title: title || "",
                comment,
                isVerified: false,
            });

            const user = (await User.findById(req.user._id).lean()) || req.user;
            await syncSqlUserAccount(user);
            await syncSqlReview(review, { user, componentMongoId: component.id });

            // Update total reviews count
            const reviewCount = await Review.countDocuments({ componentId: component._id, status: "approved" });
            component.totalReviews = reviewCount;
            await component.save();

            const populated = await review.populate("userId", "fullName avatarUrl");
            return res.status(201).json(populated);
        } catch (error) {
            console.error("Review error:", error.message);
            return res.status(500).json({ message: "Unable to save review." });
        }
    });

    // Get reviews
    router.get("/:id/reviews", async (req, res) => {
        try {
            const { sort = "helpful", page = 1, limit = 10 } = req.query;
            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            let sortOption = { createdAt: -1 };
            if (sort === "helpful") {
                sortOption = { helpful: -1, createdAt: -1 };
            } else if (sort === "recent") {
                sortOption = { createdAt: -1 };
            } else if (sort === "rating") {
                sortOption = { rating: -1 };
            }

            const skip = (page - 1) * limit;
            const reviews = await Review.find({ componentId: component._id, status: "approved" })
                .populate("userId", "fullName avatarUrl email")
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            const total = await Review.countDocuments({ componentId: component._id, status: "approved" });

            return res.json({
                reviews,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error("Error fetching reviews:", error.message);
            return res.status(500).json({ message: "Unable to fetch reviews." });
        }
    });

    // Mark review as helpful
    router.post("/:componentId/reviews/:reviewId/helpful", requireAuth, requireCsrf, async (req, res) => {
        try {
            const review = await Review.findById(req.params.reviewId);
            if (!review) {
                return res.status(404).json({ message: "Review not found." });
            }

            const { helpful } = req.body;
            if (helpful === true) {
                review.helpful = (review.helpful || 0) + 1;
            } else if (helpful === false) {
                review.unhelpful = (review.unhelpful || 0) + 1;
            }

            await review.save();
            const component = await Component.findOne({ id: req.params.componentId }).select("id").lean();
            const user = (await User.findById(req.user._id).lean()) || req.user;
            await syncSqlUserAccount(user);
            await syncSqlReview(review, { user, componentMongoId: component?.id || req.params.componentId });
            return res.json(review);
        } catch (error) {
            console.error("Error marking review:", error.message);
            return res.status(500).json({ message: "Unable to update review." });
        }
    });

    // Add component dependencies
    router.post("/:id/dependencies", writeLimiter, requireAuth, requireCsrf, async (req, res) => {
        try {
            const dependencyId = normalizePublicComponentId(req.body?.dependencyId);
            const type = String(req.body?.type || "").trim();
            if (!dependencyId || !["requires", "suggested", "alternative"].includes(type)) {
                return res.status(400).json({ message: "Invalid dependency data." });
            }

            const sourceComponentId = normalizePublicComponentId(req.params.id);
            if (!sourceComponentId) {
                return res.status(400).json({ message: "Invalid component id." });
            }

            const component = await Component.findOne({ id: sourceComponentId });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const isOwner = String(component.createdBy) === String(req.user._id);
            if (!isOwner) {
                return res.status(403).json({ message: "Only the component author can add dependencies." });
            }

            const dependencyComponent = await Component.findOne({ id: dependencyId }).select("_id");
            if (!dependencyComponent) {
                return res.status(404).json({ message: "Dependency component not found." });
            }

            const dependency = await ComponentDependency.create({
                componentId: component._id,
                dependencyId: dependencyComponent._id,
                type,
            });

            return res.status(201).json(dependency);
        } catch (error) {
            console.error("Error adding dependency:", error.message);
            return res.status(500).json({ message: "Unable to add dependency." });
        }
    });

    // Get component dependencies
    router.get("/:id/dependencies", async (req, res) => {
        try {
            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const dependencies = await ComponentDependency.find({ componentId: component._id })
                .populate("dependencyId", "id name category averageRating viewCount")
                .lean();

            return res.json({ dependencies });
        } catch (error) {
            console.error("Error fetching dependencies:", error.message);
            return res.status(500).json({ message: "Unable to fetch dependencies." });
        }
    });

    // Discussion thread: list
    router.get("/:id/discussions", async (req, res) => {
        try {
            const component = await Component.findOne({ id: req.params.id }).select("_id");
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const threads = await Discussion.find({ componentId: component._id, status: "active" })
                .populate("userId", "fullName avatarUrl")
                .sort({ createdAt: -1 })
                .lean();

            return res.json({ discussions: threads });
        } catch (error) {
            console.error("Error fetching discussions:", error.message);
            return res.status(500).json({ message: "Unable to fetch discussions." });
        }
    });

    // Discussion thread: create
    router.post("/:id/discussions", requireAuth, requireCsrf, async (req, res) => {
        try {
            const message = String(req.body?.message || "").trim();
            const parentId = req.body?.parentId || null;
            if (!message) {
                return res.status(400).json({ message: "Message is required." });
            }

            const component = await Component.findOne({ id: req.params.id }).select("_id");
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const discussion = await Discussion.create({
                componentId: component._id,
                userId: req.user._id,
                parentId,
                message,
            });

            const user = (await User.findById(req.user._id).lean()) || req.user;
            await syncSqlUserAccount(user);
            await syncSqlDiscussion(discussion, { user, componentMongoId: component.id });

            const populated = await discussion.populate("userId", "fullName avatarUrl");
            return res.status(201).json(populated);
        } catch (error) {
            console.error("Error creating discussion:", error.message);
            return res.status(500).json({ message: "Unable to create discussion." });
        }
    });

    // Discussion moderation: hide own/admin messages
    router.patch("/:id/discussions/:discussionId", requireAuth, requireCsrf, async (req, res) => {
        try {
            const discussion = await Discussion.findById(req.params.discussionId);
            if (!discussion) {
                return res.status(404).json({ message: "Discussion not found." });
            }

            const isOwner = String(discussion.userId) === String(req.user._id);
            const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ message: "Not allowed to moderate this message." });
            }

            discussion.status = req.body?.status === "active" ? "active" : "hidden";
            await discussion.save();

            const component = await Component.findById(discussion.componentId).select("id").lean();
            const user = (await User.findById(req.user._id).lean()) || req.user;
            await syncSqlUserAccount(user);
            await syncSqlDiscussion(discussion, { user, componentMongoId: component?.id || "" });

            return res.json({ status: discussion.status });
        } catch (error) {
            console.error("Error moderating discussion:", error.message);
            return res.status(500).json({ message: "Unable to moderate discussion." });
        }
    });

    // Get component export (for download)
    router.get("/:id/export", async (req, res) => {
        try {
            const { format = "jsx" } = req.query;
            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            let exportContent = "";

            if (format === "jsx") {
                exportContent = component.code.jsx;
            } else if (format === "css") {
                exportContent = component.code.css;
            } else if (format === "package") {
                // Generate a complete package structure
                const packageJson = {
                    name: `${component.id}-component`,
                    version: component.version,
                    description: component.description,
                    main: "index.js",
                    author: component.createdBy,
                };

                exportContent = JSON.stringify(packageJson, null, 2);
            } else if (format === "bundle") {
                // Create a bundled format with both JSX and CSS
                exportContent = `/**
 * ${component.name}
 * Version: ${component.version}
 * Description: ${component.description}
 */

/* JSX CODE */
${component.code.jsx}

/* CSS CODE */
${component.code.css}`;
            }

            res.setHeader("Content-Type", "text/plain");
            res.setHeader("Content-Disposition", `attachment; filename="${component.id}.${format === "css" ? "css" : "jsx"}"`);
            return res.send(exportContent);
        } catch (error) {
            console.error("Error exporting component:", error.message);
            return res.status(500).json({ message: "Unable to export component." });
        }
    });

    return router;
}
