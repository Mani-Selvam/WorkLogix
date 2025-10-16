import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertUserSchema, insertTaskSchema, insertReportSchema, insertMessageSchema, insertRatingSchema, insertFileUploadSchema, insertGroupMessageSchema, insertFeedbackSchema, loginSchema, signupSchema, firebaseSigninSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendReportNotification } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const role = validatedData.email.toLowerCase().includes("superadmin") ? "super_admin" 
        : validatedData.email.toLowerCase().includes("admin") ? "company_admin" 
        : "company_member";
      
      const user = await storage.createUser({
        email: validatedData.email,
        displayName: validatedData.displayName,
        password: hashedPassword,
        role,
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.post("/api/auth/signin", async (req, res, next) => {
    try {
      const validatedData = firebaseSigninSchema.parse(req.body);
      
      let user = await storage.getUserByFirebaseUid(validatedData.firebaseUid);
      
      if (!user) {
        user = await storage.getUserByEmail(validatedData.email);
        
        if (!user) {
          const role = validatedData.email.toLowerCase().includes("superadmin") ? "super_admin" 
            : validatedData.email.toLowerCase().includes("admin") ? "company_admin" 
            : "company_member";
          user = await storage.createUser({
            email: validatedData.email,
            displayName: validatedData.displayName,
            photoURL: validatedData.photoURL,
            firebaseUid: validatedData.firebaseUid,
            role,
          });
        }
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.get("/api/users", async (req, res, next) => {
    try {
      const { includeDeleted } = req.query;
      const users = await storage.getAllUsers(includeDeleted === 'true');
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const user = await storage.getUserById(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id/role", async (req, res, next) => {
    try {
      const { role } = req.body;
      await storage.updateUserRole(parseInt(req.params.id), role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      
      if (!requestingUser || (requestingUser.role !== 'company_admin' && requestingUser.role !== 'super_admin')) {
        return res.status(403).json({ message: "Only admins can delete users" });
      }
      
      const userId = parseInt(req.params.id);
      
      if (userId === requestingUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.softDeleteUser(userId);
      
      const { broadcast } = await import("./index");
      if (broadcast) {
        broadcast({ type: 'USER_DELETED', userId });
        broadcast({ type: 'USERS_UPDATED' });
      }
      
      res.json({ message: "User removed successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Company routes (Super Admin only)
  app.post("/api/companies", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can create companies" });
      }

      const validatedCompany = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedCompany);
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.get("/api/companies", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can view all companies" });
      }

      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/companies/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can view company details" });
      }

      const company = await storage.getCompanyById(parseInt(req.params.id));
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/companies/:id/users", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can view company users" });
      }

      const users = await storage.getUsersByCompanyId(parseInt(req.params.id));
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/companies/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can update companies" });
      }

      const updates = req.body;
      await storage.updateCompany(parseInt(req.params.id), updates);
      res.json({ message: "Company updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/companies/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can delete companies" });
      }

      await storage.deleteCompany(parseInt(req.params.id));
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Task routes
  app.post("/api/tasks", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || !requestingUser.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const validatedTask = insertTaskSchema.parse({ ...req.body, companyId: requestingUser.companyId });
      const task = await storage.createTask(validatedTask);
      
      if (validatedTask.assignedTo) {
        await storage.createMessage({
          senderId: validatedTask.assignedBy || 0,
          receiverId: validatedTask.assignedTo,
          message: `New task assigned: ${validatedTask.title}`,
          relatedTaskId: task.id,
          readStatus: false,
        });
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { userId, assignedBy } = req.query;
      
      if (userId) {
        const tasks = await storage.getTasksByUserId(parseInt(userId as string));
        // Filter by company unless super_admin
        if (requestingUser.role === 'super_admin') {
          res.json(tasks);
        } else {
          res.json(tasks.filter(task => task.companyId === requestingUser.companyId));
        }
      } else if (assignedBy) {
        const tasks = await storage.getTasksByAssignedBy(parseInt(assignedBy as string));
        // Filter by company unless super_admin
        if (requestingUser.role === 'super_admin') {
          res.json(tasks);
        } else {
          res.json(tasks.filter(task => task.companyId === requestingUser.companyId));
        }
      } else if (requestingUser.role === 'super_admin') {
        const tasks = await storage.getAllTasks();
        res.json(tasks);
      } else if (requestingUser.companyId) {
        const tasks = await storage.getTasksByCompanyId(requestingUser.companyId);
        res.json(tasks);
      } else {
        res.json([]);
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const task = await storage.getTaskById(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check company access unless super_admin
      if (requestingUser.role !== 'super_admin' && task.companyId !== requestingUser.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id/status", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const task = await storage.getTaskById(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check company access unless super_admin
      if (requestingUser.role !== 'super_admin' && task.companyId !== requestingUser.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.body;
      await storage.updateTaskStatus(parseInt(req.params.id), status);
      res.json({ message: "Task status updated" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const task = await storage.getTaskById(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check company access unless super_admin
      if (requestingUser.role !== 'super_admin' && task.companyId !== requestingUser.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = req.body;
      await storage.updateTask(parseInt(req.params.id), updates);
      res.json({ message: "Task updated" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tasks/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const task = await storage.getTaskById(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check company access unless super_admin
      if (requestingUser.role !== 'super_admin' && task.companyId !== requestingUser.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteTask(parseInt(req.params.id));
      res.json({ message: "Task deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Task timer routes
  app.get("/api/tasks/:id/timer", async (req, res, next) => {
    try {
      const { userId, date } = req.query;
      if (!userId || !date) {
        return res.status(400).json({ message: "userId and date are required" });
      }
      
      const timeLog = await storage.getTaskTimeLog(
        parseInt(req.params.id),
        parseInt(userId as string),
        date as string
      );
      res.json(timeLog);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks/:id/timer/start", async (req, res, next) => {
    try {
      const { userId, date } = req.body;
      if (!userId || !date) {
        return res.status(400).json({ message: "userId and date are required" });
      }
      
      const timeLog = await storage.startTaskTimer(
        parseInt(req.params.id),
        userId,
        date
      );
      res.json(timeLog);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks/:id/timer/pause", async (req, res, next) => {
    try {
      const { userId, date } = req.body;
      if (!userId || !date) {
        return res.status(400).json({ message: "userId and date are required" });
      }
      
      const timeLog = await storage.pauseTaskTimer(
        parseInt(req.params.id),
        userId,
        date
      );
      res.json(timeLog);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks/:id/timer/complete", async (req, res, next) => {
    try {
      const { userId, date } = req.body;
      if (!userId || !date) {
        return res.status(400).json({ message: "userId and date are required" });
      }
      
      const timeLog = await storage.completeTaskTimer(
        parseInt(req.params.id),
        userId,
        date
      );
      res.json(timeLog);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/:id/timer/logs", async (req, res, next) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const timeLogs = await storage.getTaskTimeLogs(
        parseInt(req.params.id),
        parseInt(userId as string)
      );
      res.json(timeLogs);
    } catch (error) {
      next(error);
    }
  });

  // Report routes
  app.post("/api/reports", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || !requestingUser.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      const validatedReport = insertReportSchema.parse({ ...req.body, companyId: requestingUser.companyId });
      const report = await storage.createReport(validatedReport);
      
      // Get user information for email
      const user = await storage.getUserById(validatedReport.userId);
      if (user) {
        // Send email notification asynchronously (don't wait for it)
        sendReportNotification({
          userName: user.displayName,
          reportType: validatedReport.reportType,
          plannedTasks: validatedReport.plannedTasks,
          completedTasks: validatedReport.completedTasks,
          pendingTasks: validatedReport.pendingTasks,
          notes: validatedReport.notes,
          createdAt: report.createdAt,
        }).catch(err => console.error('Failed to send email notification:', err));
      }
      
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { userId, startDate, endDate } = req.query;
      
      if (userId && startDate && endDate) {
        const reports = await storage.getReportsByUserAndDate(
          parseInt(userId as string),
          new Date(startDate as string),
          new Date(endDate as string)
        );
        // Filter by company unless super_admin
        if (requestingUser.role === 'super_admin') {
          res.json(reports);
        } else {
          res.json(reports.filter(report => report.companyId === requestingUser.companyId));
        }
      } else if (userId) {
        const reports = await storage.getReportsByUserId(parseInt(userId as string));
        // Filter by company unless super_admin
        if (requestingUser.role === 'super_admin') {
          res.json(reports);
        } else {
          res.json(reports.filter(report => report.companyId === requestingUser.companyId));
        }
      } else if (startDate && endDate) {
        const reports = await storage.getReportsByDate(
          new Date(startDate as string),
          new Date(endDate as string)
        );
        // Filter by company unless super_admin
        if (requestingUser.role === 'super_admin') {
          res.json(reports);
        } else {
          res.json(reports.filter(report => report.companyId === requestingUser.companyId));
        }
      } else if (requestingUser.role === 'super_admin') {
        const reports = await storage.getAllReports();
        res.json(reports);
      } else if (requestingUser.companyId) {
        const reports = await storage.getReportsByCompanyId(requestingUser.companyId);
        res.json(reports);
      } else {
        res.json([]);
      }
    } catch (error) {
      next(error);
    }
  });

  // Message routes
  app.post("/api/messages", async (req, res, next) => {
    try {
      const validatedMessage = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedMessage);
      res.json(message);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/messages", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { receiverId, unreadOnly } = req.query;
      
      if (receiverId) {
        // Only super_admin can query other users' messages
        if (requestingUser.role !== 'super_admin' && parseInt(receiverId as string) !== requestingUser.id) {
          return res.status(403).json({ message: "You can only view your own messages" });
        }
        
        const messages = unreadOnly === 'true'
          ? await storage.getUnreadMessagesByReceiverId(parseInt(receiverId as string))
          : await storage.getMessagesByReceiverId(parseInt(receiverId as string));
        res.json(messages);
      } else if (requestingUser.role === 'super_admin') {
        const messages = await storage.getAllMessages();
        res.json(messages);
      } else {
        // Default to showing requesting user's own messages
        const messages = await storage.getMessagesByReceiverId(requestingUser.id);
        res.json(messages);
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/messages/:id/read", async (req, res, next) => {
    try {
      await storage.markMessageAsRead(parseInt(req.params.id));
      res.json({ message: "Message marked as read" });
    } catch (error) {
      next(error);
    }
  });

  // Rating routes
  app.post("/api/ratings", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      
      if (!requestingUser || (requestingUser.role !== 'company_admin' && requestingUser.role !== 'super_admin')) {
        return res.status(403).json({ message: "Only admins can rate users" });
      }
      
      const ratingData = {
        userId: req.body.userId,
        ratedBy: requestingUser.id,
        rating: req.body.rating,
        feedback: req.body.feedback,
        period: req.body.period,
      };
      
      const validatedRating = insertRatingSchema.parse(ratingData);
      const rating = await storage.createRating(validatedRating);
      
      await storage.createMessage({
        senderId: requestingUser.id,
        receiverId: validatedRating.userId,
        message: `You received a new ${validatedRating.period} rating: ${validatedRating.rating}`,
        readStatus: false,
      });
      
      res.json(rating);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/ratings", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { userId, latest } = req.query;
      
      if (userId && latest === 'true') {
        const rating = await storage.getLatestRatingByUserId(parseInt(userId as string));
        // Check if the user belongs to the same company (unless super_admin)
        if (rating && requestingUser.role !== 'super_admin') {
          const ratedUser = await storage.getUserById(rating.userId);
          if (ratedUser && ratedUser.companyId !== requestingUser.companyId) {
            return res.status(403).json({ message: "Access denied" });
          }
        }
        res.json(rating);
      } else if (userId) {
        const ratings = await storage.getRatingsByUserId(parseInt(userId as string));
        // Filter by company unless super_admin
        if (requestingUser.role === 'super_admin') {
          res.json(ratings);
        } else {
          // Verify user is in same company
          const ratedUser = await storage.getUserById(parseInt(userId as string));
          if (ratedUser && ratedUser.companyId === requestingUser.companyId) {
            res.json(ratings);
          } else {
            res.json([]);
          }
        }
      } else if (requestingUser.role === 'super_admin') {
        const ratings = await storage.getAllRatings();
        res.json(ratings);
      } else if (requestingUser.companyId) {
        // Return ratings for users in the same company
        const companyUsers = await storage.getUsersByCompanyId(requestingUser.companyId);
        const companyUserIds = companyUsers.map(u => u.id);
        const allRatings = await storage.getAllRatings();
        const companyRatings = allRatings.filter(r => companyUserIds.includes(r.userId));
        res.json(companyRatings);
      } else {
        res.json([]);
      }
    } catch (error) {
      next(error);
    }
  });

  // File upload routes
  app.post("/api/files", async (req, res, next) => {
    try {
      const validatedFile = insertFileUploadSchema.parse(req.body);
      const file = await storage.createFileUpload(validatedFile);
      res.json(file);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/files", async (req, res, next) => {
    try {
      const { userId, reportId } = req.query;
      
      if (userId) {
        const files = await storage.getFilesByUserId(parseInt(userId as string));
        res.json(files);
      } else if (reportId) {
        const files = await storage.getFilesByReportId(parseInt(reportId as string));
        res.json(files);
      } else {
        const files = await storage.getAllFiles();
        res.json(files);
      }
    } catch (error) {
      next(error);
    }
  });

  // Archive routes
  app.post("/api/archive", async (req, res, next) => {
    try {
      const { month, year } = req.body;
      await storage.archiveReports(month, year);
      res.json({ message: "Reports archived successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/archive", async (req, res, next) => {
    try {
      const { userId } = req.query;
      const archives = await storage.getArchivedReports(
        userId ? parseInt(userId as string) : undefined
      );
      res.json(archives);
    } catch (error) {
      next(error);
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res, next) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Group message routes
  app.post("/api/group-messages", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      
      if (!requestingUser || (requestingUser.role !== 'company_admin' && requestingUser.role !== 'super_admin')) {
        return res.status(403).json({ message: "Only admins can send announcements" });
      }

      if (!requestingUser.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }
      
      const messageData = {
        companyId: requestingUser.companyId,
        senderId: requestingUser.id,
        title: req.body.title,
        message: req.body.message,
      };
      
      const validatedMessage = insertGroupMessageSchema.parse(messageData);
      const message = await storage.createGroupMessage(validatedMessage);
      res.json(message);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/group-messages", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { limit } = req.query;
      
      if (requestingUser.role === 'super_admin') {
        if (limit) {
          const messages = await storage.getRecentGroupMessages(parseInt(limit as string));
          res.json(messages);
        } else {
          const messages = await storage.getAllGroupMessages();
          res.json(messages);
        }
      } else if (requestingUser.companyId) {
        const messages = await storage.getGroupMessagesByCompanyId(requestingUser.companyId);
        if (limit) {
          res.json(messages.slice(0, parseInt(limit as string)));
        } else {
          res.json(messages);
        }
      } else {
        res.json([]);
      }
    } catch (error) {
      next(error);
    }
  });

  // Feedback routes
  app.post("/api/feedbacks", async (req, res, next) => {
    try {
      const validatedFeedback = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(validatedFeedback);
      res.json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.get("/api/feedbacks", async (req, res, next) => {
    try {
      const { userId } = req.query;
      
      if (userId) {
        const feedbacks = await storage.getFeedbacksByUserId(parseInt(userId as string));
        res.json(feedbacks);
      } else {
        const feedbacks = await storage.getAllFeedbacks();
        res.json(feedbacks);
      }
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
