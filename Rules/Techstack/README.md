# GRADUS Technology Stack

This document defines the technology stack used by GRADUS and the implementation constraints that must stay consistent across modules.

## 1. Core Platform Stack

- Framework: Next.js 16.2.1 (App Router)
- UI runtime: React (via Next.js)
- Mobile app framework: React Native (Expo)
- Mobile portal integration: React Native WebView
- Backend database: Supabase PostgreSQL
- Realtime layer: Supabase Realtime channels/subscriptions
- Authentication: Google Sign-In only
- Allowed email domain: @pampangastateu.edu.ph

## 2. Architecture Pattern

- System type: Web + Desktop + Mobile integration
- Business logic style: Rule-based deterministic engine
- Machine learning usage: Not allowed for scheduling or standing logic
- API style: Next.js API routes

## 3. Backend And Data Access Rules

- Server/API routes must use supabaseAdmin only.
- Client components must use supabase client only.
- Keep role-based permissions enforced in every API endpoint.
- Core academic decisions (eligibility, conflicts, standing, recognition) must remain policy/rule driven.

## 4. Database And Realtime Scope

Primary database:
- Supabase PostgreSQL as single source of truth

Realtime-required tables (where applicable):
- schedule_entries
- schedule_conflicts
- schedule_generation_logs
- academic_terms
- sections
- teachers
- venues
- grades
- grade_components
- notifications

Realtime visibility rules:
- Student grade views subscribe to posted records only (status = posted).
- Teacher/Admin grade views may subscribe to draft and posted states.

## 5. Frontend Styling And UX Standards

Styling approach:
- CSS Modules first
- Tailwind optional where already adopted

Color implementation rule:
- Use hardcoded hex values directly in components/CSS modules.
- Do not rely on CSS variables for primary palette values.

Primary red palette:
- #ef4444
- #dc2626
- #b91c1c
- #7f1d1d

UX behavior requirements:
- Responsive layouts across mobile, tablet, desktop
- Skeleton loading on primary data views
- Reusable animations defined in styles/animations.css

## 6. Scheduling Engine Stack

Scheduling characteristics:
- Deterministic, rule-based generation
- Conflict detection for teacher, section, and venue
- Publish lifecycle controls before enrollment usage

Current scheduling module location:
- lib/scheduling/*
- app/api/scheduling/*
- app/(admin)/scheduling/*

## 7. Grading Stack And Data Flow

Grading model:
- Component-based encoding (attendance, quizzes, exams, etc.)
- Status lifecycle: draft -> posted
- Students can view posted grades in realtime after sync

Offline behavior:
- Teacher encoding may continue offline
- Sync to Supabase when online
- Student view updates only after sync + posted status

## 8. Role And Access Layer

Implemented role model:
- Super Admin (global governance and scheduling publication)
- Program Coordinator Admin (department-scoped approvals and monitoring)
- Teacher (class operations and grading)
- Student (enrollment and posted-grade visibility)

## 9. Implementation Guardrails

- Keep scheduling and approval logic deterministic and auditable.
- Do not replace rule checks with AI/ML decisions.
- Preserve published-schedule gating for enrollment execution.
- Preserve no-advance-subject rule for irregular students.

## 10. Source References

- ../gradus_info.txt
- ../RulesAndGuidelines.txt
- ../schedenginenotes.txt
- ../GRADUS_Scheduling_AI_Handoff.md

## 11. Planning Companion

- [GRADUS-Build-Execution-Plan.md](./GRADUS-Build-Execution-Plan.md)
