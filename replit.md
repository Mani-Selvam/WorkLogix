# WorkLogix - Employee Work Tracking & Task Management

## Overview

WorkLogix is a comprehensive employee work tracking and task management system built with React, Firebase authentication, and PostgreSQL. The system features Google Sign-In, role-based access control, time-based reporting, and complete data isolation between users.

## Current Status

-   ✅ Firebase Google Authentication implemented
-   ✅ Role-based routing (Admin vs User)
-   ✅ User Dashboard with time-based forms
-   ✅ Admin Dashboard with task management & messaging
-   ✅ Complete UI/UX design with dark mode support
-   ✅ Backend API implementation complete
-   ✅ Database schema implemented
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

-   `/` - Login page (Google Sign-In)
-   `/user` - User dashboard (protected, user role only)
-   `/admin` - Admin dashboard (protected, admin role only)

## Database Schema

Implemented tables:

-   **users**: User accounts with Firebase UID, email, display name, role, photo
-   **tasks**: Task assignments with priority, deadline, status
-   **reports**: Time-based reports (morning/evening)
-   **messages**: Private messages between admin and users
-   **group_messages**: Admin announcements to all users (NEW)
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

### Email Notifications
- ✅ Integrated Resend for transactional emails
- ✅ Automatic email notification to maniselvam2023@gmail.com when users submit reports
- ✅ Email includes all report details: planned tasks, completed tasks, pending tasks, and notes
- ✅ Rich HTML email template with proper formatting

### View Reports Feature
- ✅ Added "View All Reports" button in User Dashboard
- ✅ Dialog displays all previously submitted reports
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
