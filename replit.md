# WorkLogix - Multi-Tenant Task Management System

## Overview

WorkLogix is a comprehensive multi-tenant task management system with a three-tier hierarchy: Super Admins managing multiple companies, each company having admins and members. Built with React, Firebase authentication, and PostgreSQL, featuring role-based access control, company-scoped data isolation, member slot limits, and time-based reporting.

## Current Status

-   ✅ **Multi-Tenant Architecture**: Three-tier hierarchy (Super Admin → Company Admin → Company Members)
-   ✅ **Company Management**: Slot-based member limits (maxAdmins, maxMembers) with enforcement
-   ✅ **Company Scoping**: All data (tasks, reports, messages, ratings) scoped by companyId
-   ✅ **Role System**: super_admin, company_admin, company_member with proper authorization
-   ✅ Firebase Google Authentication implemented
-   ✅ Multi-page navigation system with sidebar
-   ✅ Task timer functionality (Start/Pause/Complete with daily tracking)
-   ✅ User Dashboard with time-based forms
-   ✅ Admin Dashboard with task management & messaging
-   ✅ Complete UI/UX design with dark mode support
-   ✅ Backend API implementation with company-based authorization
-   ✅ Database schema with companies table and companyId foreign keys
-   ✅ Email notifications with Resend integration
-   ✅ View Reports feature for users
-   ⚠️ **CRITICAL**: Header-based authentication is development-only (see Security section below)

## Architecture

### Authentication

-   **Provider**: Firebase Authentication with Google Sign-In
-   **Flow**:
    1. User signs in with Google
    2. Firebase returns user credentials
    3. Role is determined (currently mock - needs database implementation)
    4. User is redirected to appropriate dashboard (Admin or User)

### User Roles & Hierarchy

-   **Super Admin** (`super_admin`): 
    - No company assignment (manages all companies)
    - Can view/manage all companies and users
    - Created via public signup with "superadmin" in email
    
-   **Company Admin** (`company_admin`):
    - Assigned to a specific company
    - Can manage users within their company
    - Can view company settings and usage
    - Limited by company's maxAdmins slot count
    
-   **Company Member** (`company_member`):
    - Assigned to a specific company  
    - Standard user access to tasks, reports, messages
    - Limited by company's maxMembers slot count

### User Creation Flow

-   **Public Signup**: Only creates super_admin (email must contain "superadmin")
-   **Company Users**: Must be created by admins via POST /api/users with company assignment
-   **Firebase Signin**: Only auto-creates super_admin, others must be pre-created by admins

## Key Features

### User Dashboard

-   Time-based forms (Morning 9:30-11:30 AM, Evening 6:30-11:30 PM)
-   View submitted reports with "View All Reports" button showing all report fields
-   Assigned tasks with status tracking
-   Private message inbox (admin → user communication)
-   Group announcements (read-only, from admin)
-   Performance ratings display with count
-   File uploads for screenshots and PDFs

### Admin Dashboard

-   **Company Information Display**: Shows company name, member counts, slot limits
-   **Company Management Page**: Edit company settings (name, maxAdmins, maxMembers)
-   **Company Removal (Super Admin)**: Delete company with confirmation modal and optimistic UI updates
-   Overview metrics (Total Users, Reports, Tasks, Files) - scoped to company
-   Task creation and assignment - scoped to company members
-   User management with rating capability:
    - Shows available slots when creating users
    - Enforces maxAdmins/maxMembers limits
    - Only displays users from admin's company (unless super_admin)
-   Reports management with filtering - scoped to company
-   Communication Center with tabs:
    -   Private Messages: One-on-one chat with users
    -   Announcements: Broadcast messages to all users
-   Ratings and feedback system - scoped to company
-   Archive management

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
-   **Authentication**: Firebase (Google Sign-In)
-   **Backend**: Express.js
-   **Database**: PostgreSQL
-   **Email**: Resend (for transactional emails)
-   **State Management**: React Query, Context API

## Environment Variables

Required Firebase secrets (already configured):

