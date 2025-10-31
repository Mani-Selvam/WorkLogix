import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertUserSchema, insertTaskSchema, insertReportSchema, insertMessageSchema, insertRatingSchema, insertFileUploadSchema, insertGroupMessageSchema, insertFeedbackSchema, loginSchema, signupSchema, firebaseSigninSchema, companyRegistrationSchema, superAdminLoginSchema, companyAdminLoginSchema, companyUserLoginSchema, insertSlotPricingSchema, insertCompanyPaymentSchema, updatePaymentStatusSchema, slotPurchaseSchema, passwordResetRequestSchema, passwordResetSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendReportNotification, sendCompanyServerIdEmail, sendUserIdEmail, sendPasswordResetEmail, sendPaymentConfirmationEmail } from "./email";
import crypto from "crypto";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Company Registration
  app.post("/api/auth/register-company", async (req, res, next) => {
    try {
      const validatedData = companyRegistrationSchema.parse(req.body);
      
      const existingCompany = await storage.getCompanyByEmail(validatedData.email);
      if (existingCompany) {
        return res.status(400).json({ message: "Company with this email already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const company = await storage.createCompany({
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      });
      
      await sendCompanyServerIdEmail({
        companyName: company.name,
        companyEmail: company.email,
        serverId: company.serverId,
      });
      
      const { password: _, ...companyWithoutPassword } = company;
      res.json({ 
        ...companyWithoutPassword,
        message: `Company registered successfully! Your Company Server ID is: ${company.serverId}. Please save this ID, it will be required for login. An email has been sent to ${company.email} with your server ID.`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Super Admin Login
  app.post("/api/auth/super-admin-login", async (req, res, next) => {
    try {
      const validatedData = superAdminLoginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || user.role !== 'super_admin' || !user.password) {
        return res.status(401).json({ message: "Invalid credentials or not a super admin" });
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

  // Company Admin Login
  app.post("/api/auth/company-admin-login", async (req, res, next) => {
    try {
      const validatedData = companyAdminLoginSchema.parse(req.body);
      
      const company = await storage.getCompanyByServerId(validatedData.serverId);
      if (!company) {
        return res.status(401).json({ message: "Invalid Company Server ID" });
      }
      
      if (company.name !== validatedData.companyName || company.email !== validatedData.email) {
        return res.status(401).json({ message: "Invalid company credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(validatedData.password, company.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      const adminUsers = await storage.getUsersByCompanyId(company.id);
      const adminUser = adminUsers.find(u => u.role === 'company_admin' && u.email === validatedData.email);
      
      if (!adminUser) {
        const hashedUserPassword = await bcrypt.hash(validatedData.password, 10);
        const newAdmin = await storage.createUser({
          email: validatedData.email,
          displayName: validatedData.companyName + ' Admin',
          password: hashedUserPassword,
          role: 'company_admin',
          companyId: company.id,
        });
        
        await sendUserIdEmail({
          userName: newAdmin.displayName,
          userEmail: newAdmin.email,
          uniqueUserId: newAdmin.uniqueUserId,
          role: newAdmin.role,
        });
        
        const { password: _, ...userWithoutPassword } = newAdmin;
        return res.json({ 
          ...userWithoutPassword, 
          message: `Welcome! Your unique User ID is: ${newAdmin.uniqueUserId}. An email has been sent to ${newAdmin.email} with your user ID.` 
        });
      }
      
      const { password: _, ...userWithoutPassword } = adminUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Company User Login
  app.post("/api/auth/company-user-login", async (req, res, next) => {
    try {
      const validatedData = companyUserLoginSchema.parse(req.body);
      
      const user = await storage.getUserByUniqueUserId(validatedData.userId);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid User ID" });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive. Please contact your administrator." });
      }
      
      if (!user.companyId) {
        return res.status(401).json({ message: "User is not associated with any company" });
      }
      
      if (user.displayName !== validatedData.username) {
        return res.status(401).json({ message: "Invalid username" });
      }
      
      if (user.role === 'super_admin' || user.role === 'company_admin') {
        return res.status(401).json({ message: "Please use the appropriate login form for your role" });
      }
      
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid password" });
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

  // User routes
  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Public signup only creates super admins
      // Company users must be created by admins via POST /api/users
      const role = validatedData.email.toLowerCase().includes("superadmin") ? "super_admin" : null;
      
      if (!role) {
        return res.status(400).json({ 
          message: "Public signup is restricted. Please contact your company administrator to create an account." 
        });
      }
      
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
          // Firebase signin only creates super admins
          // Company users must be created by admins
          const role = validatedData.email.toLowerCase().includes("superadmin") ? "super_admin" : null;
          
          if (!role) {
            return res.status(400).json({ 
              message: "Account not found. Please contact your company administrator to create an account." 
            });
          }
          
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
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { includeDeleted } = req.query;
      let users = await storage.getAllUsers(includeDeleted === 'true');

      // Filter by company unless super_admin
      if (requestingUser.role === 'super_admin') {
        // Super admins can see all users
      } else if (requestingUser.companyId) {
        // Company admins and members can only see users in their company
        users = users.filter(u => u.companyId === requestingUser.companyId);
      } else {
        // Users without a company can't see any users
        users = [];
      }
      
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "Requesting user not found" });
      }

      const user = await storage.getUserById(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Company scoping: users can only view users in their company (or all if super_admin)
      if (requestingUser.role !== 'super_admin' && user.companyId !== requestingUser.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id/role", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || (requestingUser.role !== 'company_admin' && requestingUser.role !== 'super_admin')) {
        return res.status(403).json({ message: "Only admins can update roles" });
      }

      const targetUser = await storage.getUserById(parseInt(req.params.id));
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Company scoping: admins can only update users in their company (or all if super_admin)
      if (requestingUser.role !== 'super_admin' && targetUser.companyId !== requestingUser.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { role } = req.body;
      await storage.updateUserRole(parseInt(req.params.id), role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      
      if (!requestingUser || (requestingUser.role !== 'company_admin' && requestingUser.role !== 'super_admin')) {
        return res.status(403).json({ message: "Only admins can create users" });
      }

      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Check slot availability for company admins
      if (requestingUser.role === 'company_admin' && requestingUser.companyId) {
        const company = await storage.getCompanyById(requestingUser.companyId);
        const users = await storage.getUsersByCompanyId(requestingUser.companyId);
        
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }

        const adminCount = users.filter(u => u.role === 'company_admin').length;
        const memberCount = users.filter(u => u.role === 'company_member').length;

        if (validatedData.role === 'company_admin' && adminCount >= company.maxAdmins) {
          return res.status(400).json({ 
            message: `Admin slots full. Current: ${adminCount}/${company.maxAdmins}. Please upgrade your plan.` 
          });
        }

        if (validatedData.role === 'company_member' && memberCount >= company.maxMembers) {
          return res.status(400).json({ 
            message: `Member slots full. Current: ${memberCount}/${company.maxMembers}. Please upgrade your plan.` 
          });
        }

        validatedData.companyId = requestingUser.companyId;
      }
      
      const hashedPassword = validatedData.password ? await bcrypt.hash(validatedData.password, 10) : undefined;
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
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

      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Company scoping: admins can only delete users in their company (or all if super_admin)
      if (requestingUser.role !== 'super_admin' && targetUser.companyId !== requestingUser.companyId) {
        return res.status(403).json({ message: "Access denied" });
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
      
      await storage.createAdminActivityLog({
        actionType: 'delete_company',
        performedBy: requestingUser.id,
        targetCompanyId: parseInt(req.params.id),
        details: `Company ${req.params.id} deleted`,
      });
      
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Super Admin Dashboard Routes
  app.get("/api/super-admin/companies-with-stats", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const companiesWithStats = await storage.getAllCompaniesWithStats();
      res.json(companiesWithStats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/super-admin/companies/:id/stats", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const companyStats = await storage.getCompanyWithStats(parseInt(req.params.id));
      if (!companyStats) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(companyStats);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/super-admin/companies/:id/suspend", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.suspendCompany(parseInt(req.params.id), requestingUser.id);
      res.json({ message: "Company suspended successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/super-admin/companies/:id/reactivate", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.reactivateCompany(parseInt(req.params.id), requestingUser.id);
      res.json({ message: "Company reactivated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/super-admin/analytics", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const analytics = await storage.getSuperAdminAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/super-admin/activity-logs", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getAllAdminActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/super-admin/activity-logs/company/:companyId", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const logs = await storage.getAdminActivityLogsByCompany(parseInt(req.params.companyId));
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/super-admin/payments", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { startDate, endDate, status } = req.query;
      
      let payments;
      if (startDate && endDate) {
        payments = await storage.getPaymentsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else if (status) {
        payments = await storage.getPaymentsByStatus(status as string);
      } else {
        payments = await storage.getAllCompanyPayments();
      }
      
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });

  // Company Admin routes (for managing their own company)
  app.get("/api/my-company", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || !requestingUser.companyId) {
        return res.status(404).json({ message: "User not associated with a company" });
      }

      const company = await storage.getCompanyById(requestingUser.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const users = await storage.getUsersByCompanyId(requestingUser.companyId);
      const adminCount = users.filter(u => u.role === 'company_admin').length;
      const memberCount = users.filter(u => u.role === 'company_member').length;

      res.json({
        ...company,
        currentAdmins: adminCount,
        currentMembers: memberCount,
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/my-company", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'company_admin') {
        return res.status(403).json({ message: "Only company admins can update company settings" });
      }

      if (!requestingUser.companyId) {
        return res.status(404).json({ message: "User not associated with a company" });
      }

      const updates = req.body;
      await storage.updateCompany(requestingUser.companyId, updates);
      res.json({ message: "Company updated successfully" });
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
      const requestingUserId = req.headers['x-user-id'];
      
      let companyId: number | undefined;
      
      if (requestingUserId) {
        const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
        
        if (requestingUser && requestingUser.role !== 'super_admin' && requestingUser.companyId) {
          companyId = requestingUser.companyId;
        }
      }
      
      const stats = await storage.getDashboardStats(companyId);
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

  // Slot Pricing routes
  app.get("/api/slot-pricing", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Allow super_admin and company_admin to view pricing
      if (requestingUser.role !== 'super_admin' && requestingUser.role !== 'company_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const pricing = await storage.getAllSlotPricing();
      res.json(pricing);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/slot-pricing", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can modify slot pricing" });
      }

      const validatedData = insertSlotPricingSchema.parse(req.body);
      const pricing = await storage.createOrUpdateSlotPricing(validatedData);
      
      res.json(pricing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Purchase Slots
  app.post("/api/purchase-slots", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || !requestingUser.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (requestingUser.role !== 'company_admin') {
        return res.status(403).json({ message: "Only company admins can purchase slots" });
      }

      const validatedData = slotPurchaseSchema.parse(req.body);

      const pricing = await storage.getSlotPricingByType(validatedData.slotType);
      if (!pricing) {
        return res.status(404).json({ message: `Pricing not found for ${validatedData.slotType} slots` });
      }

      const totalAmount = pricing.pricePerSlot * validatedData.quantity;

      const payment = await storage.createCompanyPayment({
        companyId: requestingUser.companyId,
        slotType: validatedData.slotType,
        slotQuantity: validatedData.quantity,
        amount: totalAmount,
        currency: pricing.currency,
        paymentStatus: 'paid',
        paymentMethod: 'online',
        transactionId: `TXN-${Date.now()}`,
      });

      const updateData = validatedData.slotType === 'admin'
        ? { maxAdmins: validatedData.quantity }
        : { maxMembers: validatedData.quantity };

      await storage.incrementCompanySlots(requestingUser.companyId, updateData);

      res.json({ 
        success: true, 
        message: `Successfully purchased ${validatedData.quantity} ${validatedData.slotType} slot(s)`,
        payment 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Stripe Payment Intent Creation
  app.post("/api/create-payment-intent", async (req, res, next) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment gateway not configured" });
      }

      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || !requestingUser.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (requestingUser.role !== 'company_admin') {
        return res.status(403).json({ message: "Only company admins can purchase slots" });
      }

      const { slotType, quantity } = req.body;

      // Fetch server-side pricing to prevent tampering
      const pricing = await storage.getSlotPricingByType(slotType);
      if (!pricing) {
        return res.status(400).json({ message: "Invalid slot type" });
      }

      // Calculate amount server-side from authoritative pricing
      const calculatedAmount = pricing.pricePerSlot * quantity;

      // Create payment record with server-calculated amount
      const payment = await storage.createCompanyPayment({
        companyId: requestingUser.companyId,
        slotType,
        slotQuantity: quantity,
        amount: calculatedAmount,
        currency: "INR",
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
      });

      // Create Stripe payment intent with server-calculated amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(calculatedAmount * 100), // Convert to paise (INR smallest unit)
        currency: "inr",
        metadata: {
          paymentId: payment.id.toString(),
          companyId: requestingUser.companyId.toString(),
          slotType,
          quantity: quantity.toString(),
        },
      });

      // Update payment with Stripe payment intent ID
      await storage.updatePaymentStripeId(payment.id, paymentIntent.id);

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Verify Payment and Update Slots
  app.post("/api/verify-payment", async (req, res, next) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment gateway not configured" });
      }

      const { paymentIntentId, paymentId } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not successful" });
      }

      // Get payment record
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      // Verify metadata matches to prevent tampering
      if (paymentIntent.metadata.paymentId !== paymentId.toString()) {
        return res.status(400).json({ message: "Payment verification failed: metadata mismatch" });
      }

      // Prevent duplicate processing
      if (payment.paymentStatus === 'paid') {
        // Payment already processed - return success with existing receipt
        return res.json({ 
          success: true, 
          message: "Payment already processed",
          payment,
          receiptNumber: payment.receiptNumber,
          emailSent: payment.emailSent,
        });
      }

      // Get company details for email
      const company = await storage.getCompanyById(payment.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Generate unique receipt number using payment ID for guaranteed uniqueness
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const receiptNumber = `WL-RCPT-${dateStr}-${paymentId.toString().padStart(6, '0')}`;

      // Prepare slot updates
      const slotUpdates = payment.slotType === 'admin'
        ? { maxAdmins: payment.slotQuantity || 0 }
        : { maxMembers: payment.slotQuantity || 0 };

      // CRITICAL: Atomic transaction - complete payment and update slots together
      const updatedPayment = await storage.completePaymentWithSlots(
        paymentId,
        payment.companyId,
        receiptNumber,
        paymentIntent.id,
        slotUpdates
      );

      // If null, payment was already processed by concurrent request - fetch current state
      if (!updatedPayment) {
        const currentPayment = await storage.getPaymentById(paymentId);
        if (!currentPayment) {
          return res.status(404).json({ message: "Payment record not found" });
        }
        // Return existing receipt data (idempotent retry succeeded)
        return res.json({ 
          success: true, 
          message: "Payment already processed",
          payment: currentPayment,
          receiptNumber: currentPayment.receiptNumber,
          emailSent: currentPayment.emailSent,
        });
      }

      // Send email asynchronously (non-fatal - don't block on email failure)
      let emailSent = false;
      try {
        emailSent = await sendPaymentConfirmationEmail({
          companyName: company.name,
          companyEmail: company.email,
          receiptNumber,
          amount: payment.amount,
          currency: payment.currency,
          slotType: payment.slotType || 'member',
          slotQuantity: payment.slotQuantity || 1,
          transactionId: paymentIntent.id,
          paymentDate: date,
        });

        // Update email sent status if successful
        if (emailSent) {
          await storage.updatePaymentEmailStatus(paymentId, true);
        }
      } catch (emailError: any) {
        console.error("Email sending failed (non-fatal):", emailError);
        // Email failure is logged but doesn't fail the payment
      }

      res.json({ 
        success: true, 
        message: "Payment verified and slots added successfully",
        payment: updatedPayment,
        receiptNumber,
        emailSent,
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      next(error);
    }
  });

  // Get company's own payment history (Company Admin)
  app.get("/api/my-company-payments", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || !requestingUser.companyId) {
        return res.status(403).json({ message: "User must belong to a company" });
      }

      if (requestingUser.role !== 'company_admin') {
        return res.status(403).json({ message: "Only company admins can view payment history" });
      }

      const payments = await storage.getPaymentsByCompanyId(requestingUser.companyId);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });

  // Company Payment routes (Super Admin only)
  app.get("/api/company-payments", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can access company payments" });
      }

      const { companyId } = req.query;
      
      if (companyId) {
        const payments = await storage.getPaymentsByCompanyId(parseInt(companyId as string));
        res.json(payments);
      } else {
        const payments = await storage.getAllCompanyPayments();
        res.json(payments);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/company-payments", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can create company payments" });
      }

      const validatedData = insertCompanyPaymentSchema.parse(req.body);
      const payment = await storage.createCompanyPayment(validatedData);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.patch("/api/company-payments/:id/status", async (req, res, next) => {
    try {
      const requestingUserId = req.headers['x-user-id'];
      if (!requestingUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestingUser = await storage.getUserById(parseInt(requestingUserId as string));
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can update payment status" });
      }

      const { id } = req.params;
      const validatedData = updatePaymentStatusSchema.parse(req.body);
      
      const paymentId = parseInt(id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      await storage.updatePaymentStatus(paymentId, { paymentStatus: validatedData.status });
      res.json({ message: "Payment status updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Password Reset routes
  app.post("/api/auth/request-password-reset", async (req, res, next) => {
    try {
      const validatedData = passwordResetRequestSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.json({ message: "If an account exists with this email, a password reset link has been sent." });
      }
      
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      await storage.createPasswordResetToken(validatedData.email, resetToken, expiresAt);
      
      await sendPasswordResetEmail({
        email: validatedData.email,
        resetToken,
        userName: user.displayName,
      });
      
      res.json({ message: "If an account exists with this email, a password reset link has been sent." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      const validatedData = passwordResetSchema.parse(req.body);
      
      const tokenData = await storage.getPasswordResetToken(validatedData.token);
      
      if (!tokenData) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      if (tokenData.used) {
        return res.status(400).json({ message: "This reset token has already been used" });
      }
      
      if (new Date() > new Date(tokenData.expiresAt)) {
        return res.status(400).json({ message: "This reset token has expired" });
      }
      
      const user = await storage.getUserByEmail(tokenData.email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
      
      await storage.updateUserPassword(user.id, hashedPassword);
      
      if (user.role === 'company_admin' && user.companyId) {
        await storage.updateCompany(user.companyId, { password: hashedPassword });
      }
      
      await storage.markTokenAsUsed(validatedData.token);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
