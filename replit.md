# WorkLogix - Employee Work Tracking & Task Management

## Overview
WorkLogix is a comprehensive employee work tracking and task management system built with React, Firebase authentication, and PostgreSQL. The system features Google Sign-In, role-based access control, time-based reporting, and complete data isolation between users.

## Current Status
- ✅ Firebase Google Authentication implemented
- ✅ Role-based routing (Admin vs User)
- ✅ User Dashboard with time-based forms
- ✅ Admin Dashboard with task management
- ✅ Complete UI/UX design with dark mode support
- 🚧 Backend API implementation pending
- 🚧 Database schema implementation pending

## Architecture

### Authentication
- **Provider**: Firebase Authentication with Google Sign-In
- **Flow**: 
  1. User signs in with Google
  2. Firebase returns user credentials
  3. Role is determined (currently mock - needs database implementation)
  4. User is redirected to appropriate dashboard (Admin or User)

### User Roles
- **Admin**: Access to admin dashboard with task creation, user management, reports viewing
- **User**: Access to user dashboard with assigned tasks, time-based forms, messages, and ratings

### Current Role Assignment (Temporary)
- If email contains "admin" → Admin role
- Otherwise → User role
- TODO: Implement proper role assignment from database

## Key Features

### User Dashboard
- Time-based forms (Morning 9:30-11:30 AM, Evening 6:30-11:30 PM)
- Assigned tasks with status tracking
- Message inbox (admin → user communication)
- Performance ratings and feedback
- File uploads for screenshots and PDFs

### Admin Dashboard
- Overview metrics (Total Users, Reports, Tasks, Files)
- Task creation and assignment
- User management
- Reports management with filtering
- Ratings and feedback system
- Archive management

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Authentication**: Firebase (Google Sign-In)
- **Backend**: Express.js (to be implemented)
- **Database**: PostgreSQL (to be implemented)
- **State Management**: React Query, Context API

## Environment Variables
Required Firebase secrets (already configured):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_PROJECT_ID`

## Routes
- `/` - Login page (Google Sign-In)
- `/user` - User dashboard (protected, user role only)
- `/admin` - Admin dashboard (protected, admin role only)

## Next Steps (Backend Implementation)
1. Design and implement database schema (users, tasks, messages, reports, ratings, archives)
2. Create API routes for CRUD operations
3. Implement proper role management in database
4. Connect frontend forms to backend APIs
5. Implement file upload to cloud storage
6. Add data archiving functionality
7. Implement proper user data isolation in database queries

## Design Guidelines
- Clean, modern interface with Linear + Notion hybrid design
- Professional color scheme with deep blue primary
- Inter font for UI, JetBrains Mono for data/timestamps
- Responsive design with mobile-first approach
- Dark mode support throughout

## Mock Data Notes
Current implementation uses mock data for demonstration:
- Task lists
- Messages
- User lists
- Reports
- Ratings

All mock data is marked with `// TODO: Remove mock data` comments and should be replaced with real API calls.
