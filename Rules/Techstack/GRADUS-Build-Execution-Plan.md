# GRADUS Build Execution Plan

Date baseline: 2026-04-19

This plan defines the recommended build sequence, MVP scope, weekly targets, and phase deliverables for the full GRADUS system.

## 1. Recommended Build Order

1. Foundation and backend contracts first
2. Super Admin web
3. Program Coordinator Admin web
4. Teacher Desktop app
5. Student app
6. Landing Page final integration and public achievers rollout

Why this order:
1. Governance and publication controls must exist first.
2. Teacher and student flows depend on role permissions and posted-state logic.
3. Public achievers depend on finalized posted grades and approval workflow.

## 2. Timeline Overview (18 Weeks)

1. Phase 0 (Weeks 1-2): Foundation and platform baseline
2. Phase 1 (Weeks 3-6): Super Admin web MVP
3. Phase 2 (Weeks 7-9): Program Coordinator Admin MVP
4. Phase 3 (Weeks 10-13): Teacher Desktop MVP
5. Phase 4 (Weeks 14-16): Student app MVP
6. Phase 5 (Weeks 17-18): Landing V2 integration, public achievers, release hardening

## 3. Phase 0 (Weeks 1-2) Foundation And Contracts

MVP scope:
1. Supabase schema baseline and migrations
2. Role and permission model
3. Google Sign-In and domain restriction
4. API route skeleton and error format standard
5. Audit log pattern and common utilities
6. Realtime channel strategy for posted versus draft records

Deliverables:
1. Stable migration set for terms, schedules, conflicts, enrollment, grades, notifications, and audit logs
2. Role-guard middleware for Super Admin, Program Coordinator Admin, Teacher, and Student
3. Shared API response contract and validation layer
4. Seed data scripts for development and staging
5. Environment setup guide and runbook

Exit criteria:
1. All roles can authenticate and are blocked correctly when unauthorized.
2. Core entities can be created and read through protected API endpoints.
3. Audit entries are written for protected actions.

## 4. Phase 1 (Weeks 3-6) Super Admin Web MVP

MVP scope:
1. Academic term management
2. Deterministic schedule generation controls
3. Conflict review for teacher, section, and venue
4. Schedule publish lifecycle
5. Governance dashboards and audit visibility

Deliverables:
1. Scheduling module UI with generation configuration and run logs
2. Conflict list with filter and resolution actions
3. Publish and unpublish controls with approval ownership
4. Audit timeline for scheduling and publication actions
5. Super Admin acceptance test checklist

Exit criteria:
1. Generated schedule can be reviewed and published end-to-end.
2. Conflicts are visible and actionable.
3. Publication state is enforced and recorded in audit logs.

## 5. Phase 2 (Weeks 7-9) Program Coordinator Admin MVP

MVP scope:
1. Department-scoped monitoring
2. LOI and enrollment approval steps
3. Irregular planning review
4. Policy checks tied to standing and eligibility

Deliverables:
1. Program Coordinator work queue UI
2. Approval and rejection workflow with required reasons
3. Eligibility and policy warning indicators
4. Department-level metrics panel
5. API tests for scope and permission enforcement

Exit criteria:
1. Program Coordinator can complete approval tasks within department scope only.
2. Policy warnings appear consistently for irregular flows.
3. All actions are auditable.

## 6. Phase 3 (Weeks 10-13) Teacher Desktop MVP

MVP scope:
1. Electron shell with main and preload boundaries
2. Class list and attendance workflow
3. Component-based grade encoding
4. Draft to posted grade state transitions
5. Offline queue and sync engine

Deliverables:
1. Desktop installer pipeline and release channel for test users
2. Teacher gradebook UI with validation and save indicators
3. Offline-first persistence and retry strategy
4. Sync status banner and conflict resolution prompts
5. Teacher UAT pack and known-limits list

Exit criteria:
1. Teacher can encode grades offline and sync online.
2. Posted-state transition is explicit and audited.
3. Error recovery is stable during network interruptions.

## 7. Phase 4 (Weeks 14-16) Student App MVP

MVP scope:
1. Enrollment and status views
2. Schedule view
3. Posted grades realtime visibility
4. Notifications and activity feed
5. Mobile responsiveness and accessibility checks

Deliverables:
1. Student app screens for schedule, grades, enrollment, and notifications
2. Posted-only visibility guardrails in client and API layers
3. Realtime update behavior for published grades
4. Empty, loading, and error-state coverage
5. Device matrix QA for small and large phone sizes

Exit criteria:
1. Students can only see posted grades.
2. Enrollment and schedule data are reliable across common mobile devices.
3. Notification and refresh behavior is predictable and performant.

## 8. Phase 5 (Weeks 17-18) Landing V2 And Release Hardening

MVP scope:
1. Connect landing Platform Access Hub to real app states
2. Integrate public achievers section using approved published data
3. Final responsive and accessibility pass
4. Release checklist execution

Deliverables:
1. Landing page connected to production-ready links and statuses
2. Public achievers section showing Top 25 with policy-safe fields
3. Final content and media pass
4. Launch runbook and rollback plan
5. Production readiness report

Exit criteria:
1. Public achievers data only appears after approval and publication preconditions.
2. All platform links and availability indicators are accurate.
3. Launch checklist is completed with sign-off.

## 9. Parallel Work Rules (To Keep Velocity)

1. Landing V1 visual build can run in parallel from Week 2 onward.
2. Do not block core backend contracts for front-end polish tasks.
3. Keep shared API contracts versioned and reviewed each phase.
4. Run QA regression at every phase handoff, not only at final release.

## 10. First 10 Working Days Plan

Day 1:
1. Finalize scope freeze for Phase 0 and Phase 1.
2. Confirm role matrix and permission boundaries.

Day 2:
1. Create database migrations and base seed data.
2. Set up auth and role guards.

Day 3:
1. Implement API response contract and validation layer.
2. Add audit log utility and integration points.

Day 4:
1. Build term management API and basic UI.
2. Build schedule generation job skeleton.

Day 5:
1. Add conflict model and list API.
2. Add initial conflict UI and filters.

Day 6:
1. Implement publish lifecycle endpoints.
2. Add publish state checks and audit events.

Day 7:
1. Add Super Admin scheduling dashboard.
2. Add generation logs and status indicators.

Day 8:
1. Begin Program Coordinator queue API stubs.
2. Write role-based endpoint tests.

Day 9:
1. Harden error handling and retry paths.
2. Validate permission failures and fallback UX.

Day 10:
1. Run Phase 0 plus early Phase 1 review.
2. Approve go or no-go for full Super Admin sprint.

## 11. Definition Of Done Per Phase

1. Functional: all in-scope user flows complete end-to-end.
2. Data: policy and visibility rules enforced at API level.
3. Security: role checks and domain restrictions verified.
4. Quality: regression tests and smoke tests passed.
5. Operations: monitoring hooks and rollout notes prepared.
