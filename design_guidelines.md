# WorkLogix Design Guidelines

## Design Approach

**System Selected:** Linear + Notion Hybrid with Material Design foundations
**Rationale:** Combines Linear's clean task-focused UI with Notion's information hierarchy for a productivity-first experience. Material Design provides robust component patterns for data-dense interfaces.

**Core Principles:**
- Clarity Over Decoration: Every element serves a functional purpose
- Information Hierarchy: Critical data (tasks, deadlines, status) immediately visible
- Role-Specific Experiences: Distinct visual treatments for Admin vs User dashboards
- Time Awareness: Visual cues that reinforce morning/evening workflows

---

## Color Palette

### Light Mode
- **Primary Brand:** 234 89% 45% (Deep blue - trust and professionalism)
- **Success/Complete:** 142 76% 36% (Forest green)
- **Warning/Pending:** 38 92% 50% (Amber)
- **Error/Urgent:** 0 84% 60% (Coral red)
- **Background:** 0 0% 100% (Pure white)
- **Surface:** 220 14% 96% (Cool gray)
- **Text Primary:** 222 47% 11% (Near black)
- **Text Secondary:** 215 16% 47% (Slate gray)
- **Border:** 214 32% 91% (Light slate)

### Dark Mode
- **Primary Brand:** 234 100% 65% (Lighter blue for contrast)
- **Success/Complete:** 142 70% 45%
- **Warning/Pending:** 38 92% 60%
- **Error/Urgent:** 0 84% 65%
- **Background:** 222 47% 11% (Deep charcoal)
- **Surface:** 217 33% 17% (Elevated charcoal)
- **Text Primary:** 210 40% 98% (Off white)
- **Text Secondary:** 215 20% 65% (Light slate)
- **Border:** 217 33% 24% (Subtle borders)

---

## Typography

**Font Stack:**
- **Headings:** Inter (600-700 weight) - clean, modern sans-serif
- **Body/UI:** Inter (400-500 weight) - optimal for data display
- **Monospace (data/timestamps):** JetBrains Mono (400 weight)

**Type Scale:**
- Hero/Dashboard Header: 32px (2xl), 700 weight
- Section Headers: 24px (xl), 600 weight
- Card Titles: 18px (lg), 600 weight
- Body Text: 15px (base), 400 weight
- UI Labels: 13px (sm), 500 weight
- Timestamps/Meta: 12px (xs), 400 weight, monospace

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 1, 2, 4, 6, 8, 12, 16, 24 consistently
- Component padding: p-4 to p-6
- Section spacing: space-y-8 to space-y-12
- Card margins: m-2 to m-4
- Dashboard grid gaps: gap-6

**Container Strategy:**
- Max-width: 1400px for dashboard views
- Two-column admin layout: Sidebar (280px) + Main content (flex-1)
- Single-column user mobile-first approach
- Form containers: max-w-2xl for readability

---

## Component Library

### Navigation
- **Admin Sidebar:** Fixed left, dark surface with primary accent highlights for active items, grouped sections (Dashboard, Tasks, Users, Reports, Archive)
- **User Top Bar:** Horizontal with user avatar (Google profile), role badge, time-based greeting, logout

### Dashboard Cards
- **Metric Cards:** White/surface background, rounded-lg borders, shadow-sm elevation
  - Large number (3xl, 700 weight) in primary color
  - Label below (sm, secondary text)
  - Icon top-right corner (24px, subtle color)
- **Task Cards:** Border-l-4 with status color (green/amber/red)
  - Task title (lg, 600 weight)
  - Priority badge (High=red, Medium=amber, Low=neutral)
  - Deadline with calendar icon
  - Status dropdown/toggle
  - Expandable description

