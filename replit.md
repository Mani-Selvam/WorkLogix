# WorkLogix - Employee Work Tracking & Task Management

## Overview

WorkLogix is a comprehensive employee work tracking and task management system built with React, Firebase authentication, and PostgreSQL. The system features Google Sign-In, role-based access control, time-based reporting, and complete data isolation between users.

## Current Status

-   ✅ Firebase Google Authentication implemented
-   ✅ Role-based routing (Admin vs User)
-   ✅ **NEW**: Multi-page navigation system with sidebar
-   ✅ **NEW**: Task timer functionality (Start/Pause/Complete with daily tracking)
-   ✅ User Dashboard with time-based forms
-   ✅ Admin Dashboard with task management & messaging
-   ✅ Complete UI/UX design with dark mode support
-   ✅ Backend API implementation complete
-   ✅ Database schema implemented (including task_time_logs)
-   ✅ Email notifications with Resend integration
-   ✅ View Reports feature for users
-   ⚠️ **CRITICAL**: Server-side authentication needs implementation (see Security section below)

## Architecture

### Authentication

-   **Provider**: Firebase Authentication with Google Sign-In
-   **Flow**:
    1. User signs in with Google
    2. Firebase returns user credentials
    3. Role is determined (currently mock - needs database implementation)
    4. User is redirected to appropriate dashboard (Admin or User)

### User Roles

-   **Admin**: Access to admin dashboard with task creation, user management, reports viewing
-   **User**: Access to user dashboard with assigned tasks, time-based forms, messages, and ratings

### Current Role Assignment (Temporary)

-   If email contains "admin" → Admin role
-   Otherwise → User role
-   TODO: Implement proper role assignment from database

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

-   Overview metrics (Total Users, Reports, Tasks, Files)
-   Task creation and assignment
-   User management with rating capability
-   Reports management with filtering
-   Communication Center with tabs:
    -   Private Messages: One-on-one chat with users
    -   Announcements: Broadcast messages to all users
-   Ratings and feedback system
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
-   `/` - Login page (Google Sign-In)

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

-   **users**: User accounts with Firebase UID, email, display name, role, photo
-   **tasks**: Task assignments with priority, deadline, status
-   **task_time_logs**: Daily time tracking for tasks (NEW)
-   **reports**: Time-based reports (morning/evening)
-   **messages**: Private messages between admin and users
-   **group_messages**: Admin announcements to all users
-   **ratings**: Performance ratings and feedback
-   **file_uploads**: File attachments for reports
-   **archive_reports**: Archived historical reports

## API Endpoints

All REST endpoints implemented:

-   `/api/auth/*` - Authentication (signup, login, Firebase signin)
-   `/api/users/*` - User management
-   `/api/tasks/*` - Task CRUD operations
-   `/api/reports/*` - Report submissions and viewing
-   `/api/messages/*` - Private messaging
-   `/api/group-messages/*` - Group announcements (NEW)
-   `/api/ratings/*` - Performance ratings (NEW)
-   `/api/files/*` - File uploads
-   `/api/archive/*` - Archive management
-   `/api/dashboard/stats` - Dashboard metrics

## CRITICAL SECURITY ISSUE ⚠️

**Current State**: The application uses client-supplied `x-user-id` headers for authentication, which can be forged by any user. This allows:

-   Privilege escalation to admin role
-   Unauthorized access to admin-only features
-   User impersonation

**Required Fix**: Implement proper server-side authentication

1. **Firebase Admin SDK** (Recommended):
    - Install `firebase-admin` on backend
    - Verify Firebase ID tokens server-side
    - Extract user ID from verified token
2. **Alternative - Session Management**:
    - Implement express-session with secure cookies
    - Store authenticated user in server-side session
    - Validate session on each request

**Affected Features**:

-   Admin-only operations: user deletion, rating users, sending announcements
-   All features work functionally but lack proper authentication

## Recent Updates (October 15, 2025)

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

1. **URGENT**: Implement Firebase Admin SDK or proper session authentication
2. Implement file upload to cloud storage (Firebase Storage or S3)
3. Add real-time notifications for new messages/tasks
4. Implement data export functionality

## Design Guidelines

-   Clean, modern interface with Linear + Notion hybrid design
-   Professional color scheme with deep blue primary
-   Inter font for UI, JetBrains Mono for data/timestamps
-   Responsive design with mobile-first approach
-   Dark mode support throughout
