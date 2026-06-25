import express from "express";
import fetch from "node-fetch";
import requireSession from "../middleware/auth.js";

const router = express.Router();

router.get("/popular", async (req, res) => {
  try {
    const pageRaw = req.query.page ?? "1";   
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);

    const response = await fetch(
      `https://gutendex.com/books/?sort=popular&page=${page}`
    );

    if (!response.ok) {
      return res.status(502).json({ message: "Gutendex hata" });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("POPULAR BOOKS ERROR:", err);
    return res.status(500).json({ message: "Kitaplar alınamadı" });
  }
});


router.get("/read/:bookId", requireSession, async (req, res) => {
  try {
    const { bookId } = req.params;  

    const metaRes = await fetch(`https://gutendex.com/books/${bookId}`);
    if (!metaRes.ok) {
      return res.status(404).json({ message: "Gutendex kitap yok" });
    }

    let meta;
    try {
      meta = await metaRes.json();
    } catch (e) {
      return res.status(502).json({ message: "Gutendex meta parse edilemedi" });
    }

    const textUrl = meta.formats?.["text/plain; charset=utf-8"];
  
    if (!textUrl) {
      return res.status(404).json({
        message: "Bu kitapta UTF-8 plain text yok",
      });
    }

    const textRes = await fetch(textUrl);
    if (!textRes.ok) {
      return res.status(502).json({ message: "Metin alınamadı" });
    }

    const text = await textRes.text();

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(text);
  } catch (err) {
    console.error("BOOK READ ERROR:", err);
    return res.status(500).json({ message: "Kitap alınamadı" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const r = await fetch(
      `https://gutendex.com/books/${req.params.id}`
    );

    if (!r.ok) {
      if (r.status === 503 || r.status === 502) {
        return res.status(503).json({ message: "Gutendex sunucuları şu an yanıt vermiyor, lütfen daha sonra tekrar deneyin." });
      }
      return res.status(r.status).json({ message: "Kitap bulunamadı" });
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("Gutendex error:", err);
    res.status(500).json({ message: "İç sunucu hatası" });
  }
});

export default router;
