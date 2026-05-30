# RulesForBuildingGradus

This is the master guide for using the RulesForBuildingGradus project intelligently across Website, Desktop, App, and Database folders.

## 0. Critical 2026 Academic Policy Baseline

1. Semester values are only 1 and 2.
- Do not use or expose Summer (semester 3) in UI, validation, or database checks.

2. Year level values are only 1 through 4.
- Apply this consistently in student, section, curriculum, and standing workflows.

3. Database source-of-truth for executable schema and constraints:
- FinalDatabase/Gradus_Run_In_Sql_EditorDB.sql
- FinalDatabase/Schema_Hotfix_2026_04_25.sql
- FinalDatabase/Schema_Hotfix_2026_04_25B.sql

4. Historical snapshots can be stale.
- If any snapshot conflicts with policy, follow the source-of-truth files above.

## 1. What This Repository Contains

1. Public website and landing documentation
2. Admin and role workflow documentation
3. Teacher desktop architecture and workflow references
4. Student app architecture and workflow references
5. SQL schema and database dumps
6. Core technology and build execution strategy

## 2. Core Rules (Use This Project Intelligently)

1. Start from system rules first, then UI.
- Read Techstack and role docs before building features.

2. Build by dependency order, not by preference.
- Landing V1 can start first for visibility.
- Core backend and Super Admin governance must be built early.
- Teacher and Student flows depend on posted-state and approval logic.

3. Keep academic decisions deterministic.
- Scheduling, conflicts, eligibility, and recognition must stay rule-based.
- Do not replace policy logic with AI/ML decisions.

4. Respect role boundaries in every endpoint and screen.
- Super Admin: global governance and publication.
- Program Coordinator Admin: department-scoped approvals.
- Teacher: grading and class operations.
- Student: enrollment and posted-grade visibility only.

5. Protect visibility states strictly.
- Draft grades are internal only.
- Students and public views only read posted and approved records.

6. Treat auditability as required, not optional.
- Important transitions must be traceable (who, when, what changed).

7. Build responsive and accessible by default.
- Mobile, tablet, desktop support is required.
- Keyboard navigation, focus states, and readable contrast are required.

8. Keep process boundaries clear in desktop app.
- Electron main, preload, and renderer responsibilities must remain separated.

9. Keep documentation synchronized with implementation.
- If behavior changes, update the related markdown in the same work cycle.

10. Release only after phase exit criteria are met.
- Do not skip validation because UI appears complete.

## 3. Recommended Build Sequence

1. Landing Page V1 (public-facing, static or mock-backed)
2. Foundation contracts and auth guards
3. Super Admin web MVP
4. Program Coordinator Admin MVP
5. Teacher Desktop MVP
6. Student App MVP
7. Landing Page V2 (real integration, public achievers, release hardening)

## 4. Folder Guide (Where To Read First)

1. System stack and architecture
- Techstack/README.md
- Techstack/GRADUS-Build-Execution-Plan.md

2. Website and landing
- Website/LandingPage/README.md
- Website/LandingPage/Landing-Rules.md
- Website/LandingPage/Public-Achievers-Ranking.md
- Website/LandingPage/AchieverUI-Guide.md
- Website/admins/README.md

3. Desktop teacher app
- Desktop/FolderStructure/README.md
- Desktop/teacher/README.md

4. Student app
- Mobile/FolderStructure/README.md
- Mobile/students/README.md

5. Database
- FinalDatabase/GradusTableStructure.sql
- FinalDatabase/Gradus_Run_In_Sql_EditorDB.sql
- FinalDatabase/GradusFullDump.sql

## 5. Standard Feature Workflow

1. Select feature and target role.
2. Confirm policy and visibility rules.
3. Define API contract and validation.
4. Implement backend guardrails first.
5. Implement UI states (loading, empty, error, success).
6. Add audit logging for critical actions.
7. Verify responsive and accessibility behavior.
8. Update related markdown docs.

## 6. Public Achievers Specific Rules

1. Show Top 25 always for published ranking view.
2. Top 1, Top 2, Top 3 must have clear labels and distinct badge colors.
3. Publish only after posted grades, validation, and approval preconditions.
4. Never expose private student identifiers in public output.

## 7. Quality Gate Before Any Release

1. Role permission checks pass.
2. Posted-only visibility checks pass for student/public flows.
3. Critical actions are audit-logged.
4. Realtime and offline-sync behavior is verified.
5. Responsive checks pass on desktop, tablet, and mobile.
6. Linked markdown docs are updated and consistent.

## 8. Team Working Agreement

1. Use this file as the default onboarding entry point.
2. Treat markdown docs as source-of-truth for expected behavior.
3. If two docs conflict, resolve conflict immediately and update both.
4. Keep changes small, reviewable, and traceable.
