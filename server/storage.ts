import { db } from "./db";
import { 
  companies, users, tasks, reports, messages, ratings, fileUploads, archiveReports, groupMessages, taskTimeLogs, feedbacks, slotPricing, companyPayments, passwordResetTokens, adminActivityLogs,
  type Company, type InsertCompany,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Report, type InsertReport,
  type Message, type InsertMessage,
  type Rating, type InsertRating,
  type FileUpload, type InsertFileUpload,
  type ArchiveReport,
  type GroupMessage, type InsertGroupMessage,
  type TaskTimeLog, type InsertTaskTimeLog,
  type Feedback, type InsertFeedback,
  type SlotPricing, type InsertSlotPricing,
  type CompanyPayment, type InsertCompanyPayment,
  type PasswordResetToken,
  type AdminActivityLog, type InsertAdminActivityLog
} from "@shared/schema";
import { eq, and, or, desc, gte, lte, sql, inArray } from "drizzle-orm";

function generateUniqueId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${id}`;
}


export interface IStorage {
  // Company operations
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanyById(id: number): Promise<Company | null>;
  getCompanyByServerId(serverId: string): Promise<Company | null>;
  getCompanyByEmail(email: string): Promise<Company | null>;
  getCompanyByVerificationToken(token: string): Promise<Company | null>;
  verifyCompanyEmail(token: string): Promise<Company | null>;
  getAllCompanies(): Promise<Company[]>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<void>;
  incrementCompanySlots(id: number, updates: { maxAdmins?: number; maxMembers?: number }): Promise<void>;
  deleteCompany(id: number): Promise<void>;
  getUsersByCompanyId(companyId: number): Promise<User[]>;
  
  // User operations
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  getUserByFirebaseUid(uid: string): Promise<User | null>;
  getUserByUniqueUserId(uniqueUserId: string): Promise<User | null>;
  getUserByDisplayName(displayName: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<void>;
  updateUserPassword(id: number, password: string): Promise<void>;
  getAllUsers(includeDeleted?: boolean): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  softDeleteUser(id: number): Promise<void>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTaskById(id: number): Promise<Task | null>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  getTasksByAssignedBy(assignedBy: number): Promise<Task[]>;
  getTasksByCompanyId(companyId: number): Promise<Task[]>;
  getAllTasks(): Promise<Task[]>;
  updateTaskStatus(id: number, status: string): Promise<void>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<void>;
  deleteTask(id: number): Promise<void>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReportsByUserId(userId: number): Promise<Report[]>;
  getReportsByUserAndDate(userId: number, startDate: Date, endDate: Date): Promise<Report[]>;
  getReportsByCompanyId(companyId: number): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  getReportsByDate(startDate: Date, endDate: Date): Promise<Report[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByReceiverId(receiverId: number): Promise<Message[]>;
  getUnreadMessagesByReceiverId(receiverId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;
  getAllMessages(): Promise<Message[]>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByUserId(userId: number): Promise<Rating[]>;
  getLatestRatingByUserId(userId: number): Promise<Rating | null>;
  getAllRatings(): Promise<Rating[]>;
  
  // File upload operations
  createFileUpload(file: InsertFileUpload): Promise<FileUpload>;
  getFilesByUserId(userId: number): Promise<FileUpload[]>;
  getFilesByReportId(reportId: number): Promise<FileUpload[]>;
  getAllFiles(): Promise<FileUpload[]>;
  
  // Archive operations
  archiveReports(month: number, year: number): Promise<void>;
  getArchivedReports(userId?: number): Promise<ArchiveReport[]>;
  
  // Group message operations
  createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  getAllGroupMessages(): Promise<GroupMessage[]>;
  getGroupMessagesByCompanyId(companyId: number): Promise<GroupMessage[]>;
  getRecentGroupMessages(limit: number): Promise<GroupMessage[]>;
  
  // Task time log operations
  getTaskTimeLog(taskId: number, userId: number, date: string): Promise<TaskTimeLog | null>;
  createOrUpdateTaskTimeLog(log: InsertTaskTimeLog): Promise<TaskTimeLog>;
  startTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog>;
  pauseTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog>;
  completeTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog>;
  getTaskTimeLogs(taskId: number, userId: number): Promise<TaskTimeLog[]>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getAllFeedbacks(): Promise<Feedback[]>;
  getFeedbacksByUserId(userId: number): Promise<Feedback[]>;
  
  // Slot pricing operations
  createOrUpdateSlotPricing(pricing: InsertSlotPricing): Promise<SlotPricing>;
  getAllSlotPricing(): Promise<SlotPricing[]>;
  getSlotPricingByType(slotType: string): Promise<SlotPricing | null>;
  
  // Company payment operations
  createCompanyPayment(payment: InsertCompanyPayment): Promise<CompanyPayment>;
  getPaymentsByCompanyId(companyId: number): Promise<CompanyPayment[]>;
  getAllCompanyPayments(): Promise<CompanyPayment[]>;
  getPaymentById(id: number): Promise<CompanyPayment | null>;
  updatePaymentStatus(id: number, updates: { paymentStatus: string; transactionId?: string }): Promise<void>;
  updatePaymentStripeId(id: number, stripePaymentIntentId: string): Promise<void>;
  completePaymentWithSlots(paymentId: number, companyId: number, receiptNumber: string, transactionId: string, slotUpdates: { maxAdmins?: number; maxMembers?: number }): Promise<CompanyPayment | null>;
  updatePaymentEmailStatus(id: number, emailSent: boolean): Promise<void>;
  
  // Password reset operations
  createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | null>;
  markTokenAsUsed(token: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(companyId?: number): Promise<{
    totalUsers: number;
    todayReports: number;
    pendingTasks: number;
    completedTasks: number;
    totalFiles: number;
  }>;
  
  // Admin activity log operations
  createAdminActivityLog(log: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAllAdminActivityLogs(limit?: number): Promise<AdminActivityLog[]>;
  getAdminActivityLogsByCompany(companyId: number): Promise<AdminActivityLog[]>;
  getAdminActivityLogsByUser(userId: number): Promise<AdminActivityLog[]>;
  
  // Super Admin analytics
  getSuperAdminAnalytics(): Promise<{
    totalCompanies: number;
    activeCompanies: number;
    suspendedCompanies: number;
    totalUsers: number;
    totalAdmins: number;
    totalMembers: number;
    totalTasks: number;
    totalPayments: number;
    totalRevenue: number;
    recentPayments: CompanyPayment[];
  }>;
  
  getCompanyWithStats(companyId: number): Promise<{
    company: Company;
    userCount: number;
    adminCount: number;
    memberCount: number;
    taskCount: number;
    totalPayments: number;
    totalRevenue: number;
  } | null>;
  
  getAllCompaniesWithStats(): Promise<Array<{
    company: Company;
    userCount: number;
    adminCount: number;
    memberCount: number;
  }>>;
  
  suspendCompany(companyId: number, performedBy: number): Promise<void>;
  reactivateCompany(companyId: number, performedBy: number): Promise<void>;
  
  // Enhanced payment tracking
  getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<CompanyPayment[]>;
  getPaymentsByStatus(status: string): Promise<CompanyPayment[]>;
}

export class DbStorage implements IStorage {
  async createCompany(company: InsertCompany): Promise<Company> {
    const maxAttempts = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await db.transaction(async (tx) => {
          const latestCompany = await tx
            .select({ serverId: companies.serverId })
            .from(companies)
            .orderBy(desc(companies.id))
            .limit(1);
          
          let nextNumber = 10001;
          
          if (latestCompany.length > 0 && latestCompany[0].serverId) {
            const match = latestCompany[0].serverId.match(/CMP-(\d+)/);
            if (match) {
              nextNumber = parseInt(match[1], 10) + 1;
            }
          }
          
          const serverId = `CMP-${(nextNumber + attempt).toString().padStart(5, '0')}`;
          
          const result = await tx
            .insert(companies)
            .values({ ...company, serverId })
            .returning();
          
          return result[0];
        });
      } catch (error: any) {
        if (error.code === '23505' && attempt < maxAttempts - 1) {
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Failed to generate unique company server ID after multiple attempts');
  }

  async getCompanyById(id: number): Promise<Company | null> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0] || null;
  }

  async getCompanyByServerId(serverId: string): Promise<Company | null> {
    const result = await db.select().from(companies).where(eq(companies.serverId, serverId)).limit(1);
    return result[0] || null;
  }

  async getCompanyByEmail(email: string): Promise<Company | null> {
    const result = await db.select().from(companies).where(eq(companies.email, email)).limit(1);
    return result[0] || null;
  }

  async getCompanyByVerificationToken(token: string): Promise<Company | null> {
    const result = await db.select().from(companies).where(eq(companies.verificationToken, token)).limit(1);
    return result[0] || null;
  }

  async verifyCompanyEmail(token: string): Promise<Company | null> {
    const company = await this.getCompanyByVerificationToken(token);
    if (!company) {
      return null;
    }
    
    if (company.verificationTokenExpiry && company.verificationTokenExpiry < new Date()) {
      return null;
    }
    
    await db.update(companies)
      .set({ 
        emailVerified: true, 
        verificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(companies.id, company.id));
    
    return await this.getCompanyById(company.id);
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isActive, true));
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<void> {
    await db.update(companies).set(updates).where(eq(companies.id, id));
  }

  async incrementCompanySlots(id: number, updates: { maxAdmins?: number; maxMembers?: number }): Promise<void> {
    const company = await this.getCompanyById(id);
    if (!company) {
      throw new Error("Company not found");
    }

    const newMaxAdmins = updates.maxAdmins ? company.maxAdmins + updates.maxAdmins : company.maxAdmins;
    const newMaxMembers = updates.maxMembers ? company.maxMembers + updates.maxMembers : company.maxMembers;

    await db.update(companies)
      .set({ 
        maxAdmins: newMaxAdmins, 
        maxMembers: newMaxMembers,
        updatedAt: new Date()
      })
      .where(eq(companies.id, id));
  }

  async deleteCompany(id: number): Promise<void> {
    const companyUsers = await db.select().from(users).where(eq(users.companyId, id));
    const userIds = companyUsers.map(u => u.id);
    const companyTasks = await db.select().from(tasks).where(eq(tasks.companyId, id));
    const taskIds = companyTasks.map(t => t.id);

    if (taskIds.length > 0) {
      await db.delete(taskTimeLogs).where(
        inArray(taskTimeLogs.taskId, taskIds)
      );
    }

    if (userIds.length > 0) {
      await db.delete(messages).where(
        or(
          inArray(messages.senderId, userIds),
          inArray(messages.receiverId, userIds)
        )
      );
      await db.delete(ratings).where(
        or(
          inArray(ratings.userId, userIds),
          inArray(ratings.ratedBy, userIds)
        )
      );
      await db.delete(fileUploads).where(
        inArray(fileUploads.userId, userIds)
      );
      await db.delete(feedbacks).where(
        inArray(feedbacks.userId, userIds)
      );
      await db.delete(archiveReports).where(
        inArray(archiveReports.userId, userIds)
      );
      
      const userEmails = companyUsers.map(u => u.email);
      if (userEmails.length > 0) {
        await db.delete(passwordResetTokens).where(
          inArray(passwordResetTokens.email, userEmails)
        );
      }
    }

    await db.delete(groupMessages).where(eq(groupMessages.companyId, id));
    await db.delete(reports).where(eq(reports.companyId, id));
    await db.delete(tasks).where(eq(tasks.companyId, id));
    await db.delete(companyPayments).where(eq(companyPayments.companyId, id));
    await db.delete(users).where(eq(users.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  async getUsersByCompanyId(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.isActive, true)));
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByFirebaseUid(uid: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.firebaseUid, uid)).limit(1);
    return result[0] || null;
  }

  async getUserByUniqueUserId(uniqueUserId: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.uniqueUserId, uniqueUserId)).limit(1);
    return result[0] || null;
  }

  async getUserByDisplayName(displayName: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.displayName, displayName)).limit(1);
    return result[0] || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const uniqueUserId = generateUniqueId('USER');
    const result = await db.insert(users).values({ ...user, uniqueUserId }).returning();
    return result[0];
  }

  async updateUserRole(id: number, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, id));
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    await db.update(users).set({ password }).where(eq(users.id, id));
  }

  async getAllUsers(includeDeleted: boolean = false): Promise<User[]> {
    if (includeDeleted) {
      return await db.select().from(users);
    }
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async softDeleteUser(id: number): Promise<void> {
    await db.update(users)
      .set({ 
        isActive: false, 
        deletedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async getTaskById(id: number): Promise<Task | null> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0] || null;
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByAssignedBy(assignedBy: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.assignedBy, assignedBy))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByCompanyId(companyId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.companyId, companyId))
      .orderBy(desc(tasks.createdAt));
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async updateTaskStatus(id: number, status: string): Promise<void> {
    await db.update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(tasks.id, id));
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<void> {
    await db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id));
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(report).returning();
    return result[0];
  }

  async getReportsByUserId(userId: number): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
  }

  async getReportsByUserAndDate(userId: number, startDate: Date, endDate: Date): Promise<Report[]> {
    return await db.select().from(reports)
      .where(
        and(
          eq(reports.userId, userId),
          gte(reports.createdAt, startDate),
          lte(reports.createdAt, endDate)
        )
      )
      .orderBy(desc(reports.createdAt));
  }

  async getReportsByCompanyId(companyId: number): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.companyId, companyId))
      .orderBy(desc(reports.createdAt));
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReportsByDate(startDate: Date, endDate: Date): Promise<Report[]> {
    return await db.select().from(reports)
      .where(
        and(
          gte(reports.createdAt, startDate),
          lte(reports.createdAt, endDate)
        )
      )
      .orderBy(desc(reports.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getMessagesByReceiverId(receiverId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.receiverId, receiverId))
      .orderBy(desc(messages.createdAt));
  }

  async getUnreadMessagesByReceiverId(receiverId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.readStatus, false)
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db.update(messages).set({ readStatus: true }).where(eq(messages.id, id));
  }

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const result = await db.insert(ratings).values(rating).returning();
    return result[0];
  }

  async getRatingsByUserId(userId: number): Promise<Rating[]> {
    return await db.select().from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getLatestRatingByUserId(userId: number): Promise<Rating | null> {
    const result = await db.select().from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt))
      .limit(1);
    return result[0] || null;
  }

  async getAllRatings(): Promise<Rating[]> {
    return await db.select().from(ratings).orderBy(desc(ratings.createdAt));
  }

  async createFileUpload(file: InsertFileUpload): Promise<FileUpload> {
    const result = await db.insert(fileUploads).values(file).returning();
    return result[0];
  }

  async getFilesByUserId(userId: number): Promise<FileUpload[]> {
    return await db.select().from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .orderBy(desc(fileUploads.uploadedAt));
  }

  async getFilesByReportId(reportId: number): Promise<FileUpload[]> {
    return await db.select().from(fileUploads)
      .where(eq(fileUploads.reportId, reportId))
      .orderBy(desc(fileUploads.uploadedAt));
  }

  async getAllFiles(): Promise<FileUpload[]> {
    return await db.select().from(fileUploads).orderBy(desc(fileUploads.uploadedAt));
  }

  async archiveReports(month: number, year: number): Promise<void> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const reportsToArchive = await db.select().from(reports)
      .where(
        and(
          gte(reports.createdAt, startDate),
          lte(reports.createdAt, endDate)
        )
      );

    if (reportsToArchive.length > 0) {
      const archiveData = reportsToArchive.map(report => ({
        userId: report.userId,
        reportType: report.reportType,
        plannedTasks: report.plannedTasks,
        completedTasks: report.completedTasks,
        pendingTasks: report.pendingTasks,
        notes: report.notes,
        originalDate: report.createdAt,
      }));

      await db.insert(archiveReports).values(archiveData);
      await db.delete(reports)
        .where(
          and(
            gte(reports.createdAt, startDate),
            lte(reports.createdAt, endDate)
          )
        );
    }
  }

  async getArchivedReports(userId?: number): Promise<ArchiveReport[]> {
    if (userId) {
      return await db.select().from(archiveReports)
        .where(eq(archiveReports.userId, userId))
        .orderBy(desc(archiveReports.originalDate));
    }
    return await db.select().from(archiveReports).orderBy(desc(archiveReports.originalDate));
  }

  async createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage> {
    const result = await db.insert(groupMessages).values(message).returning();
    return result[0];
  }

  async getAllGroupMessages(): Promise<GroupMessage[]> {
    return await db.select().from(groupMessages).orderBy(desc(groupMessages.createdAt));
  }

  async getGroupMessagesByCompanyId(companyId: number): Promise<GroupMessage[]> {
    return await db.select().from(groupMessages)
      .where(eq(groupMessages.companyId, companyId))
      .orderBy(desc(groupMessages.createdAt));
  }

  async getRecentGroupMessages(limit: number): Promise<GroupMessage[]> {
    return await db.select().from(groupMessages)
      .orderBy(desc(groupMessages.createdAt))
      .limit(limit);
  }

  async getTaskTimeLog(taskId: number, userId: number, date: string): Promise<TaskTimeLog | null> {
    const result = await db.select().from(taskTimeLogs)
      .where(and(
        eq(taskTimeLogs.taskId, taskId),
        eq(taskTimeLogs.userId, userId),
        eq(taskTimeLogs.date, date)
      ))
      .limit(1);
    return result[0] || null;
  }

  async createOrUpdateTaskTimeLog(log: InsertTaskTimeLog): Promise<TaskTimeLog> {
    const existing = await this.getTaskTimeLog(log.taskId, log.userId, log.date);
    
    if (existing) {
      const result = await db.update(taskTimeLogs)
        .set({ 
          totalSeconds: log.totalSeconds,
          timerStartedAt: log.timerStartedAt,
          timerStatus: log.timerStatus,
          updatedAt: new Date()
        })
        .where(and(
          eq(taskTimeLogs.taskId, log.taskId),
          eq(taskTimeLogs.userId, log.userId),
          eq(taskTimeLogs.date, log.date)
        ))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(taskTimeLogs).values(log).returning();
      return result[0];
    }
  }

  async startTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog> {
    const existing = await this.getTaskTimeLog(taskId, userId, date);
    
    const log: InsertTaskTimeLog = {
      taskId,
      userId,
      date,
      totalSeconds: existing?.totalSeconds || 0,
      timerStartedAt: new Date(),
      timerStatus: 'running',
    };
    
    return await this.createOrUpdateTaskTimeLog(log);
  }

  async pauseTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog> {
    const existing = await this.getTaskTimeLog(taskId, userId, date);
    
    if (!existing || !existing.timerStartedAt) {
      throw new Error('Timer not running');
    }
    
    const elapsedSeconds = Math.floor((Date.now() - new Date(existing.timerStartedAt).getTime()) / 1000);
    
    const log: InsertTaskTimeLog = {
      taskId,
      userId,
      date,
      totalSeconds: existing.totalSeconds + elapsedSeconds,
      timerStartedAt: null,
      timerStatus: 'paused',
    };
    
    return await this.createOrUpdateTaskTimeLog(log);
  }

  async completeTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog> {
    const existing = await this.getTaskTimeLog(taskId, userId, date);
    
    let totalSeconds = existing?.totalSeconds || 0;
    
    if (existing?.timerStartedAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existing.timerStartedAt).getTime()) / 1000);
      totalSeconds += elapsedSeconds;
    }
    
    const log: InsertTaskTimeLog = {
      taskId,
      userId,
      date,
      totalSeconds,
      timerStartedAt: null,
      timerStatus: 'completed',
    };
    
    return await this.createOrUpdateTaskTimeLog(log);
  }

  async getTaskTimeLogs(taskId: number, userId: number): Promise<TaskTimeLog[]> {
    return await db.select().from(taskTimeLogs)
      .where(and(
        eq(taskTimeLogs.taskId, taskId),
        eq(taskTimeLogs.userId, userId)
      ))
      .orderBy(desc(taskTimeLogs.date));
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const result = await db.insert(feedbacks).values(feedback).returning();
    return result[0];
  }

  async getAllFeedbacks(): Promise<Feedback[]> {
    return await db.select().from(feedbacks).orderBy(desc(feedbacks.createdAt));
  }

  async getFeedbacksByUserId(userId: number): Promise<Feedback[]> {
    return await db.select().from(feedbacks)
      .where(eq(feedbacks.userId, userId))
      .orderBy(desc(feedbacks.createdAt));
  }

  async createOrUpdateSlotPricing(pricing: InsertSlotPricing): Promise<SlotPricing> {
    const existing = await this.getSlotPricingByType(pricing.slotType);
    
    if (existing) {
      await db.update(slotPricing)
        .set({ ...pricing, updatedAt: new Date() })
        .where(eq(slotPricing.slotType, pricing.slotType));
      
      return (await this.getSlotPricingByType(pricing.slotType))!;
    } else {
      const result = await db.insert(slotPricing).values(pricing).returning();
      return result[0];
    }
  }

  async getAllSlotPricing(): Promise<SlotPricing[]> {
    return await db.select().from(slotPricing);
  }

  async getSlotPricingByType(slotType: string): Promise<SlotPricing | null> {
    const result = await db.select().from(slotPricing)
      .where(eq(slotPricing.slotType, slotType))
      .limit(1);
    return result[0] || null;
  }

  async createCompanyPayment(payment: InsertCompanyPayment): Promise<CompanyPayment> {
    const result = await db.insert(companyPayments).values(payment).returning();
    return result[0];
  }

  async getPaymentsByCompanyId(companyId: number): Promise<CompanyPayment[]> {
    return await db.select().from(companyPayments)
      .where(eq(companyPayments.companyId, companyId))
      .orderBy(desc(companyPayments.createdAt));
  }

  async getAllCompanyPayments(): Promise<CompanyPayment[]> {
    return await db.select().from(companyPayments)
      .orderBy(desc(companyPayments.createdAt));
  }

  async getPaymentById(id: number): Promise<CompanyPayment | null> {
    const result = await db.select().from(companyPayments)
      .where(eq(companyPayments.id, id))
      .limit(1);
    return result[0] || null;
  }

  async updatePaymentStatus(id: number, updates: { paymentStatus: string; transactionId?: string }): Promise<void> {
    await db.update(companyPayments)
      .set(updates)
      .where(eq(companyPayments.id, id));
  }

  async updatePaymentStripeId(id: number, stripePaymentIntentId: string): Promise<void> {
    await db.update(companyPayments)
      .set({ stripePaymentIntentId })
      .where(eq(companyPayments.id, id));
  }

  async completePaymentWithSlots(
    paymentId: number, 
    companyId: number, 
    receiptNumber: string, 
    transactionId: string,
    slotUpdates: { maxAdmins?: number; maxMembers?: number }
  ): Promise<CompanyPayment | null> {
    return await db.transaction(async (tx) => {
      // Step 1: Mark payment as paid ONLY if still pending (gate check first!)
      const result = await tx.update(companyPayments)
        .set({
          paymentStatus: 'paid',
          receiptNumber,
          transactionId,
          emailSent: false,
        })
        .where(and(
          eq(companyPayments.id, paymentId),
          eq(companyPayments.paymentStatus, 'pending')
        ))
        .returning();

      // If payment already processed, return null immediately (don't touch slots)
      if (result.length === 0) {
        return null;
      }

      // Step 2: Increment company slots ONLY if payment update succeeded
      if (slotUpdates.maxAdmins) {
        await tx.update(companies)
          .set({ maxAdmins: sql`${companies.maxAdmins} + ${slotUpdates.maxAdmins}` })
          .where(eq(companies.id, companyId));
      }
      if (slotUpdates.maxMembers) {
        await tx.update(companies)
          .set({ maxMembers: sql`${companies.maxMembers} + ${slotUpdates.maxMembers}` })
          .where(eq(companies.id, companyId));
      }

      return result[0];
    });
  }

  async updatePaymentEmailStatus(id: number, emailSent: boolean): Promise<void> {
    await db.update(companyPayments)
      .set({ emailSent })
      .where(eq(companyPayments.id, id));
  }

  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const result = await db.insert(passwordResetTokens)
      .values({ email, token, expiresAt })
      .returning();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const result = await db.select().from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    return result[0] || null;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async getDashboardStats(companyId?: number): Promise<{
    totalUsers: number;
    todayReports: number;
    pendingTasks: number;
    completedTasks: number;
    totalFiles: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [userCount] = companyId
      ? await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.companyId, companyId))
      : await db.select({ count: sql<number>`count(*)` }).from(users);
    
    const [todayReportCount] = companyId
      ? await db.select({ count: sql<number>`count(*)` })
          .from(reports)
          .where(and(gte(reports.createdAt, today), eq(reports.companyId, companyId)))
      : await db.select({ count: sql<number>`count(*)` })
          .from(reports)
          .where(gte(reports.createdAt, today));
    
    const [pendingTaskCount] = companyId
      ? await db.select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.status, 'pending'), eq(tasks.companyId, companyId)))
      : await db.select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(eq(tasks.status, 'pending'));
    
    const [completedTaskCount] = companyId
      ? await db.select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.status, 'completed'), eq(tasks.companyId, companyId)))
      : await db.select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(eq(tasks.status, 'completed'));
    
    const [fileCount] = companyId
      ? await db.select({ count: sql<number>`count(*)` })
          .from(fileUploads)
          .innerJoin(users, eq(fileUploads.userId, users.id))
          .where(eq(users.companyId, companyId))
      : await db.select({ count: sql<number>`count(*)` }).from(fileUploads);

    return {
      totalUsers: Number(userCount.count),
      todayReports: Number(todayReportCount.count),
      pendingTasks: Number(pendingTaskCount.count),
      completedTasks: Number(completedTaskCount.count),
      totalFiles: Number(fileCount.count),
    };
  }

  async createAdminActivityLog(log: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const result = await db.insert(adminActivityLogs).values(log).returning();
    return result[0];
  }

  async getAllAdminActivityLogs(limit?: number): Promise<AdminActivityLog[]> {
    const query = db.select().from(adminActivityLogs).orderBy(desc(adminActivityLogs.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getAdminActivityLogsByCompany(companyId: number): Promise<AdminActivityLog[]> {
    return await db.select().from(adminActivityLogs)
      .where(eq(adminActivityLogs.targetCompanyId, companyId))
      .orderBy(desc(adminActivityLogs.createdAt));
  }

  async getAdminActivityLogsByUser(userId: number): Promise<AdminActivityLog[]> {
    return await db.select().from(adminActivityLogs)
      .where(or(
        eq(adminActivityLogs.performedBy, userId),
        eq(adminActivityLogs.targetUserId, userId)
      ))
      .orderBy(desc(adminActivityLogs.createdAt));
  }

  async getSuperAdminAnalytics(): Promise<{
    totalCompanies: number;
    activeCompanies: number;
    suspendedCompanies: number;
    totalUsers: number;
    totalAdmins: number;
    totalMembers: number;
    totalTasks: number;
    totalPayments: number;
    totalRevenue: number;
    recentPayments: CompanyPayment[];
  }> {
    const [totalCompaniesResult] = await db.select({ count: sql<number>`count(*)` }).from(companies);
    const [activeCompaniesResult] = await db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.isActive, true));
    const [suspendedCompaniesResult] = await db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.isActive, false));
    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));
    const [totalAdminsResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.isActive, true), eq(users.role, 'company_admin')));
    const [totalMembersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.isActive, true), eq(users.role, 'company_member')));
    const [totalTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks);
    const [totalPaymentsResult] = await db.select({ count: sql<number>`count(*)` }).from(companyPayments);
    const [totalRevenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(companyPayments).where(eq(companyPayments.paymentStatus, 'paid'));
    
    const recentPayments = await db.select().from(companyPayments)
      .orderBy(desc(companyPayments.createdAt))
      .limit(10);

    return {
      totalCompanies: Number(totalCompaniesResult.count),
      activeCompanies: Number(activeCompaniesResult.count),
      suspendedCompanies: Number(suspendedCompaniesResult.count),
      totalUsers: Number(totalUsersResult.count),
      totalAdmins: Number(totalAdminsResult.count),
      totalMembers: Number(totalMembersResult.count),
      totalTasks: Number(totalTasksResult.count),
      totalPayments: Number(totalPaymentsResult.count),
      totalRevenue: Number(totalRevenueResult.total),
      recentPayments,
    };
  }

  async getCompanyWithStats(companyId: number): Promise<{
    company: Company;
    userCount: number;
    adminCount: number;
    memberCount: number;
    taskCount: number;
    totalPayments: number;
    totalRevenue: number;
  } | null> {
    const company = await this.getCompanyById(companyId);
    if (!company) {
      return null;
    }

    const [userCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.companyId, companyId), eq(users.isActive, true)));
    const [adminCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.companyId, companyId), eq(users.isActive, true), eq(users.role, 'company_admin')));
    const [memberCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.companyId, companyId), eq(users.isActive, true), eq(users.role, 'company_member')));
    const [taskCountResult] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.companyId, companyId));
    const [paymentCountResult] = await db.select({ count: sql<number>`count(*)` }).from(companyPayments).where(eq(companyPayments.companyId, companyId));
    const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(companyPayments).where(and(eq(companyPayments.companyId, companyId), eq(companyPayments.paymentStatus, 'paid')));

    return {
      company,
      userCount: Number(userCountResult.count),
      adminCount: Number(adminCountResult.count),
      memberCount: Number(memberCountResult.count),
      taskCount: Number(taskCountResult.count),
      totalPayments: Number(paymentCountResult.count),
      totalRevenue: Number(revenueResult.total),
    };
  }

  async getAllCompaniesWithStats(): Promise<Array<{
    company: Company;
    userCount: number;
    adminCount: number;
    memberCount: number;
  }>> {
    const allCompanies = await db.select().from(companies).orderBy(desc(companies.createdAt));
    
    const companiesWithStats = await Promise.all(
      allCompanies.map(async (company) => {
        const [userCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.companyId, company.id), eq(users.isActive, true)));
        const [adminCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.companyId, company.id), eq(users.isActive, true), eq(users.role, 'company_admin')));
        const [memberCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.companyId, company.id), eq(users.isActive, true), eq(users.role, 'company_member')));

        return {
          company,
          userCount: Number(userCountResult.count),
          adminCount: Number(adminCountResult.count),
          memberCount: Number(memberCountResult.count),
        };
      })
    );

    return companiesWithStats;
  }

  async suspendCompany(companyId: number, performedBy: number): Promise<void> {
    await db.update(companies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    
    await this.createAdminActivityLog({
      actionType: 'suspend_company',
      performedBy,
      targetCompanyId: companyId,
      details: 'Company suspended by Super Admin',
    });
  }

  async reactivateCompany(companyId: number, performedBy: number): Promise<void> {
    await db.update(companies)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    
    await this.createAdminActivityLog({
      actionType: 'reactivate_company',
      performedBy,
      targetCompanyId: companyId,
      details: 'Company reactivated by Super Admin',
    });
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<CompanyPayment[]> {
    return await db.select().from(companyPayments)
      .where(and(
        gte(companyPayments.createdAt, startDate),
        lte(companyPayments.createdAt, endDate)
      ))
      .orderBy(desc(companyPayments.createdAt));
  }

  async getPaymentsByStatus(status: string): Promise<CompanyPayment[]> {
    return await db.select().from(companyPayments)
      .where(eq(companyPayments.paymentStatus, status))
      .orderBy(desc(companyPayments.createdAt));
  }
}

export const storage = new DbStorage();
