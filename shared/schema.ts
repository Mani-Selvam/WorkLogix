import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  serverId: varchar("server_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 20 }),
  website: text("website"),
  location: varchar("location", { length: 100 }),
  description: text("description"),
  
  companyType: varchar("company_type", { length: 50 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  designation: varchar("designation", { length: 100 }),
  mobile: varchar("mobile", { length: 20 }),
  
  address: text("address"),
  pincode: varchar("pincode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  
  employees: integer("employees"),
  annualTurnover: varchar("annual_turnover", { length: 50 }),
  yearEstablished: integer("year_established"),
  logo: text("logo"),
  
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  emailVerified: boolean("email_verified").notNull().default(false),
  
  maxAdmins: integer("max_admins").notNull().default(1),
  maxMembers: integer("max_members").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  
  workStartTime: varchar("work_start_time", { length: 10 }).default("09:00"),
  workEndTime: varchar("work_end_time", { length: 10 }).default("18:00"),
  attendanceWindowEnd: varchar("attendance_window_end", { length: 10 }).default("10:00"),
  lateEntryTime: varchar("late_entry_time", { length: 10 }).default("09:15"),
  
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uniqueUserId: varchar("unique_user_id", { length: 50 }).notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  password: text("password"),
  photoURL: text("photo_url"),
  role: varchar("role", { length: 20 }).notNull().default("company_member"),
  companyId: integer("company_id").references(() => companies.id),
  firebaseUid: text("firebase_uid").unique(),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
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

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskTimeLogs = pgTable("task_time_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  totalSeconds: integer("total_seconds").notNull().default(0),
  timerStartedAt: timestamp("timer_started_at"),
  timerStatus: varchar("timer_status", { length: 20 }).notNull().default("stopped"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const slotPricing = pgTable("slot_pricing", {
  id: serial("id").primaryKey(),
  slotType: varchar("slot_type", { length: 20 }).notNull(),
  pricePerSlot: integer("price_per_slot").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companyPayments = pgTable("company_payments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  slotType: varchar("slot_type", { length: 20 }),
  slotQuantity: integer("slot_quantity"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  receiptNumber: varchar("receipt_number", { length: 50 }).unique(),
  invoiceUrl: text("invoice_url"),
  emailSent: boolean("email_sent").notNull().default(false),
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: serial("id").primaryKey(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  performedBy: integer("performed_by").references(() => users.id).notNull(),
  targetCompanyId: integer("target_company_id").references(() => companies.id),
  targetUserId: integer("target_user_id").references(() => users.id),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  criteria: text("criteria"),
  type: varchar("type", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceLogs = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  loginTime: timestamp("login_time"),
  logoutTime: timestamp("logout_time"),
  status: varchar("status", { length: 20 }).notNull(),
  totalHours: integer("total_hours").default(0),
  isLate: boolean("is_late").notNull().default(false),
  isOvertime: boolean("is_overtime").notNull().default(false),
  overtimeHours: integer("overtime_hours").default(0),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceRewards = pgTable("attendance_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastAttendanceDate: varchar("last_attendance_date", { length: 10 }),
  badgesEarned: text("badges_earned").array(),
  monthlyScore: integer("monthly_score").notNull().default(0),
  perfectMonths: integer("perfect_months").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const autoTasks = pgTable("auto_tasks", {
  id: serial("id").primaryKey(),
  taskName: varchar("task_name", { length: 100 }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  details: text("details"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  serverId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  uniqueUserId: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const firebaseSigninSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(1, "Display name is required"),
  photoURL: z.string().optional(),
  firebaseUid: z.string().min(1, "Firebase UID is required"),
});

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const companyBasicRegistrationSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(strongPasswordRegex, "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const companyGoogleRegistrationSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  firebaseUid: z.string().min(1, "Firebase UID is required"),
  photoURL: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

export const companyRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(strongPasswordRegex, "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"),
  confirmPassword: z.string(),
  
  name: z.string().min(2, "Company name must be at least 2 characters"),
  companyType: z.string().min(1, "Please select a company type"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  designation: z.string().min(1, "Please select a designation"),
  mobile: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit mobile number"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  
  address: z.string().min(5, "Please enter a complete address"),
  pincode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit pincode"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  
  employees: z.number().min(1, "Number of employees must be at least 1"),
  annualTurnover: z.string().min(1, "Please select annual turnover range"),
  yearEstablished: z.number()
    .min(1800, "Year must be valid")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  description: z.string().optional(),
  logo: z.string().optional(),
  
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const superAdminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const companyAdminLoginSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  serverId: z.string().min(1, "Company Server ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const companyUserLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  deadline: z.string().nullable().optional().transform(val => val ? new Date(val) : null),
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

export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  createdAt: true,
});

export const insertTaskTimeLogSchema = createInsertSchema(taskTimeLogs).omit({
  id: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  createdAt: true,
});

export const insertSlotPricingSchema = createInsertSchema(slotPricing).omit({
  id: true,
  updatedAt: true,
}).extend({
  slotType: z.enum(['admin', 'member']),
  pricePerSlot: z.number().min(0, "Price must be non-negative"),
});

export const insertCompanyPaymentSchema = createInsertSchema(companyPayments).omit({
  id: true,
  createdAt: true,
}).extend({
  slotType: z.enum(['admin', 'member']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'cancelled']),
});

export const slotPurchaseSchema = z.object({
  slotType: z.enum(['admin', 'member']),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'failed', 'cancelled']),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
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

export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;

export type InsertTaskTimeLog = z.infer<typeof insertTaskTimeLogSchema>;
export type TaskTimeLog = typeof taskTimeLogs.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacks.$inferSelect;

export type ArchiveReport = typeof archiveReports.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertSlotPricing = z.infer<typeof insertSlotPricingSchema>;
export type SlotPricing = typeof slotPricing.$inferSelect;

export type InsertCompanyPayment = z.infer<typeof insertCompanyPaymentSchema>;
export type CompanyPayment = typeof companyPayments.$inferSelect;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export const insertAttendanceLogSchema = createInsertSchema(attendanceLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;

export const insertAttendanceRewardSchema = createInsertSchema(attendanceRewards).omit({
  id: true,
  updatedAt: true,
});

export type InsertAttendanceReward = z.infer<typeof insertAttendanceRewardSchema>;
export type AttendanceReward = typeof attendanceRewards.$inferSelect;

export const insertAutoTaskSchema = createInsertSchema(autoTasks).omit({
  id: true,
  executedAt: true,
});

export type InsertAutoTask = z.infer<typeof insertAutoTaskSchema>;
export type AutoTask = typeof autoTasks.$inferSelect;
