# Overview

WorkLogix is a multi-tenant task management system structured for Super Admins, Company Admins, and Company Members. It facilitates comprehensive task management, time tracking, and reporting within a hierarchical organizational framework. The system emphasizes role-based access control, data isolation per company, and member slot limitations, aiming to provide a robust solution for diverse organizational needs.

# User Preferences

I prefer a clear, modern UI with a clean aesthetic, drawing inspiration from tools like Linear and Notion. The design should prioritize responsiveness and include dark mode support. For development, I favor an iterative approach, focusing on core functionalities first and then expanding. I appreciate detailed explanations, especially for complex architectural decisions. Please ensure that all changes are well-documented and follow best practices for security and maintainability.

# System Architecture

## UI/UX Decisions

The design philosophy emphasizes a clean, modern interface inspired by Linear and Notion, utilizing a professional deep blue primary color and "Inter" for UI typography, with "JetBrains Mono" for data. It's a mobile-first, responsive design with dark mode support, built with Shadcn UI components for consistency. Navigation includes a multi-page system with a persistent left sidebar for dashboards.

The application now includes a comprehensive public landing page at the root route ("/") featuring:
- **Professional Navbar**: Responsive navigation with logo, menu links, Login dropdown, and Register CTA button
- **Hero Section**: Gradient background (indigo-to-cyan) with compelling headline, call-to-action buttons, and dashboard preview
- **Platform Stats**: Key metrics display (500+ companies, 10K+ users, 1M+ tasks)
- **Features Showcase**: Grid of 6 key features with icons (Multi-company Management, Real-time Tracking, etc.)
- **Access Hierarchy**: Visual representation of the three-tier role system (Super Admin → Company Admin → Company Members)
- **Quick Access**: Direct portal links for different user types
- **Contact Section**: Footer with company information and navigation links
- **Mobile Responsive**: Full mobile menu and responsive layouts with proper accessibility (data-testid attributes)

## Technical Implementations

The frontend is built with React and TypeScript, styled using Tailwind CSS. The backend runs on Express.js. State management uses React Query and Context API. Authentication is handled by Firebase Authentication with Google Sign-In, supporting Super Admin, Company Admin, and Company Member roles. Authorization is role-based and company-scoped across all data. Multi-tenancy is implemented with a three-tier hierarchy, `companyId` foreign keys for data isolation, and configurable `maxAdmins` and `maxMembers` slot limits. User management allows admins to create company-specific users. Task management includes priority, deadline, status, and a real-time timer. Reporting supports time-based submissions. Communication features private messaging and group announcements. A critical security limitation is the reliance on client-supplied `x-user-id` headers for authentication; proper server-side token verification is required for production.

## Feature Specifications

Key features include Super Admin management of companies (creation, editing, removal, slot purchase), user dashboards with time tracking, tasks, messages, and reports, and admin dashboards for user and task management, reporting, and communication. Data archiving and email notifications for report submissions are also supported.

### WorkLogix Attendance & Reward Management System

WorkLogix provides a fully automated attendance tracking and reward system for every registered company. Each company has its own attendance tracking, working hours policy, and reward automation with no manual operations required.

#### Core Work Timings (Configurable per Company)
- **Work Start**: 9:00 AM (default)
- **Work End**: 6:00 PM (default)
- **Attendance Window**: 9:00 AM – 10:00 AM
- **Late Entry**: After 9:15 AM (till 10:00 AM)
- **Absent**: No entry after 10:00 AM
- **Overtime**: Work after 6:00 PM (auto-calculated)

#### Employee (Company Member) Features
**Automatic Attendance Tracking:**
- Attendance is automatically marked when user logs in between 9:00–10:00 AM
- System calculates total working hours and late entry status
- Daily status view: "Present", "Late", or "Absent" per day
- Streak tracker for consecutive on-time attendance days
- Monthly attendance report with graphs and statistics

**Rewards & Recognition:**
- Badges automatically awarded for good attendance streaks or perfect months
- Point-based attendance score (daily + monthly)
- Email notifications for daily summaries and monthly achievements
- Badge examples: Early Bird (🌞), Perfect Month (🏆), Reliable Performer (💼), Work Warrior (🔥)

**Automatic Points System:**
- On-time login: +10 points
- Late login (before 10:00 AM): +5 points
- Absent: 0 points
- 5-day streak bonus: +10 points
- 30 days perfect month: +100 points + "Perfect Month" badge
- 90 days perfect: "Dedicated Star" badge

#### Company Admin Features
**Real-time Monitoring:**
- Live attendance overview showing who's online and who's absent
- Today's attendance summary with total employees, present, late, and absent counts
- On-time percentage tracking
- Individual employee attendance history and performance

**Analytics & Reports:**
- Monthly attendance patterns and trends
- Late arrival percentage tracking
- Top performers leaderboard
- Attendance graphs and visualizations
- Export capabilities (PDF/Excel)

