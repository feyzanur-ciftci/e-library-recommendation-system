import express from "express";
import User from "../models/User.js";
import requireSession from "../middleware/auth.js";
import fetch from "node-fetch";

const router = express.Router();

router.post("/reading-progress", requireSession, async (req, res) => {
  try {
    const { bookId, progress, title } = req.body;

    const bookIdNum = Number(bookId);
    const bookIdStr = String(bookIdNum);
    const prog = Number(progress);

    if (!Number.isFinite(bookIdNum) || bookIdNum <= 0) {
      return res.status(400).json({ message: "Geçersiz bookId" });
    }
    if (!Number.isFinite(prog) || prog < 0 || prog > 100) {
      return res.status(400).json({ message: "Geçersiz progress" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (prog === 100) {
      const exists = user.completed.some(b => b.bookId === bookIdNum);
      if (!exists && title) {
        user.completed.push({ bookId: bookIdNum, title: title });
      } 
      user.inProgress.delete(bookIdStr);
      user.toRead = user.toRead.filter((b) => b !== bookIdNum);
    } else {
      user.toRead = user.toRead.filter((b) => b !== bookIdNum);
      user.inProgress.set(bookIdStr, prog);
      user.completed = user.completed.filter((b) => b.bookId !== bookIdNum);  
    }

    await user.save();

    const inProgressObj = Object.fromEntries(user.inProgress.entries()); 

    return res.json({  
      completed: user.completed,
      inProgress: inProgressObj,
      toRead: user.toRead,
    });
  } catch (err) {
    console.error("Reading progress error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/progress/:bookId", requireSession, async (req, res) => {
  try {
    const bookIdStr = String(req.params.bookId);
    const user = await User.findById(req.userId);   
    if (!user) return res.status(404).json({ message: "User not found" });

    const progress = Number(user.inProgress?.get(bookIdStr) ?? 0); 
    return res.json({ progress });
  } catch (err) {
    console.error("Progress error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/toread", requireSession, async (req, res) => {
  try {
    const id = Number(req.body.bookId);
    if (!id) return res.status(400).json({ message: "Geçersiz bookId" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const exists = user.toRead.includes(id);
    user.toRead = exists ? user.toRead.filter((b) => b !== id) : [...user.toRead, id];

    await user.save();
    return res.json(user.toRead);
  } catch (err) {
    console.error("TO READ ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post("/rate", requireSession, async (req, res) => {
  try {
    const { bookId, rating, title } = req.body;

    const bookIdNum = Number(bookId);
    const ratingNum = Number(rating);

    if (!Number.isFinite(bookIdNum)) {
      return res.status(400).json({ message: "Geçersiz bookId" });
    }
    if (!title) {
      return res.status(400).json({ message: "Kitap başlığı (title) gerekli" });
    }
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating 1-5 arası olmalı" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User yok" });

    user.ratings.set(String(bookIdNum), ratingNum);

    const existsInCompleted = user.completed.some(b => b.bookId === bookIdNum);
    if (!existsInCompleted) {
      user.completed.push({ bookId: bookIdNum, title: title });
    }

    user.toRead = user.toRead.filter(b => b !== bookIdNum);

    await user.save();

    res.json({
      ratings: Object.fromEntries(user.ratings),
      completed: user.completed,
      toRead: user.toRead,
    });
  } catch (err) {
    console.error("RATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/user-based", requireSession, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User yok" });

    const userRatingsRaw = user.ratings ? Object.fromEntries(user.ratings) : {};
    const ratings = Object.entries(userRatingsRaw).map(([book_id, data]) => ({
      gutenberg_id: Number(book_id),
      rating: Number(data), 
    }));

    if (ratings.length === 0) return res.json({ recommendations: [] });

    const response = await fetch("http://127.0.0.1:5001/user-based", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ ratings })
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("EXPRESS USER BASED ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/content-based", requireSession, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User yok" });

    const userRatingsRaw = user.ratings ? Object.fromEntries(user.ratings) : {};
    const ratings = Object.entries(userRatingsRaw).map(([book_id, data]) => ({
      gutenberg_id: Number(book_id),
      rating: Number(data), 
    }));

    if (ratings.length === 0) return res.json({ recommendations: [] });

    const response = await fetch("http://127.0.0.1:5001/content-based", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ ratings })
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("EXPRESS CONTENT BASED ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/cold-start", requireSession, async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:5001/cold-start");
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("EXPRESS COLD START ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;