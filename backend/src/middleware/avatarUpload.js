import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function resolveUploadDir() {
  const envDir = String(process.env.AVATAR_UPLOAD_DIR || "").trim();
  const fallbackDir = path.join(process.cwd(), "uploads", "avatars");
  return envDir ? path.resolve(envDir) : fallbackDir;
}

const uploadDir = resolveUploadDir();
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(extension) ? extension : ".jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, uniqueName);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(String(file.mimetype || "").toLowerCase())) {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "avatar"));
    return;
  }

  cb(null, true);
}

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_AVATAR_FILE_SIZE_BYTES,
    files: 1,
  },
});

export function mapAvatarUploadError(error) {
  if (!(error instanceof multer.MulterError)) {
    return null;
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return { status: 400, message: "Avatar file too large. Maximum size is 5MB." };
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return { status: 400, message: "Invalid avatar file type. Allowed: jpg, jpeg, png, webp." };
  }

  return { status: 400, message: "Avatar upload failed." };
}