**Automated Management:**
- All rewards assigned automatically by the system
- Automated email notifications for achievements
- Badge distribution tracking
- No manual intervention required

#### Backend Automation System
**Database Tables:**
- `attendanceLogs`: Daily attendance records (login/logout times, status, hours, points)
- `attendanceRewards`: User rewards tracking (total points, streaks, badges, monthly score)
- `badges`: Badge definitions and criteria
- `autoTasks`: Background job execution logs

**Automated Processes:**

*Daily (6:05 PM):*
- Process all company attendance records
- Mark absent users who didn't log in
- Update employee streaks
- Calculate and assign points
- Send daily summary emails

*Weekly (Sunday 11:00 PM):*
- Generate top performer lists
- Send weekly attendance summaries to admins and employees

*Monthly (1st of each month):*
- Assign achievement badges (Perfect Month, Dedicated Star, etc.)
- Allocate reward credits
- Send monthly achievement emails
- Update leaderboards
- Reset monthly scores

*Quarterly:*
- Archive old attendance logs for optimization
- Generate long-term performance reports

#### Data Isolation (Multi-Tenant)
- Each company has its own unique `company_id`
- Employees and attendance are completely isolated per company
- Admins can only view their own company's attendance data
- Global Super Admin has platform-wide visibility

#### Key Benefits
- ✅ 100% Automated - No manual tracking required
- ✅ Transparent Employee Recognition
- ✅ Real-time Attendance Insights
- ✅ Motivational Reward System
- ✅ Scalable for Multiple Companies
- ✅ Easy Future Integration with Payroll

#### Technical Implementation
- Attendance automatically created on user login via AuthContext
- Daily attendance lock prevents duplicate records for same day
- WebSocket events notify real-time attendance updates
- Cron jobs handle all automated processes
- User removal triggers instant logout across all devices

### Company Registration
The company registration flow includes both manual and Google OAuth registration options:

**Manual Registration:**
- **Required Fields**: Full Name, Email Address, Password (with strength validation), Confirm Password
- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **Terms & Conditions**: Mandatory checkbox acceptance before registration
- **Email Verification**: Sends verification email with unique token (24-hour validity)
- **Automatic ID Generation**: System generates unique Company Server ID (format: CMP-XXXXX)
- **Email Notification**: Sends verification link and Company Server ID to registered email

**Google OAuth Registration:**
- **One-Click Registration**: Register with Google button for instant signup
- **Auto-Verified**: Email is automatically verified by Google OAuth
- **Simplified Flow**: Only requires accepting Terms & Conditions
- **Profile Data**: Automatically captures name, email, and profile photo from Google
- **Immediate Access**: Company account is created and verified instantly

**Post-Registration:**
- Users receive their unique Company Server ID via email
- Email verification required for manual registration before login
- Company profile setup (details, location, business info) can be completed after first login

**Security Note:**
⚠️ **IMPORTANT**: The current Google OAuth implementation does NOT verify Firebase ID tokens server-side. For production deployment:
1. Install Firebase Admin SDK: `npm install firebase-admin`
2. Add service account key to secrets
3. Implement server-side token verification in `/api/auth/register-company-google` endpoint
4. Verify the `email_verified` claim from the decoded token
5. Only set `emailVerified: true` after successful token verification

Without this verification, the Google OAuth endpoint is vulnerable to privilege escalation attacks. 

The system includes a comprehensive payment system with advanced Stripe integration for slot purchases featuring:
- **Multiple Payment Methods**: Card payments, UPI (Google Pay, PhonePe, Paytm), and PaymentRequest API for express checkout
- **UPI QR Code Support**: Automatic QR code generation and display for scan & pay functionality
- **Secure Webhooks**: Automatic slot allocation via webhook with signature verification and idempotent processing
- **Smart Payment Polling**: Real-time payment status checks for UPI transactions with graceful timeout handling
- **Dual Verification**: Both frontend polling and webhook-based verification for reliability
- **Email Notifications**: Automated payment confirmations sent to both company admins and super admin
- **Payment History**: Detailed transaction records with receipt numbers and downloadable invoices

Additional features include a Super Admin dashboard for platform-wide analytics, company management, and activity logging.

## System Design Choices

The system utilizes a PostgreSQL database with tables for `companies`, `users`, `tasks`, `reports`, `messages`, `ratings`, `file_uploads`, `company_payments`, `adminActivityLogs`, and `archive_reports`. All multi-tenant tables include a `companyId` foreign key. A RESTful API provides endpoints for all functionalities, with company-based authorization.

The `companies` table includes both required fields (name, email, password, serverId) and optional profile fields (phone, website, location, description) to support comprehensive company information capture during registration.

# External Dependencies

-   **Authentication**: Firebase (Google Sign-In)
-   **Database**: PostgreSQL
-   **Email Service**: Resend
-   **Payment Gateway**: Stripe