### Forms
- **Time-Based Forms:** 
  - Morning: Sunrise gradient header (amber to orange, 15% opacity)
  - Evening: Twilight gradient header (indigo to purple, 15% opacity)
  - Large emoji + personalized greeting (2xl)
  - Textarea for tasks (min-h-32, border-2 focus state)
  - File upload drop zone with dashed borders
  - Primary CTA button (full-width on mobile)

### Tables
- **Reports Table:** Zebra striping (surface color alternate rows)
  - Sticky header row
  - Column sorting indicators
  - Row hover state (background opacity change)
  - Action buttons right-aligned (icon-only on mobile)
  - Filters toolbar above with date picker and user select

### Messaging
- **Message Cards:** Chat-style bubbles
  - Admin messages: Right-aligned, primary color background
  - User messages: Left-aligned, surface color
  - Unread indicator: Bold text + colored dot
  - Timestamp below in muted text

### File Uploads
- **Upload Zone:** Dashed border-2, rounded-lg, p-8
  - Upload icon centered (48px)
  - Drag instruction text
  - Browse button below
  - Preview thumbnails with remove option

### Rating Display
- **Rating Badge:** Pill-shaped with color coding
  - Excellent: Green background, white text
  - Good: Blue background, white text  
  - Needs Improvement: Amber background, dark text
- **Feedback Card:** Bordered card with admin avatar, timestamp, rating, and comment text

---

## Interactive States

**Buttons:**
- Primary: Brand color background, white text, shadow-sm, hover shadow-md + scale-105
- Secondary: Surface background, border-2, hover background opacity
- Danger: Error color, white text
- Icon-only: p-2, hover surface background, rounded-md

**Form Inputs:**
- Default: border-2 neutral, rounded-md, focus ring-2 primary
- Error: border-2 red, focus ring-2 red
- Dark mode: Consistent with surface colors, white text

**Task Status Transitions:**
- Pending → In Progress: Smooth color shift amber to blue
- In Progress → Completed: Color shift blue to green with checkmark animation
- Use color-coded chips with subtle transitions

---

## Animations

Use sparingly - only for meaningful feedback:
- **Task completion:** Checkmark scale + fade in (200ms)
- **Form submission:** Button loading spinner
- **Dropdown menus:** Slide down with 150ms ease-out
- **Toast notifications:** Slide in from top-right (250ms)
- No page transitions or scroll effects

---

## Dashboard Layouts

### Admin Dashboard
- **Top:** Metrics row (4 cards: Total Users, Today's Reports, Pending Tasks, Uploaded Files)
- **Middle:** Two-column grid (Recent Tasks + Recent Messages)
- **Bottom:** Reports table with filters
- Sidebar always visible on desktop, collapsible on mobile

### User Dashboard
- **Hero:** Personalized time-based greeting with illustration
- **Primary:** Current assigned tasks grid (2-3 columns desktop, 1 mobile)
- **Secondary:** Messages panel (collapsed by default)
- **Form Section:** Dynamic morning/evening form based on time
- **History:** Personal report history (paginated table)

---

## Images

### Admin Dashboard
- **Header Background:** Subtle abstract pattern (geometric shapes, low opacity overlay on surface color) - 1920x400px
- **Empty States:** Illustrated icons for "No tasks yet" (task clipboard), "No messages" (envelope), "No reports" (document stack) - 240x240px, centered in empty sections

### User Dashboard  
- **Hero Section:** Full-width illustration showing productivity/collaboration theme (team working, task completion) - 1920x600px, overlaid with greeting text
- **Morning Form:** Small sun/sunrise icon (64x64px) next to greeting
- **Evening Form:** Small moon/stars icon (64x64px) next to greeting
- **Success States:** Checkmark illustrations for completed tasks (120x120px)

### Google Login Page
- **Hero Image:** Professional workspace or team collaboration scene - 800x600px, left side of split layout
- **Brand Logo:** WorkLogix logo placeholder - 180x60px, centered above login form

All images should use modern flat illustration style with brand colors, maintaining consistency across the application. Use subtle drop shadows for depth, never harsh borders.