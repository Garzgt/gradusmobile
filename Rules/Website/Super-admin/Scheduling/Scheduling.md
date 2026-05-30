# Scheduling In GRADUS (Super Admin)

This folder contains the scheduling documentation for the Super Admin module.

## 1. Purpose

The Scheduling module allows Super Admin to:
- prepare scheduling inputs
- run schedule generation
- review and resolve conflicts
- publish official schedules for enrollment use

## 2. Document Map

1. Rules.md
- Core constraints, hard rules, and policy rules.

2. Workflow.md
- End-to-end process from pre-checks to publication.

3. Conflict-Handling.md
- Conflict types and standard resolution process.

4. Publish-and-Regenerate.md
- Publication gate, rollback context, and regeneration modes.

5. Export-Style-Guide.md
- Required visual style for generated PDF and XLSX schedule outputs.

6. PDF-XLSX-Validation-Checklist.md
- Final QA checklist before releasing generated export files.

7. SchedRefference/README.md
- Reference asset list for sample PDF and image files.

8. SchedRefference/XLSX-Observed-Profile.md
- Extracted template metadata from sample XLSX exports.

## 3. Scope

This scheduling documentation is for:
- website-based Super Admin operations

It aligns with:
- institutional policies
- role boundaries
- data governance requirements

## 4. Quick Start

1. Complete input readiness checks.
2. Run generation with selected scope.
3. Resolve hard conflicts first.
4. Re-run when required.
5. Publish only when checks are green.
