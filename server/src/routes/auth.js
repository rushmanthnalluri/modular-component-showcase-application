import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName = "", email = "", phone = "", password = "", role = "user" } = req.body || {};

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      return res.status(400).json({ message: "Full name, email and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const normalizedRole = role === "developer" ? "developer" : "user";
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: normalizedRole,
      isVerifiedDeveloper: normalizedRole === "developer",
    });

    return res.status(201).json({ message: "Registration successful." });
  } catch {
    return res.status(500).json({ message: "Unable to register right now." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body || {};

    if (!email.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerifiedDeveloper: Boolean(user.isVerifiedDeveloper),
      },
    });
  } catch {
    return res.status(500).json({ message: "Unable to login right now." });
  }
});

export default router;
