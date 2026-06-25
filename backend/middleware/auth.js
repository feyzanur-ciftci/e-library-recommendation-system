export default function requireSession(req, res, next) {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  req.userId = userId;
  next();
}
