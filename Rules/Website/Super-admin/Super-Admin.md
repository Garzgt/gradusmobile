# Super Admin In GRADUS

This document defines the full responsibilities, permissions, and daily workflow of the Super Admin role.

## 1. Role Identity

Role name:
- Super Admin

Account count:
- 1 global account

Institution context:
- PSU Sto. Tomas campus-wide authority inside GRADUS

Operational identity:
- technical and operational system owner (school programmer/system manager)

## 2. Scope Of Authority

Super Admin scope is global across all programs:
- BSIT
- BSBA
- BEED
- BSHM

Super Admin can act on:
- scheduling generation/review/publication
- academic term activation/deactivation
- curriculum and master-data governance
- teacher account and access governance
- system-level analytics and integration controls

## 3. Core Responsibilities

1. Academic Term Governance
- open/activate academic term
- close/deactivate term
- ensure only one active term policy is enforced

2. Scheduling Governance
- run schedule generation
- review diagnostics and conflict outputs
- approve publication of final schedules
- enforce published-only gate for student-facing enrollment

3. Role And Access Governance
- create and maintain teacher accounts
- enforce role boundaries and access policy
- review audit logs for elevated operations

4. Data Governance
- maintain consistency of curriculum, section, teacher, room, and term references
- coordinate corrective actions for data conflicts

6. Compliance And Reporting
- review institution-wide analytics
- confirm policy alignment across departments

## 4. What Super Admin Approves Directly

Direct approval ownership:
- schedule publication (global)
- high-risk governance changes

## 5. Detailed Workflow

### Phase A: Pre-Term Setup

1. Activate academic term.
2. Validate curriculum versions and section readiness.
3. Confirm teacher assignments and venue readiness.
4. Confirm scheduling scope and strategy inputs.

### Phase B: Schedule Lifecycle

1. Generate draft schedules.
2. Review conflicts and unscheduled subjects.
3. Resolve/coordinate corrections.
4. Move to reviewed state.
5. Publish schedules.
6. Trigger student enrollment readiness notifications.

### Phase C: Term Execution

1. Monitor teacher grade posting compliance.
2. Monitor data integrity and issue trends.
3. Audit critical role actions and override logs.

### Phase D: Term Closing

1. Confirm posted final grades are complete.
2. Validate GWA and recognition automation readiness.
3. Review completion analytics by department.

## 6. Access Boundaries

Super Admin is allowed:
- read/write all departments
- manage all role assignments
- publish/unpublish schedules
- run global reports

Super Admin should avoid editing teacher grade records directly unless:
- escalation is approved
- emergency correction is needed
- data integrity issue requires direct intervention

## 7. Decision Rules For Overrides

Use override only when one or more are true:
1. policy conflict between departments
2. emergency deadline issue
3. incorrect rejection/approval caused by data error
4. institutional directive requiring exception handling

Do not use override for routine queue processing.

## 8. Super Admin Dashboard Must Show

1. Active term status
2. Scheduling publication status by program
3. Unresolved conflict count
4. Grade posting completion percentages by department
5. Override actions log

## 9. Security And Audit Requirements

All elevated actions must be logged:
- actor_role
- actor_id
- action_type
- target_entity
- target_id
- previous_state
- new_state
- reason
- timestamp

Sensitive actions requiring mandatory reason:
- schedule publish/unpublish
- LOI override
- irregular plan override
- role permission edits

## 10. Common Edge Cases

1. No active term
- enrollment and schedule publication remain blocked until term activation

2. Schedule published with unresolved conflict
- roll back publication or issue hotfix publication cycle

3. Last-minute policy correction
- apply system-wide rule patch and document in governance notes

## 11. Super Admin Daily Checklist

1. Confirm active term and schedule state.
2. Check conflict and unscheduled diagnostics.
3. Check grade posting compliance by department.
4. Check exceptions/escalations.
5. Review override log entries.
6. Confirm no cross-program permission leakage.

## 12. Super Admin Success Metrics

1. Schedule publication completed on time
2. Conflict rate trending down per cycle
3. High grade posting compliance before term close
4. Minimal override frequency
5. Clean audit log with no unexplained elevated actions
