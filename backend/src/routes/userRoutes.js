import express from "express";
import fs from "node:fs";
import path from "node:path";
import { avatarUpload } from "../middleware/avatarUpload.js";
import { resolvePublicUrl, resolveRequestOrigin } from "../utils/url.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

const EMAIL_MAX_LENGTH = 254;

function text(value) {
  return String(value ?? "").trim();
}

function isValidUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(String(value));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  const candidate = String(value || "").trim();
  if (!candidate || candidate.length > EMAIL_MAX_LENGTH) {
    return false;
  }

  const atIndex = candidate.indexOf("@");
  if (atIndex <= 0 || atIndex !== candidate.lastIndexOf("@") || atIndex === candidate.length - 1) {
    return false;
  }

  const local = candidate.slice(0, atIndex);
  const domain = candidate.slice(atIndex + 1);
  if (!local || !domain || domain.startsWith(".") || domain.endsWith(".")) {
    return false;
  }

  const dotIndex = domain.indexOf(".");
  if (dotIndex <= 0 || dotIndex === domain.length - 1) {
    return false;
  }

  if (candidate.includes(" ") || candidate.includes("\t") || candidate.includes("\n") || candidate.includes("\r")) {
    return false;
  }

  return true;
}

function isSafeMimeSubtype(value) {
  const subtype = String(value || "");
  if (!subtype || subtype.length > 40) {
    return false;
  }

  for (let index = 0; index < subtype.length; index += 1) {
    const code = subtype.charCodeAt(index);
    const isLower = code >= 97 && code <= 122;
    const isUpper = code >= 65 && code <= 90;
    const isDigit = code >= 48 && code <= 57;
    const isAllowedPunctuation = subtype[index] === "." || subtype[index] === "+" || subtype[index] === "-";

    if (!isLower && !isUpper && !isDigit && !isAllowedPunctuation) {
      return false;
    }
  }

  return true;
}

function isSafeBase64Payload(value) {
  const payload = String(value || "");
  if (!payload) {
    return false;
  }

  for (let index = 0; index < payload.length; index += 1) {
    const code = payload.charCodeAt(index);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    const isAllowedPunctuation = payload[index] === "+" || payload[index] === "/" || payload[index] === "=";

    if (!isUpper && !isLower && !isDigit && !isAllowedPunctuation) {
      return false;
    }
  }

  return true;
}

function isValidImageDataUrl(value) {
  const candidate = String(value || "");
  const prefix = "data:image/";
  if (!candidate.startsWith(prefix)) {
    return false;
  }

  const commaIndex = candidate.indexOf(",");
  if (commaIndex <= prefix.length || commaIndex === candidate.length - 1) {
    return false;
  }

  const metadata = candidate.slice(prefix.length, commaIndex);
  const suffix = ";base64";
  if (!metadata.endsWith(suffix)) {
    return false;
  }

  const subtype = metadata.slice(0, -suffix.length);
  const payload = candidate.slice(commaIndex + 1);
  return isSafeMimeSubtype(subtype) && isSafeBase64Payload(payload);
}

function isStoredAvatarPath(value) {
  const avatar = String(value || "");
  return avatar.startsWith("/app/uploads/avatars/") || avatar.startsWith("/uploads/avatars/");
}

function isValidAvatarValue(value) {
  if (!value) {
    return true;
  }

  return isValidUrl(value) || isStoredAvatarPath(value) || isValidImageDataUrl(value);
}

function requestBaseUrl(req) {
  return resolveRequestOrigin(req);
}

function resolveAvatarReference(value, req) {
  const avatar = String(value || "").trim();
  if (!avatar || isValidImageDataUrl(avatar) || isValidUrl(avatar)) {
    return avatar;
  }

  if (isStoredAvatarPath(avatar)) {
    const baseUrl = requestBaseUrl(req);
    const publicPath = `/uploads/avatars/${path.basename(avatar)}`;
    return baseUrl ? resolvePublicUrl(publicPath, baseUrl) : publicPath;
  }

  return avatar;
}

function toAvatarPath(value) {
  if (!isStoredAvatarPath(value)) {
    return "";
  }

  return `/uploads/avatars/${path.basename(String(value))}`;
}

function storedAvatarToFilePath(value) {
  if (!isStoredAvatarPath(value)) {
    return "";
  }

  const baseDir = path.resolve(process.env.AVATAR_UPLOAD_DIR || path.join(process.cwd(), "uploads", "avatars"));
  const filePath = path.resolve(baseDir, path.basename(String(value)));
  return filePath.startsWith(baseDir) ? filePath : "";
}

function successPayload(res, payload = {}, status = 200) {
    return sendSuccess(res, payload, status);
}

function errorPayload(res, code, message, status = 500, details = null) {
    return sendError(res, code, message, status, details);
}

