import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { appUsersTable } from "./users";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => appUsersTable.clerkUserId, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  extractedText: text("extracted_text").notNull(),
  jobDescription: text("job_description").notNull(),
  parsedSections: jsonb("parsed_sections").notNull().$type<Record<string, unknown>>(),
  deterministicResults: jsonb("deterministic_results").notNull().$type<Record<string, unknown>>(),
  aiSuggestions: jsonb("ai_suggestions").$type<Record<string, unknown> | null>(),
  status: text("status").notNull().default("complete"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;