-   `VITE_FIREBASE_API_KEY`
-   `VITE_FIREBASE_APP_ID`
-   `VITE_FIREBASE_PROJECT_ID`

## Routes

### Authentication
-   `/` - Login page (Company Registration, Company Admin, Company User)
-   `/superadmin` - Super Admin login (separate route for enhanced security)

### Admin Routes
-   `/admin` - Admin dashboard (protected, admin role only)

### User Routes (Protected)
-   `/user/overview` - Dashboard with statistics and overview
-   `/user/reports` - Submit morning/evening reports
-   `/user/messages` - View private messages from admin
-   `/user/feedback` - Submit feedback
-   `/user/announcements` - View group announcements
-   `/user/tasks` - View assigned tasks with timer functionality
-   `/user/report-view` - View all submitted reports
-   `/user/ratings` - View performance ratings

## Database Schema

Implemented tables:

-   **companies**: Company accounts with name, maxAdmins, maxMembers slot limits
-   **users**: User accounts with Firebase UID, email, display name, role, photo, companyId (FK)
-   **tasks**: Task assignments with priority, deadline, status, companyId (FK)
-   **task_time_logs**: Daily time tracking for tasks
-   **reports**: Time-based reports (morning/evening), companyId (FK)
-   **messages**: Private messages between admin and users, companyId (FK)
-   **group_messages**: Admin announcements to all users, companyId (FK)
-   **ratings**: Performance ratings and feedback, companyId (FK)
-   **file_uploads**: File attachments for reports, companyId (FK)
-   **archive_reports**: Archived historical reports, companyId (FK)

All multi-tenant data tables include `companyId` foreign key for proper data isolation.

## API Endpoints

All REST endpoints implemented with company-based authorization:

-   `/api/auth/*` - Authentication (signup, login, Firebase signin)
    - Signup/signin restricted to super_admin creation only
-   `/api/companies` - Company CRUD operations (super_admin only)
-   `/api/my-company` - Get/update current user's company settings
-   `/api/users/*` - User management with company scoping:
    - GET /api/users - Filters by company (super_admin sees all)
    - GET /api/users/:id - Company scoping check
    - POST /api/users - Slot enforcement and company assignment
    - PATCH /api/users/:id/role - Company scoping check
    - DELETE /api/users/:id - Company scoping check
-   `/api/tasks/*` - Task CRUD operations (company-scoped)
-   `/api/reports/*` - Report submissions and viewing (company-scoped)
-   `/api/messages/*` - Private messaging (company-scoped)
-   `/api/group-messages/*` - Group announcements (company-scoped)
-   `/api/ratings/*` - Performance ratings (company-scoped)
-   `/api/files/*` - File uploads (company-scoped)
-   `/api/archive/*` - Archive management (company-scoped)
-   `/api/dashboard/stats` - Dashboard metrics (company-scoped)

## CRITICAL SECURITY LIMITATION ⚠️

**Current State**: The application uses client-supplied `x-user-id` headers for authentication in a development environment. **This is NOT production-ready.**

### Security Issues:
-   Header can be forged/spoofed by any client
-   Allows privilege escalation to super_admin
-   Enables cross-tenant data access via header manipulation
-   No cryptographic verification of user identity

### What's Implemented:
✅ **Authorization Logic**: All endpoints have company-scoping and role checks
✅ **Multi-Tenant Isolation**: Data filtering by companyId is in place
✅ **Slot Enforcement**: Member limits are validated server-side
✅ **Role-Based Access**: Proper authorization for super_admin/company_admin/company_member

### What's Missing:
❌ **Authentication**: No server-side verification that the x-user-id header is genuine

### Production Requirements:

1. **Firebase Admin SDK** (Recommended):
    - Install `firebase-admin` on backend
    - Verify Firebase ID tokens server-side
    - Extract user ID from verified token (not from header)
    
2. **Alternative - Session Management**:
    - Implement express-session with secure cookies
    - Store authenticated user in server-side session
    - Validate session on each request (not from header)