function parseOptionalJsonObject(value, fieldName) {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ok: true, value };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return { ok: true, value: {} };
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ok: true, value: parsed };
      }
    } catch {
      return { ok: false, message: `${fieldName} must be a valid object.` };
    }
  }

  return { ok: false, message: `${fieldName} must be a valid object.` };
}

function toUserPayload(user, req) {
  const storedAvatar = String(user?.avatarImage || "");
  const resolvedAvatar = resolveAvatarReference(storedAvatar, req);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerifiedDeveloper: Boolean(user.isVerifiedDeveloper),
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
    bio: user.bio || "",
    avatarImage: resolvedAvatar,
    avatarUrl: resolvedAvatar,
    avatarPath: toAvatarPath(storedAvatar),
    socialLinks: user.socialLinks || {},
    stats: user.stats || {},
    emailPreferences: user.emailPreferences || {},
  };
}

export function createUserRouter({
  User,
  Component,
  SubmissionHistory,
  requireAuth,
  requireCsrf,
  syncSqlUserAccount = async () => {},
  syncSqlUserFavorites = async () => {},
}) {
  const router = express.Router();

  async function resolveFavoritePublicId(rawComponentId) {
    const value = String(rawComponentId || "").trim();
    if (!value) {
      return "";
    }

    const byPublicId = await Component.findOne({ id: value }).select("id").lean();
    if (byPublicId?.id) {
      return String(byPublicId.id);
    }

    if (/^[a-f0-9]{24}$/i.test(value)) {
      const byMongoId = await Component.findById(value).select("id").lean();
      if (byMongoId?.id) {
        return String(byMongoId.id);
      }
    }

    return value;
  }

  async function normalizeFavoriteIds(ids = []) {
    const normalized = [];
    const seen = new Set();

    for (const entry of Array.isArray(ids) ? ids : []) {
      const resolved = await resolveFavoritePublicId(entry);
      const key = String(resolved || "").trim();
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      normalized.push(key);
    }

    return normalized;
  }

  // GET current user profile
  router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
          return errorPayload(res, "NOT_FOUND", "User not found.", 404);
        }

        const userPayload = toUserPayload(user, req);
        return successPayload(res, { user: userPayload });
    } catch (error) {
        return errorPayload(res, "SERVER_ERROR", "Unable to fetch profile.", 500);
    }
  });

  // UPDATE user profile
  router.put("/me", requireAuth, requireCsrf, avatarUpload.single("avatar"), async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const { fullName, email, phone, bio } = body;

      const socialLinksParse = parseOptionalJsonObject(body.socialLinks, "socialLinks");
      if (!socialLinksParse.ok) {
        return errorPayload(res, "VALIDATION_ERROR", socialLinksParse.message, 400, { socialLinks: "must be a JSON object" });
      }

      const emailPreferencesParse = parseOptionalJsonObject(body.emailPreferences, "emailPreferences");
      if (!emailPreferencesParse.ok) {
        return errorPayload(res, "VALIDATION_ERROR", emailPreferencesParse.message, 400, { emailPreferences: "must be a JSON object" });
      }

      let avatarValue;
      if (req.file?.filename) {
        avatarValue = `/uploads/avatars/${req.file.filename}`;
      } else if (body.avatarUrl !== undefined) {
        avatarValue = String(body.avatarUrl || "").trim();
      } else if (body.avatarImage !== undefined) {
        avatarValue = String(body.avatarImage || "").trim();
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return errorPayload(res, "NOT_FOUND", "User not found.", 404);
      }

      const nextFullName = fullName !== undefined ? text(fullName) : user.fullName;
      const nextEmail = email !== undefined ? text(email).toLowerCase() : user.email;
      const nextPhone = phone !== undefined ? text(phone).replace(/\D/g, "") : user.phone;

      if (!nextFullName) {
        return errorPayload(res, "VALIDATION_ERROR", "Full name is required.", 400, { fullName: "required" });
      }

      if (!isValidEmail(nextEmail)) {
        return errorPayload(res, "VALIDATION_ERROR", "A valid email address is required.", 400, { email: "invalid email address" });
      }

      if (avatarValue !== undefined && !isValidAvatarValue(avatarValue)) {
        return errorPayload(res, "VALIDATION_ERROR", "Avatar must be a valid image URL or uploaded image.", 400, { avatar: "must be a valid image URL or uploaded image" });
      }

      const emailOwner = await User.findOne({ email: nextEmail, _id: { $ne: user._id } }).select("_id");
      if (emailOwner) {
        return errorPayload(res, "CONFLICT", "An account with this email already exists.", 409);
      }

      // Safe avatar replacement: delete old file if it exists and is different
      if (avatarValue !== undefined && user.avatarImage && user.avatarImage !== avatarValue && isStoredAvatarPath(user.avatarImage)) {
          const oldPath = storedAvatarToFilePath(user.avatarImage);
          if (oldPath && fs.existsSync(oldPath)) {
              try {
                  fs.unlinkSync(oldPath);
              } catch (err) {
                  console.warn("Failed to delete old avatar file:", err.message);
              }
          }
      }

      user.fullName = nextFullName.slice(0, 120);
      user.email = nextEmail;
      user.phone = nextPhone.slice(0, 15);

      if (bio !== undefined) {
        user.bio = text(bio).slice(0, 500);
      }
      if (avatarValue !== undefined) {
        user.avatarImage = avatarValue;
      }
      if (socialLinksParse.value !== undefined) {
        const socialLinks = socialLinksParse.value;
        user.socialLinks = {
          twitter: text(socialLinks.twitter),
          github: text(socialLinks.github),
          portfolio: text(socialLinks.portfolio),
        };
      }
      if (emailPreferencesParse.value !== undefined) {
        const emailPreferences = emailPreferencesParse.value;
        user.emailPreferences = {
          newComponents: Boolean(emailPreferences.newComponents),
          reviewComments: Boolean(emailPreferences.reviewComments),
          newsletters: Boolean(emailPreferences.newsletters),
        };
      }

      await user.save();
      await syncSqlUserAccount(user);

      const userPayload = toUserPayload(user, req);
      return successPayload(res, { user: userPayload });
    } catch (error) {
      console.error("Update profile error:", error.message);
      return errorPayload(res, "SERVER_ERROR", "Unable to update profile.", 500);
    }
  });

  // GET user's submitted components
  router.get("/me/components", requireAuth, async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const role = String(req.user?.role || "").toLowerCase();
      const isAdmin = role === "admin";

      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

      const filter = isAdmin ? {} : { createdBy: req.user._id };

      const skip = (parsedPage - 1) * parsedLimit;
      const components = await Component.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean();

      const total = await Component.countDocuments(filter);

      return res.json(successPayload({
        components,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      }));
    } catch (error) {
      console.error("Error fetching user components:", error.message);
      return res.status(500).json(errorPayload("Unable to fetch your components."));
    }
  });

  // GET submission history
  router.get("/me/submission-history", requireAuth, async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
      const skip = (parsedPage - 1) * parsedLimit;
      const history = await SubmissionHistory.find({ userId: req.user._id })
        .populate("componentId", "id name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean();

      const total = await SubmissionHistory.countDocuments({ userId: req.user._id });

      return res.json(successPayload({
        history,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      }));
    } catch (error) {
      console.error("Error fetching submission history:", error.message);
      return res.status(500).json(errorPayload("Unable to fetch submission history."));
    }
  });

  // GET favorites
  router.get("/me/favorites", requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id).select("favorites");
    if (!user) {
      return res.status(404).json(errorPayload("User not found."));
    }

    const currentFavorites = Array.isArray(user.favorites) ? user.favorites : [];
    const normalizedFavorites = await normalizeFavoriteIds(currentFavorites);

    if (JSON.stringify(currentFavorites) !== JSON.stringify(normalizedFavorites)) {
      user.favorites = normalizedFavorites;
      await user.save();
      await syncSqlUserFavorites(user, normalizedFavorites);
    }

    return res.json(successPayload({
      favorites: normalizedFavorites,
    }));
  });

  // TOGGLE favorite
  router.post("/me/favorites/:componentId", requireAuth, requireCsrf, async (req, res) => {
    const componentId = String(req.params.componentId || "").trim();
    if (!componentId) {
      return res.status(400).json(errorPayload("componentId is required."));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(errorPayload("User not found."));
    }

    const normalizedComponentId = await resolveFavoritePublicId(componentId);
    const favorites = await normalizeFavoriteIds(Array.isArray(user.favorites) ? user.favorites : []);
    const existingIndex = favorites.indexOf(normalizedComponentId);
    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
    } else {
      favorites.push(normalizedComponentId);
    }

    user.favorites = favorites;
    await user.save();
    await syncSqlUserAccount(user);
    await syncSqlUserFavorites(user, favorites);

    return res.json(successPayload({ favorites }));
  });

  // GET favorite components with details
  router.get("/me/favorites/components", requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("favorites");
      if (!user) {
        return res.status(404).json(errorPayload("User not found."));
      }

      const favorites = await normalizeFavoriteIds(Array.isArray(user.favorites) ? user.favorites : []);

      if (JSON.stringify(user.favorites || []) !== JSON.stringify(favorites)) {
        user.favorites = favorites;
        await user.save();
        await syncSqlUserFavorites(user, favorites);
      }

      const components = await Component.find({ id: { $in: favorites } })
        .lean();

      return res.json(successPayload({ components }));
    } catch (error) {
      console.error("Error fetching favorite components:", error.message);
      return res.status(500).json(errorPayload("Unable to fetch favorites."));
    }
  });

  return router;
}

