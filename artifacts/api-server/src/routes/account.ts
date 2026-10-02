import { Router, type IRouter } from "express";
import { count, desc, sql } from "drizzle-orm";
import { db, appUsersTable, resumesTable, analysesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { isAdmin, parsePage } from "../lib/admin";

const router: IRouter = Router();
router.get("/me", requireAuth, (req, res) => {
  res.json({
    userId: req.userId!,
    role: isAdmin(req.userId) ? "admin" : "user",
  });
});
router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  const [users, resumes, analyses] = await Promise.all([
    db.select({ total: count() }).from(appUsersTable),
    db.select({ total: count() }).from(resumesTable),
    db.select({ total: count() }).from(analysesTable),
  ]);
  res.json({
    users: users[0].total,
    resumes: resumes[0].total,
    analyses: analyses[0].total,
  });
});
router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const page = parsePage(req.query.page);
  if (page === null) {
    res
      .status(400)
      .json({ error: "page must be an integer between 1 and 100000" });
    return;
  }
  const pageSize = 20;
  const [users, totals] = await Promise.all([
    db
      .select({
        userId: appUsersTable.clerkUserId,
        createdAt: appUsersTable.createdAt,
        resumes: sql<number>`(select count(*)::int from ${resumesTable} where ${resumesTable.ownerId} = ${appUsersTable.clerkUserId})`,
        analyses: sql<number>`(select count(*)::int from ${analysesTable} where ${analysesTable.ownerId} = ${appUsersTable.clerkUserId})`,
      })
      .from(appUsersTable)
      .orderBy(desc(appUsersTable.createdAt), appUsersTable.clerkUserId)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(appUsersTable),
  ]);
  res.json({
    users: users.map((user) => ({
      ...user,
      role: isAdmin(user.userId) ? "admin" : "user",
    })),
    total: totals[0].total,
    page,
    pageSize,
  });
});
export default router;
