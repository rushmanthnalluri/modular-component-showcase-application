import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select(
      "fullName email phone role isVerifiedDeveloper"
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid token." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
}

export function requireDeveloper(req, res, next) {
  const role = String(req.user?.role || "").toLowerCase();
  const canAdd = role === "admin" || role === "developer" || Boolean(req.user?.isVerifiedDeveloper);

  if (!canAdd) {
    return res.status(403).json({ message: "Only developers can add components." });
  }

  next();
}
