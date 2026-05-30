# Teacher Workflow In GRADUS

This document explains, in full detail, how a teacher works in GRADUS from class assignment to final grade posting and student mobile visibility.

Reference documents:
- [gradus_info.txt](../gradus_info.txt)
- [RulesAndGuidelines.txt](../RulesAndGuidelines.txt)
- [Blank_GradeSheet.xlsx](../Blank_GradeSheet.xlsx)
- [Blank-GradeSheet-Implementation.md](./Blank-GradeSheet-Implementation.md)
- [Sidebar.md](./Sidebar.md)
- [Color-Scheme.md](./Color-Scheme.md)

## 1. Teacher Role Scope

Teacher responsibilities:
- View assigned teaching loads and class lists.
- Encode attendance and component scores.
- Review computed midterm, final term, and final grades.
- Post grades for student visibility.
- Submit grade outputs on term deadlines.

Teacher governance relationship:
- Super Admin manages global scheduling and system-wide teacher account governance.

Teacher cannot:
- Publish class schedules.
- Approve LOI/enrollment.
- Manually assign academic honors.

## 2. Prerequisites Before Teacher Grading Starts

Before a teacher can encode grades, these must already exist:
- Active academic term.
- Published schedule entries.
- Enrolled students in each class.
- Teacher-subject-section assignment.

If any of the above is missing, grading pages should be read-only or empty with a clear message.

## 3. Grade Lifecycle States

Grade status model:
- draft: teacher/super admin editable, hidden from students.
- posted: visible to students on web/mobile.

Visibility rules:
- Students see posted grades only.
- Students do not see draft values.
- If teacher works offline, student updates appear only after sync and posting.

## 4. End-To-End Teacher Flow

### Step 1: Open Assigned Class

Teacher selects:
- Term
- Subject
- Section

The system loads:
- Class roster
- Student numbers and names
- Existing draft/posted grade records

### Step 2: Set Grade Sheet Header And Configuration

From worksheet behavior, teacher configures metadata similar to SETTINGS sheet:
- Semester
- Academic year
- Subject description
- Subject code
- Class section

Then confirms percentage weights for the class type:
- Non-Lab weights
- Lab weights (if subject classification is lab)

### Step 3: Encode Attendance

Teacher records attendance values per meeting date.

Template logic equivalent (ATT sheet):
- Attendance total is computed automatically.
- Midterm attendance output feeds Midterm computation.
- Final attendance output feeds Final term computation.

### Step 4: Encode Midterm Components

Teacher enters raw scores for each student in Midterm section:
- Quizzes: Q1 to Q5
- Activities: A1 to A5
- Recitation
- Laboratory (for lab-class computation path)
- Major exam

The system computes per component:
- Raw score totals
- Percentage/transmuted values
- Weighted contribution by configured percentages

### Step 5: Compute Midterm Grade

From sheet formula behavior:
- If attendance <= 40, Midterm Grade becomes DRP.
- Else Midterm Grade = weighted sum of component contributions.

### Step 6: Encode Final Term Components

Teacher enters raw scores for Final term section:
- Quizzes Q1 to Q5
- Activities A1 to A5
- Recitation
- Laboratory (if applicable)
- Major exam
- Attendance is pulled from final attendance values

### Step 7: Compute Final Term Grade

From sheet formula behavior:
- If Midterm Grade is DRP, Final Term Grade is DRP.
- Else if final attendance <= 40, Final Term Grade becomes FA.
- Else Final Term Grade = weighted sum of final-term components.

### Step 8: Compute Final Grade And Equivalent

From AVERAGE sheet behavior:
- Midterm points = Midterm Grade * 0.5
- Final points = Final Term Grade * 0.5
- Final points may include incentive points
- Final points are rounded
- Transmuted equivalent is taken from Grade Equivalents lookup table
- Remarks generated from equivalent/status (PASSED, FAILED, DROPPED)

### Step 9: Save Draft

Teacher saves often as draft while encoding.

Draft behavior:
- Re-editable
- Internal review state
- Hidden from students

### Step 10: Post Grades

When complete and validated, teacher posts grades.

Posting behavior:
- Status changes to posted
- Student web/mobile can now see posted values
- Realtime update is sent after sync

### Step 11: Student Realtime View

Students can view posted grade components and computed term results:
- Attendance
- Quizzes
- Midterm exam
- Final exam
- Final grade/equivalent once posted

