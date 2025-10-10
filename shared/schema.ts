import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  photoURL: text("photo_url"),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  firebaseUid: text("firebase_uid").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  assignedBy: integer("assigned_by").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  deadline: timestamp("deadline"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reportType: varchar("report_type", { length: 20 }).notNull(),
  plannedTasks: text("planned_tasks"),
  completedTasks: text("completed_tasks"),
  pendingTasks: text("pending_tasks"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  relatedTaskId: integer("related_task_id").references(() => tasks.id),
  readStatus: boolean("read_status").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  ratedBy: integer("rated_by").references(() => users.id).notNull(),
  rating: varchar("rating", { length: 30 }).notNull(),
  feedback: text("feedback"),
  period: varchar("period", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reportId: integer("report_id").references(() => reports.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const archiveReports = pgTable("archive_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reportType: varchar("report_type", { length: 20 }).notNull(),
  plannedTasks: text("planned_tasks"),
  completedTasks: text("completed_tasks"),
  pendingTasks: text("pending_tasks"),
  notes: text("notes"),
  originalDate: timestamp("original_date").notNull(),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;

export type ArchiveReport = typeof archiveReports.$inferSelect;
