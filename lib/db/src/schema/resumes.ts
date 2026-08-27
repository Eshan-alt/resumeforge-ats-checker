import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { appUsersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").references(() => appUsersTable.clerkUserId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  data: jsonb("data").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
