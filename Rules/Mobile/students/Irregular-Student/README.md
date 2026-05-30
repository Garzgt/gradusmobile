# Advising Feature Workflow In GRADUS

This guide explains how the advising feature works in the GRADUS mobile app dashboard.

Reference documents:
- [../../gradus_info.txt](../../gradus_info.txt)
- [../Color-Scheme.md](../Color-Scheme.md)

## 1. Purpose

The advising feature helps students plan their subject enrollment for the current term.
It is available to all students in the dashboard but recommended for students who know they are irregular.

The system does not classify or label students. The student decides themselves if they need this feature.

## 2. When To Use

Use this feature if you:
- Have failed subjects from previous semesters that need to be retaken.
- Have blocked subjects due to unmet prerequisites.
- Need help planning a conflict-free schedule across different sections.
- Need to generate a printable advising form to submit to the program coordinator.

## 3. Critical Campus Rules

1. Semesters are limited to 1 and 2 only. Year levels are limited to 1 through 4.
2. The PSU evaluation page is the source of truth for subject eligibility.
3. INC does not block prerequisite progression.
4. No advance subjects are allowed — students cannot take subjects from future year levels.
5. Advising form is required for irregular enrollment. The app does not create enrollment records directly.
6. Students with back subjects are not eligible for academic honors regardless of GWA.

## 4. Entry Flow

1. Student signs in with PSU Google account.
2. If new — completes profile and goes to dashboard.
3. If existing — goes directly to dashboard.
4. Student taps the advising feature from the dashboard.

## 5. WebView Evaluation Scan

1. App opens the PSU portal evaluation page inside a WebView.
2. Student logs in to the portal and reviews their evaluation results.

Color semantics on the PSU evaluation page (student reads these manually):

| Color | Meaning | Eligibility effect |
| --- | --- | --- |
| Blue (passed/credited) | Passed/credited subject | Satisfies prerequisite |
| Yellow (INC) | Incomplete grade | Satisfies prerequisite |
| Black (failed/dropped) | Failed or dropped | Does not satisfy prerequisite |
| White/default | Not credited | Does not satisfy prerequisite |

3. System reads which subjects are failed, incomplete, or not yet taken.
4. System builds suggested subject list based on scan result.

## 6. Subject Suggestion Priority

- Priority A: back subjects from failed semesters (retakes) — listed first.
- Priority B: current year-level subjects — only if prerequisites are satisfied.
- No advance subjects from future year levels are allowed.

## 7. Student Subject Selection

1. Student reviews the suggested subject list.
2. Student selects which subjects they want to take this term.
3. Student is not forced to take all suggested subjects.

## 8. Schedule Conflict Check

1. System checks the currently published schedule for all selected subjects.
2. Since subjects may come from different year levels and sections, time conflicts are checked across all selections.
3. If conflicts exist — student must revise selections before proceeding.
4. If no conflicts — student proceeds to generate the advising form.

## 9. Advising Form Generation

1. Student confirms their conflict-free subject selections.
2. App generates a printable advising form containing:
   - Student name and number
   - Selected subjects with schedule and section
   - Term and program
3. Student downloads and prints the form.
4. Student submits the hard copy to the program coordinator.
5. Student also submits a Letter of Intent (LOI) via the Google Drive link provided by the institution.
6. Program coordinator forwards the advising form together with the LOI to main campus for official enrollment processing.

## 10. After Submission

1. Main campus processes the enrollment.
2. Teacher downloads the official classlist from the PSU portal.
3. Teacher imports the classlist via Excel into GRADUS Desktop (one file per subject per section).
4. Student sees enrolled subjects in GRADUS after the teacher import is complete.

## 11. During Semester: Grade Visibility

- Student sees posted grades only.
- Draft grades are always hidden.
- Realtime updates appear after teacher sync and posting.

## 12. Recognition Eligibility

Students who used this advising feature (back subjects enrolled) are NOT eligible for academic honors that term.

Honor eligibility requires:
1. No back subjects — all enrolled subjects must be from the current year level and semester only.
2. Full standard curriculum load.
3. All subjects passed — no FAILED, DROPPED, or INC.
4. GWA within threshold: President's List 1.00–1.25, Dean's List 1.26–1.75.

## 13. Edge Cases

1. Published schedule not available:
   - Show eligibility and allow planning, but block advising form generation.
2. Subject offering unavailable for required back subject:
   - Mark as unresolved requirement, carry over to next term planning.
3. Conflict detected:
   - Require correction before advising form generation.
4. Evaluation page not loading in WebView:
   - Prompt student to retry or check internet connection.

## 14. Summary

Advising feature flow:
- Open advising feature from dashboard → WebView scan → system suggests subjects → student picks → conflict check against published schedule → generate advising form → print and submit to program coordinator → submit LOI via Google Drive → coordinator forwards to main campus → teacher Excel classlist import → posted grade tracking.
