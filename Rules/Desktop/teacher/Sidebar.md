# Teacher Sidebar Navigation

This document defines the recommended sidebar navigation for the Teacher role and explains each menu item.

## 1. Sidebar Structure (Recommended)

1. Dashboard
2. My Classes
3. Class Roster
4. Attendance
5. Gradebook
6. Grade Posting
7. Submission Center
8. Notifications
9. Reports and Exports
10. Profile
11. Logout

## 2. Navigation Tree With Explanations

### 2.1 Dashboard

Purpose:
- Give the teacher a quick operational overview for the active term.

What teacher sees:
- classes assigned today/this week
- pending attendance entries
- classes with draft grades
- classes already posted
- submission deadline reminders

Primary actions:
- open selected class quickly
- continue unfinished grade encoding
- resolve urgent posting tasks

### 2.2 My Classes

Submenus:
- Active Term Classes
- Archived Classes

Purpose:
- Show the teacher's official teaching loads.

What teacher can do:
- open class by term, subject, and section
- view schedule slot and room/venue info
- open class-specific grading workspace

Policy note:
- class assignment is system-driven from teacher-subject-section assignment records.

### 2.3 Class Roster

Submenus:
- Official Roster
- Enrollment Changes

Purpose:
- Display enrolled students for each assigned class.

What teacher can do:
- view student number and full name
- check enrollment updates reflected in class list
- confirm grading eligibility by roster membership

Restriction:
- teacher cannot manually enroll/remove students from official roster.

### 2.4 Attendance

Submenus:
- Attendance Encoder
- Midterm Attendance Summary
- Final Attendance Summary

Purpose:
- Encode and review attendance values that feed grading logic.

What teacher can do:
- encode per-meeting attendance
- review term-segment attendance totals
- validate attendance before posting grades

Policy note:
- attendance thresholds can trigger DRP/FA outcomes according to configured rules.

### 2.5 Gradebook

Submenus:
- Grading Settings
- Component Scores
- Midterm Computation
- Final Term Computation
- Final Grade View
- Formula Trace

Purpose:
- Encode and compute student performance from components to final outputs.

What teacher can do:
- open Grading Settings for class metadata and component weight setup
- configure percentage weights for:
	- attendance
	- quizzes
	- activities
	- recitation
	- laboratory (lab classes)
	- major exam
- manage lab and non-lab weight profiles per class offering
- verify profile totals before encoding component scores
- encode quizzes, activities, recitation, lab, and major exam scores
- review computed Midterm and Final term grades
- review final points, equivalent grade, and remarks
- save edits in draft state

Validation behavior:
- invalid or missing required inputs keep records in draft with clear warnings.
- weight configuration should enforce expected totals and block invalid profiles.

Workbook alignment note:
- Grading Settings maps to the workbook SETTINGS area where weights are maintained.
- Midterm and Final computations map to MID-FINAL and AVERAGE sheet behavior.

### 2.6 Grade Posting

Submenus:
- Draft Records
- Posted Records
- Reopen Requests (If Policy Allows)

Purpose:
- Control grade visibility state transition.

What teacher can do:
- post validated draft grades
- confirm posted timestamp and status
- monitor posting completion by class

Visibility rule:
- students see posted grades only; draft values stay hidden.

### 2.7 Submission Center

Submenus:
- End-of-Term Submission
- Submission History

Purpose:
- Finalize class grade sets for term closing workflows.

What teacher can do:
- submit complete grade sets after posting
- review prior submission logs and timestamps

Guardrails:
- submission should block if required records remain incomplete or invalid.

### 2.8 Notifications

Purpose:
- Surface grading and compliance alerts.

Typical alerts:
- deadline reminders
- roster changes
- posting confirmations
- correction flags from Super Admin (if applicable)

### 2.9 Reports and Exports

Submenus:
- Class Grade Sheet Export
- Attendance Report Export
- Submission Summary Export

Purpose:
- Generate downloadable records for teaching operations.

What teacher can do:
- export PDF/XLSX per class
- print summary views for review and records

### 2.10 Profile

Purpose:
- Manage personal account settings.

Typical actions:
- update profile info
- change avatar
- change password

### 2.11 Logout

Purpose:
- end session securely.

Expected behavior:
- clear session/token
- redirect to login page

## 3. Sidebar Visibility Rules

1. Teacher sees only own assigned classes and records.
2. Teacher cannot access global admin modules (term activation, scheduling publish, role management).
3. Teacher cannot publish schedules or manage student enrollment.
4. Student-visible data must come from posted grade status only.
5. Teacher can edit grade percentages only in Grading Settings, with policy-based lock controls.

## 4. Recommended Sidebar Order Rationale

Order is optimized for teacher daily flow:
1. Dashboard first for immediate priorities.
2. Class and roster modules next to establish context.
3. Attendance and Gradebook in the center for core encoding work.
4. Posting and Submission after validation.
5. Notifications, reports, and account actions at the end.

## 5. Quick Use Flow For Teacher

1. Open Dashboard and select class.
2. Open Gradebook > Grading Settings and verify class weighting profile.
3. Verify roster and update attendance.
4. Encode component scores in Gradebook.
5. Review computed Midterm, Final term, and final outputs.
6. Save draft, validate, then post grades.
7. Confirm student visibility and complete end-of-term submission.