### Impact:
-   **Development**: System is fully functional for testing multi-tenant features
-   **Production**: MUST implement proper authentication before deploying
-   All authorization logic is ready and will work correctly once authentication is properly implemented

## Recent Updates

### October 16, 2025 - Authentication & Company Management Enhancements
- ✅ **User Login Enhancement**: Company users now login with User ID (uniqueUserId) instead of username for better security
- ✅ **Logout Optimization**: Removed artificial delay, logout now redirects instantly
- ✅ **Super Admin Isolation**: Moved Super Admin login to dedicated `/superadmin` route
  - Main login page only shows Company Registration, Company Admin, and Company User tabs
  - Discrete "Super Admin Access" link on main page for authorized personnel
  - Enhanced security by separating admin access from regular user flows
- ✅ **Company Removal Feature**: Super Admin can now remove companies
  - Delete button (trash icon) next to each company in Dashboard
  - Confirmation modal: "Are you sure you want to remove [Company Name]?"
  - Optimistic UI updates: company disappears immediately, rolls back on failure
  - Proper error handling and loading states
  - Currently performs soft delete (sets isActive to false)

### October 16, 2025 - Multi-Tenant Architecture
- ✅ Implemented three-tier hierarchy (Super Admin → Company Admin → Company Members)
- ✅ Added companies table with slot limits (maxAdmins, maxMembers)
- ✅ Updated all data tables with companyId foreign keys for tenant isolation
- ✅ Created Company Management page for viewing/editing company settings
- ✅ Added company information display to admin and user dashboards
- ✅ Implemented member slot enforcement with backend validation
- ✅ Added company-scoped authorization to all user endpoints
- ✅ Restricted public signup to super_admin creation only
- ✅ Updated role system to support super_admin, company_admin, company_member

### October 15, 2025

### Navigation System Overhaul
- ✅ Replaced single-page dashboard with multi-page navigation
- ✅ Left sidebar navigation with 8 sections:
  1. Overview - Dashboard statistics
  2. Reports - Submit morning/evening reports
  3. Messages - Private messages inbox
  4. Feedback - Submit feedback
  5. Announcements - View group messages
  6. Assigned Tasks - Task list with timer
  7. View Reports - All submitted reports
  8. Ratings - Performance ratings
- ✅ UserLayout component with persistent sidebar
- ✅ Each section is a separate page for better organization

### Task Timer System
- ✅ Added task_time_logs table for daily time tracking
- ✅ Start/Pause/Complete buttons on each task
- ✅ Real-time timer display (HH:MM:SS format)
- ✅ Daily time tracking per task
- ✅ Timer state persists across page refreshes
- ✅ Complete button marks task as "completed" (visible to admin)
- ✅ Completed tasks show "Completed Today" badge

### Email Notifications
- ✅ Integrated Resend for transactional emails
- ✅ Automatic email notification to maniselvam2023@gmail.com when users submit reports
- ✅ Email includes all report details: planned tasks, completed tasks, pending tasks, and notes
- ✅ Rich HTML email template with proper formatting

### View Reports Feature
- ✅ Dedicated page for viewing all submitted reports
- ✅ Shows all report fields: report type, timestamp, planned/completed/pending tasks, notes
- ✅ Properly formatted with date/time display using date-fns

## Next Steps

1. **URGENT - Production Security**: 
   - Implement Firebase Admin SDK or session-based authentication
   - Replace x-user-id header with server-verified identity
   - Test all authorization flows with proper authentication
   
2. **Multi-Tenant Enhancements**:
   - Add company selection UI for super admins
   - Implement company switching for super admins
   - Add company analytics and usage reports
   
3. **Additional Features**:
   - Implement file upload to cloud storage (Firebase Storage or S3)
   - Add real-time notifications for new messages/tasks
   - Implement data export functionality
   - Add audit logging for admin actions

## Design Guidelines

-   Clean, modern interface with Linear + Notion hybrid design
-   Professional color scheme with deep blue primary
-   Inter font for UI, JetBrains Mono for data/timestamps
-   Responsive design with mobile-first approach
-   Dark mode support throughout