If teacher encoded offline:
- No student update until sync is completed.

### Step 12: End-Of-Term Submission

Teacher finalizes and submits class grade set for term closing workflows.

System should prevent accidental inconsistent states:
- Do not allow submit while records are still draft (unless policy allows partial posting).
- Show unresolved validation issues before final submission.

## 5. Grading Evaluation Model (System Mapping)

To align with actual teacher worksheet behavior, GRADUS should model these layers:

### 5.1 Grade Sheet Settings Layer
- course metadata
- class type/classification
- percentage weights

### 5.2 Attendance Layer
- per-student, per-meeting attendance entries
- term-segment attendance summaries

### 5.3 Component Score Layer
- quizzes, activities, recitation, laboratory, major exam
- raw totals and transmuted values

### 5.4 Term Grade Layer
- Midterm Grade computation
- Final Term Grade computation
- DRP/FA guard logic

### 5.5 Finalization Layer
- final points
- transmuted equivalent
- remarks and ranking (if enabled)

## 6. Suggested Data Contract For Teacher Grading

### 6.1 grade_components (component-level)
- student_id
- subject_id
- term_id
- attendance_score
- quiz_score
- midterm_exam_score
- final_exam_score
- component_total
- status (draft|posted)
- posted_at
- posted_by

### 6.2 grades (final-level)
- student_id
- subject_id
- term_id
- final_grade
- equivalent_grade

### 6.3 recommended supporting records
- grade_sheet_settings
- grade_attendance_entries
- grade_audit_logs

## 7. Validation Rules Teachers Depend On

Required checks before posting:
- Student exists in class roster.
- Scores are within allowed range.
- Required components are not missing.
- Weight totals are valid.
- Attendance values are valid.
- Status transitions are valid (draft -> posted).

Runtime safety rules:
- No raw database errors shown to teacher UI.
- All edits are audit logged.
- Student endpoints always filter status = posted.

## 8. Edge Cases

### 8.1 Student Dropped
- If DRP is set by rule/manual policy, final flow should propagate DRP where required.

### 8.2 Failing Due To Attendance
- Attendance threshold logic can produce FA even if component scores are high.

### 8.3 Missing Component Inputs
- Keep row in draft and show validation messages.

### 8.4 Offline Encoding
- Teacher can continue encoding.
- Conflicts and visibility updates are resolved only after sync.

## 9. Workbook Compatibility Note

The provided template includes broken references (#REF!) in parts of MID-FINAL branch logic (online/blended/modular path).

Action for production:
- Fix formula references before locking automation rules.
- Keep the business logic intent, but avoid importing broken formula artifacts directly.

## 10. Daily Teacher Checklist

1. Open assigned class for the active term.
2. Confirm roster and settings.
3. Encode attendance and component scores.
4. Review computed Midterm/Final term outputs.
5. Save draft.
6. Validate all rows.
7. Post grades when complete.
8. Confirm student visibility after sync.

## 11. Summary

Teacher workflow in GRADUS is a controlled pipeline:
- encode -> compute -> validate -> post -> student view.

This preserves academic integrity, supports offline-first teacher work, and ensures students only see official posted results.

## 12. Classlist Import File Format (eClassRecord)

Sample file reference: `Rules/Desktop/TeacherImport/35112_MS 323.xlsx`

Teachers receive subject-level Excel files from main campus after official classlisting. The expected format is:

- Sheet name: `eClassRecord`
- Column range: A to J

Row structure:
- Row 1 (system headers): `number`, `StudentNo`, `StudentName`, `Sex`, `Event5`, `FG`, `Total`, `PS`, `WS`, `rawgrades`
- Rows 2–3: Event metadata for the Event5 column (example values: `542997`, `2`)
- Row 4 (display headers): `#`, `StudentNo`, `Student Name`, `Sex`, `Midterm` (Midterm is the Event5 label)
- Row 5: blank
- Rows 6–8: Event detail rows under the Event5 column (example: `1`, `[Date]`, `100`)
- Rows 9+: Student roster data (columns A–D required; columns E–J initially blank for grades)

Teacher action:
- Fill grades in the Event5 column and summary columns (FG, Total, PS, WS, rawgrades) as grading progresses.
- Import the completed file into the Gradus Desktop app to sync with the grading workflow.
