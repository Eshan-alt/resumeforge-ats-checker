import type { RequestHandler } from "express";
import { isAdmin } from "../lib/admin";

/** Must run after requireAuth, which sets the verified Clerk subject. */
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isAdmin(req.userId)) {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  next();
};
