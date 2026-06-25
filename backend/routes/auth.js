import express from "express";
import bcrypt from "bcryptjs";
import User, { validateRegister, validateLogin } from "../models/User.js";
import requireSession from "../middleware/auth.js";

const router = express.Router();


router.post("/register", async (req, res) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    req.session.userId = user._id.toString();

    return res.status(201).json({ message: "ok" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Bu mail adresiyle zaten bir kullanıcı mevcut" });
    }
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    let { email, password } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email veya şifre hatalı" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Email veya şifre hatalı" });

    req.session.userId = user._id.toString();

    return res.json({ message: "ok" });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});


router.get("/me", requireSession, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const inProgressObj = Object.fromEntries((user.inProgress || new Map()));
    const ratingsObj = Object.fromEntries(user.ratings || new Map());

    return res.json({ ...user.toObject(), inProgress: inProgressObj, ratings: ratingsObj });
  } catch (err) {
    console.error("ME ERROR:", err);
    return res.sendStatus(500);
  }
});


router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.sendStatus(204);
  });
});

export default router;