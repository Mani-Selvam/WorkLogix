import { db } from "./db";
import { 
  users, tasks, reports, messages, ratings, fileUploads, archiveReports, groupMessages, taskTimeLogs,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Report, type InsertReport,
  type Message, type InsertMessage,
  type Rating, type InsertRating,
  type FileUpload, type InsertFileUpload,
  type ArchiveReport,
  type GroupMessage, type InsertGroupMessage,
  type TaskTimeLog, type InsertTaskTimeLog
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  getUserByFirebaseUid(uid: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTaskById(id: number): Promise<Task | null>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  getAllTasks(): Promise<Task[]>;
  updateTaskStatus(id: number, status: string): Promise<void>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<void>;
  deleteTask(id: number): Promise<void>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReportsByUserId(userId: number): Promise<Report[]>;
  getReportsByUserAndDate(userId: number, startDate: Date, endDate: Date): Promise<Report[]>;
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
  getRecentGroupMessages(limit: number): Promise<GroupMessage[]>;
  
  // Task time log operations
  getTaskTimeLog(taskId: number, userId: number, date: string): Promise<TaskTimeLog | null>;
  createOrUpdateTaskTimeLog(log: InsertTaskTimeLog): Promise<TaskTimeLog>;
  startTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog>;
  pauseTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog>;
  completeTaskTimer(taskId: number, userId: number, date: string): Promise<TaskTimeLog>;
  getTaskTimeLogs(taskId: number, userId: number): Promise<TaskTimeLog[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalUsers: number;
    todayReports: number;
    pendingTasks: number;
    completedTasks: number;
    totalFiles: number;
  }>;
}

export class DbStorage implements IStorage {
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

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserRole(id: number, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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

  async getDashboardStats(): Promise<{
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

    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [todayReportCount] = await db.select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(gte(reports.createdAt, today));
    const [pendingTaskCount] = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.status, 'pending'));
    const [completedTaskCount] = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.status, 'completed'));
    const [fileCount] = await db.select({ count: sql<number>`count(*)` }).from(fileUploads);

    return {
      totalUsers: Number(userCount.count),
      todayReports: Number(todayReportCount.count),
      pendingTasks: Number(pendingTaskCount.count),
      completedTasks: Number(completedTaskCount.count),
      totalFiles: Number(fileCount.count),
    };
  }
}

export const storage = new DbStorage();
