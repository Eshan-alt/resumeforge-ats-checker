import { getAuth } from "@clerk/express";
import { type NextFunction, type Request, type Response } from "express";
import { db, appUsersTable } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** Verifies Clerk's session and creates the local ownership record on first use. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const claimUserId = auth.sessionClaims?.userId;
  const userId = typeof claimUserId === "string" ? claimUserId : auth.userId;
  if (typeof userId !== "string" || userId.length === 0) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.insert(appUsersTable).values({ clerkUserId: userId }).onConflictDoNothing();
    req.userId = userId;
    next();
  } catch (err) {
    req.log.error({ err }, "Unable to provision application user");
    res.status(500).json({ error: "Unable to provision user account" });
  }
}