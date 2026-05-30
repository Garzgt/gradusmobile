# GRADUS Scheduling Module AI Handoff

## 1. Context You Must Understand First

This capstone project is GRADUS (Grade Management, Class Scheduling, and Academic Progress Tracking) for Pampanga State University Sto. Tomas Campus.

Important framing:
- The current system in this repository is a practice implementation and focuses heavily on scheduling.
- Scheduling is one of the hardest parts of the capstone and should be treated as the foundation module.
- Your job is to reuse and extend the current scheduling work so it aligns with the concept paper scope.

## 2. Capstone Scope Relevant to Scheduling

From the concept paper, scheduling-related goals are:

1. Intelligent class scheduling with rule-based conflict detection.
2. Admin tools for:
   - time slot configuration
   - subject-section-teacher-room assignment
   - preview before publish
   - export (PDF and Excel)
3. Real-time schedule updates.
4. Irregular student schedule assistance based on needed subjects and available sections.

Constraints from concept paper:
- Sto. Tomas Campus only.
- Rule-based and algorithmic scheduling, not machine learning.
- Built for practical academic operations, not research prototypes that ignore usability.

## 3. What Already Exists in This Repository (Reuse This)

The current scheduling module already implements many core pieces:

1. Setup flow
   - scope selection
   - regeneration mode
   - strategy selection
   - optional exact class-day rules by program/year

2. Generation flow
   - rule-based engine
   - conflict checks
   - summary and diagnostics
   - stop/cancel support

3. Manage flow
   - schedule table
   - manual move and manual placement support
   - delete operations by scope

4. Conflicts flow
   - conflict logs
   - mark as resolved

5. Reports and export
   - section, teacher, venue reports
   - print/export to PDF and XLSX

6. Important domain behavior already present
   - Year 1 Saturday restriction for regular classes
   - NSTP skip in engine with reporting visibility support
   - teacher availability/load constraints
   - venue type/subtype and program restrictions

## 4. Scheduling Rules You Must Preserve

Do not break these existing behaviors while extending features:

1. 30-minute schedule grid from 07:00 to 17:30.
2. Rule-based conflict checks:
   - teacher overlap
   - room overlap
   - section overlap
   - venue mismatch
   - invalid venue-program assignment
   - Saturday restriction
3. Pattern-based scheduling logic (lecture-only, lecture-lab split/combined, PE, OJT/practicum/internship/field study, NSTP handling).
4. Scope and regeneration rules:
   - single/multiple/year/program/whole term
   - unscheduled only / replace scope / full regeneration

## 5. Gap Between Current System and Full GRADUS Vision

The repository is strong on admin scheduling, but GRADUS needs additional alignment:

1. Role model extension
   - current system is mainly single-admin-facing
   - required role model is:
     * Super Admin (global scheduling and system governance)
     * Department Admin / Program Coordinator (BSIT, BSBA, BEED, BSHM)
     * Teacher
     * Student

2. Publish workflow
   - concept paper expects preview then publish behavior
   - add explicit schedule publication status and release workflow

3. Irregular student assistance
   - needs student-facing schedule recommendation based on prerequisite completion and needed subjects

4. Integration readiness
   - scheduling data must be consumable by grade, progress, and recognition modules

## 6. Your Mission (What To Build Next)

Work in this order to reduce risk:

### Phase A: Stabilize and Document Scheduling Core

1. Verify all existing scheduling paths still pass lint/build.
2. Produce clear technical docs of current engine constraints and API contracts.
3. Keep all current admin scheduling features working.

### Phase B: Add Preview and Publish Lifecycle

1. Introduce schedule status model:
   - draft
   - reviewed
   - published
   - archived (optional)
2. Add publish actions and UI gates so student-facing pages only read published schedules.
3. Keep export available from published or review context (as required by admin flow).

### Phase C: Build Irregular Student Schedule Assistance

1. Create prerequisite eligibility endpoint using completed subjects.
2. Return list of eligible needed subjects for student (no advance-year/semester subjects).
3. Match eligible subjects to available published class schedules (section, teacher, room, time).
4. Provide recommendation output that helps enrollment planning.

### Phase D: Prepare Cross-Module Interfaces

1. Expose stable APIs for:
   - published schedules
   - eligible needed subject offerings per student (no advance subjects)
   - section and teacher load snapshots
2. Ensure data contracts are ready for grade and recognition workflows.

## 7. Suggested Data Additions (Minimal and Practical)

Create only what is needed for concept-paper alignment:

1. schedule publication entities
   - schedule_publications
   - schedule_publication_items (or equivalent)

2. student academic progress entities (if not yet present)
   - student_subject_completions
   - student_enrollment_plans (optional)

3. optional helper views
   - published_schedule_offerings_view
   - student_eligible_subjects_view

Keep naming consistent with existing schema conventions.

## 8. API Priorities for Next AI

Implement and document these first:

1. GET published schedules by term/program/year/section.
2. POST publish schedule set (super admin only).
3. GET student eligible needed subjects based on prerequisites and curriculum progression (no advance subjects).
4. GET student schedule assistance output:
   - subject
   - available sections
   - teacher
   - room
   - day/time

## 9. UI Priorities for Next AI

1. Super Admin:
   - preview changes
   - publish/unpublish actions
   - publication history

2. Department Admin / Program Coordinator:
   - program-scoped LOI review and approval
   - program-scoped irregular plan review and approval
   - visibility limited to own department/program

3. Student:
   - needed subjects panel
   - eligible subjects panel (needed only, no advance subjects)
   - available class schedule assistance panel

4. Keep visual consistency with existing project theme and component patterns.

## 10. Non-Negotiable Engineering Rules

1. Do not replace rule-based scheduling with ML.
2. Do not remove existing conflict checks.
3. Do not bypass teacher availability and load limits.
4. Do not expose unpublished schedules to student features.
5. Do not allow advance subject enrollment for irregular students.
6. Keep changes incremental and testable.

## 11. Done Criteria for This Scheduling Track

The scheduling track is considered capstone-ready when:

1. Super Admin can generate, review, and publish schedules reliably.
2. Conflict detection remains accurate after new features.
3. Student schedule assistance works for irregular cases using prerequisite logic.
4. Exports and reporting remain functional.
5. Department Admin / Program Coordinator approvals work in program scope (LOI and irregular plans).
6. Build and lint pass, and acceptance tests for scheduling scenarios are documented.

## 12. Copy-Paste Starter Prompt for Another AI

Use this prompt to continue work:

You are working on GRADUS scheduling. Treat current repository scheduling as the base implementation. Preserve existing scheduling engine rules and conflict detection. Implement publish lifecycle and student irregular schedule assistance based on prerequisites and published schedule offerings. Work in phases: A stabilize core, B publish workflow, C student assistance APIs/UI, D integration interfaces. Keep all existing admin scheduling flows and exports working. Do not use ML; keep rule-based logic. Provide migration SQL, API specs, UI changes, and validation checklist.
