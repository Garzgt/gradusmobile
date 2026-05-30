# Super Admin Sidebar Navigation

This document defines the recommended sidebar navigation for the Super Admin role and explains each menu item.

## 1. Sidebar Structure (Recommended)

1. Dashboard
2. Academic Terms
3. Curriculum
4. Sections
5. Teachers
6. Rooms and Venues
7. Scheduling
8. Grade Oversight
9. Reports and Exports
10. Audit Logs
11. Account Management
12. System Settings
14. Profile
15. Logout

## 2. Navigation Tree With Explanations

### 2.1 Dashboard

Purpose:
- Provide a real-time system overview.

What Super Admin sees:
- active term status
- schedule publication status per program
- unresolved schedule conflicts
- grade posting completion by program

Primary actions:
- jump to urgent queues
- open conflict module
- check high-priority alerts

### 2.2 Academic Terms

Purpose:
- Open, close, and manage academic term lifecycle.

What Super Admin can do:
- add term
- edit term details
- activate selected term
- deactivate previous term automatically
- delete term (with safety checks)

Why this is critical:
- enrollment, scheduling, and grading workflows depend on active term.

### 2.3 Curriculum

Submenus:
- Programs
- Curriculum Versions
- Subjects

Purpose:
- Maintain academic structure used by scheduling, enrollment, and progression checks.

What Super Admin can do:
- review program set (BSIT, BSBA, BEED, BSHM)
- manage curriculum versions
- manage subjects, types, delivery patterns, prerequisites

Why this is critical:
- wrong curriculum data causes wrong eligibility and schedule generation.

### 2.4 Sections

Purpose:
- Manage class sections per term and program.

What Super Admin can do:
- create/edit/delete sections
- set year level and program alignment
- monitor section status and capacity
- ensure Year 1 Saturday blocking rules are respected

### 2.5 Teachers

Submenus:
- Teacher List
- Availability
- Subject Assignments

Purpose:
- Control teaching resources used by scheduling and class operations.

What Super Admin can do:
- manage teacher profiles and employment metadata
- define weekly availability
- assign subjects across programs (as allowed)
- enforce load and teaching-day constraints

### 2.6 Rooms and Venues

Purpose:
- Manage physical/off-campus venues and their constraints.

What Super Admin can do:
- create/edit/delete venues
- assign type and subtype
- enforce program restrictions
- track active/inactive venue usage

Why this is critical:
- venue validity is required for conflict-free scheduling.

### 2.7 Scheduling

Submenus:
- Setup
- Generate
- Manage
- Conflicts
- Publish
- Publication History

Purpose:
- Build and release official schedules.

What Super Admin can do:
- configure scope and regeneration mode
- run deterministic schedule generation
- resolve conflicts
- manually adjust entries
- publish official schedule set
- view publication history and rollback context

Policy note:
- only published schedules can be used for enrollment.

### 2.8 Grade Oversight

Submenus:
- Posting Compliance
- Grade Status Monitor
- Grade Sync Health

Purpose:
- Ensure teachers complete and post grades on time.

What Super Admin can do:
- monitor draft versus posted completion
- monitor offline sync completion signals
- follow up delayed grade submissions with teachers directly

### 2.10 Reports and Exports

Submenus:
- Schedule Reports (Section/Teacher/Venue)
- Enrollment Reports
- Progress and Standing Reports
- Recognition Summary Reports

Purpose:
- Generate decision-ready operational reports.

What Super Admin can do:
- export PDF/XLSX
- compare program performance
- review trend data for planning

### 2.11 Audit Logs

Purpose:
- Provide traceability for critical actions.

What Super Admin sees:
- role-based actions
- approval decisions
- override events
- publication actions
- data-change events

Why this is critical:
- required for governance, accountability, and dispute resolution.

### 2.12 Account Management

Submenus:
- Teacher Accounts
- Access Policies

Purpose:
- Manage who can access which modules.

What Super Admin can do:
- create/deactivate teacher accounts
- maintain role assignments
- enforce access policies

### 2.13 System Settings

Purpose:
- Configure platform-level operational rules.

Examples:
- notification defaults
- policy toggles
- maintenance flags
- integration keys and environment controls (secured)

### 2.14 Profile

Purpose:
- Manage Super Admin personal account settings.

Typical actions:
- update profile information
- update avatar
- change password

### 2.15 Logout

Purpose:
- end session securely.

Expected behavior:
- clear session/token
- redirect to login page

## 3. Sidebar Visibility Rules

1. Super Admin sees all sidebar groups.
2. Teachers and students do not see Super Admin modules.
3. Sensitive items (audit, account management, settings) are Super Admin-only.

## 4. Recommended Sidebar Order Rationale

Order is optimized by daily use pattern:
1. Dashboard first for alerts.
2. Academic and resource setup next.
3. Scheduling and enrollment operations in the middle.
4. Monitoring, reporting, and governance items after operations.
5. Account/session actions at the bottom.

## 5. Quick Use Flow For Super Admin

1. Open Dashboard.
2. Verify active term and queue health.
3. Resolve scheduling blockers.
4. Publish schedule when ready.
5. Track grade posting compliance.
7. Review audit logs and reports.
