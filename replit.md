## Overview

WorkLogix is a multi-tenant task management system designed with a three-tier hierarchy: Super Admins, Company Admins, and Company Members. It enables Super Admins to manage multiple companies, each with its own admins and members. The system features role-based access control, company-scoped data isolation, member slot limits, and time-based reporting. The project aims to provide a comprehensive solution for task management within a structured organizational hierarchy.

## User Preferences

I prefer a clear, modern UI with a clean aesthetic, drawing inspiration from tools like Linear and Notion. The design should prioritize responsiveness and include dark mode support. For development, I favor an iterative approach, focusing on core functionalities first and then expanding. I appreciate detailed explanations, especially for complex architectural decisions. Please ensure that all changes are well-documented and follow best practices for security and maintainability.

## System Architecture

### UI/UX Decisions

-   **Design Philosophy**: Clean, modern interface inspired by Linear and Notion.
-   **Color Scheme**: Professional with a deep blue primary color.
-   **Typography**: "Inter" font for UI, "JetBrains Mono" for data/timestamps.
-   **Responsiveness**: Mobile-first approach with full responsiveness.
-   **Theming**: Dark mode support implemented throughout.
-   **Components**: Utilizes Shadcn UI for consistent and accessible components.
-   **Navigation**: Multi-page navigation system with a persistent left sidebar for user and admin dashboards.

### Technical Implementations

-   **Frontend**: React, TypeScript.
-   **Styling**: Tailwind CSS.
-   **Backend**: Express.js.
-   **State Management**: React Query and Context API.
-   **Authentication**: Firebase Authentication with Google Sign-In, supporting Super Admin, Company Admin, and Company Member roles.
-   **Authorization**: Role-based access control and company-scoped authorization applied to all data (tasks, reports, messages, ratings).
-   **Multi-Tenancy**: Three-tier hierarchy, `companyId` foreign keys for data isolation, and slot-based member limits (`maxAdmins`, `maxMembers`) for companies.
-   **User Management**: Admins can create company-specific users with controlled credentials and role assignments. Super Admins are created via public signup with specific email criteria.
-   **Task Management**: Tasks with priority, deadline, status, and a real-time timer system for daily time tracking.
-   **Reporting**: Time-based (morning/evening) report submissions and viewing, with comprehensive details.
-   **Communication**: Private messaging between admins and users, and group announcements from admins.
-   **Security (Current Limitation)**: Development relies on client-supplied `x-user-id` headers for authentication. **This is a critical security limitation and is not production-ready; proper server-side token verification (e.g., Firebase Admin SDK) or session management is required before deployment.**

### Feature Specifications

-   **Company Management**: Super Admins can manage companies, including creation, editing settings (name, slot limits), and removal.
-   **User Dashboards**: Features time-based forms, task tracking, private messages, group announcements, performance ratings display, and file uploads.
-   **Admin Dashboards**: Provide company information, user management (with slot enforcement), task creation/assignment, report management, communication center, and rating/feedback systems.
-   **Data Archiving**: Management of archived historical reports.
-   **Email Notifications**: Automated email notifications for report submissions.

### System Design Choices

-   **Database Schema**: PostgreSQL database with tables like `companies`, `users`, `tasks`, `task_time_logs`, `reports`, `messages`, `group_messages`, `ratings`, `file_uploads`, and `archive_reports`. All multi-tenant tables include a `companyId` foreign key.
-   **API Endpoints**: RESTful API endpoints for authentication, company management, user management, tasks, reports, messages, ratings, files, and dashboard statistics, all with company-based authorization.

## External Dependencies

-   **Authentication**: Firebase (Google Sign-In)
-   **Database**: PostgreSQL
-   **Email Service**: Resend

## Recent Updates

### October 17, 2025 - Critical Company Scoping Bug Fix
- ✅ **Fixed Multi-Tenant Data Isolation**: Resolved critical bug where admins couldn't see company users and users couldn't see admin data
- ✅ **Root Cause**: 7 frontend pages used custom `queryFn` implementations that bypassed authentication headers
  - Custom fetch calls didn't include `x-user-id` header from localStorage
  - Backend couldn't determine requesting user's company, returned empty results
- ✅ **Files Fixed** (all now include x-user-id header):
  - `client/src/pages/admin/AdminReports.tsx`
  - `client/src/pages/user/Overview.tsx`
  - `client/src/pages/user/Tasks.tsx`
  - `client/src/pages/user/Messages.tsx`
  - `client/src/pages/user/Announcements.tsx`
  - `client/src/pages/user/ReportView.tsx`
  - `client/src/pages/user/Ratings.tsx`
- ✅ **Fixed Mutation**: markAsReadMutation now includes auth header
- ✅ **Impact**: Fully restored company-scoped data access:
  - Admins can view users in their company
  - Users can view admins in their company
  - Reports visible cross-role within same company
  - Announcements properly received by users
  - Messages, tasks, and ratings properly scoped

### October 17, 2025 - Admin-Controlled User Creation & Login Flow
- ✅ **Enhanced User Creation**: Admin can now create users and immediately view their login credentials
  - Username (Display Name)
  - Email
  - Password (admin-set, shown only once)
  - Unique User ID (auto-generated)
- ✅ **Credentials Dialog**: After user creation, admin sees comprehensive credentials with copy-to-clipboard
- ✅ **Enhanced Login Security**: Company user login validates active status, company membership, and role

### October 17, 2025 - Dashboard Stats & Slot Purchase System Fixes
- ✅ **Fixed Dashboard Stats Company Filtering**: 
  - Updated `getDashboardStats()` to accept optional `companyId` parameter
  - Company admins now see only their company's users, reports, tasks, and files
  - Super admins continue to see global stats across all companies
  - Fixed backend route to pass requesting user's company ID for proper filtering
- ✅ **Slot Purchase System Implementation**:
  - **Schema Updates**: Added `slotType` and `slotQuantity` fields to `company_payments` table for detailed tracking
  - **Purchase Dialog**: Created comprehensive dialog with dynamic price calculation in CompanyManagement page
    - Slot type selection (admin/member)
    - Quantity input with real-time price calculation
    - Total amount display
  - **Backend API**: Implemented `/api/purchase-slots` endpoint with:
    - Slot pricing lookup and validation
    - Payment record creation with transaction ID
    - Real-time slot allocation via `incrementCompanySlots()` method
    - Automatic cache invalidation for immediate UI updates
  - **Super Admin View**: Enhanced payment history to display slot type and quantity for each purchase
- ✅ **Architect Review**: All changes passed review with no blocking issues or security concerns