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

### Company Registration
The company registration flow includes a comprehensive form that captures both required and optional company information:
- **Required Fields**: Company Name, Company Email (used for login and notifications), Password
- **Optional Fields**: Phone Number, Company Website, Location/Country, Company Description
- **Terms & Conditions**: Mandatory checkbox acceptance before registration
- **Automatic ID Generation**: System generates unique Company Server ID (format: CMP-XXXXX) upon successful registration
- **Email Notification**: Automated email sent to company admin with the generated Company Server ID and login instructions 

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