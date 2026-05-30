# Blank GradeSheet Formula And System Implementation Guide (Revalidated)

This document is a revalidated implementation guide based on a second direct review of Blank_GradeSheet.xlsx XML formulas.

Reference file:
- [Blank_GradeSheet.xlsx](../Blank_GradeSheet.xlsx)

## 1. Verification Summary

Workbook sheet mapping:
1. SETTINGS -> sheet1.xml
2. ATT -> sheet2.xml
3. MID-FINAL -> sheet3.xml
4. AVERAGE -> sheet4.xml
5. GRADE EQUIVALENTS -> sheet5.xml
6. MIDTERM SOG -> sheet6.xml

Core verification result:
- The grading pipeline is consistent overall: settings -> attendance/components -> term outputs -> final grade/equivalent -> reporting.
- Several template-level issues exist and should be corrected in system logic instead of copied directly.

## 2. SETTINGS Sheet Implementation

## 2.1 Header And Class Metadata

Observed fields:
- Semester (example source: F10)
- Academic Year (example source: F11)
- Subject Description (F13)
- Subject Code (F14)
- Class Section (F16)

These feed header areas in AVERAGE and other sheets.

## 2.2 Weight Inputs (Directly Editable)

Laboratory profile:
- F21 = Attendance
- F22 = Quizzes
- F23 = Activities
- F24 = Recitation
- F25 = Laboratory
- F26 = Major Exam
- G26 = SUM(F21:F26)

Non-laboratory profile:
- F28 = Attendance
- F29 = Quizzes
- F30 = Activities
- F31 = Recitation
- F32 = Major Exam
- G32 = SUM(F28:F32)

Important behavior:
- MID-FINAL formulas use IF(Dx="lab", lab_weight, non_lab_weight).
- In sample rows, classification value is Non-Lab, so non-lab weights are used unless class type changes to lab.

System rule recommendation:
1. Teacher edits weights only in Grading Settings UI.
2. Enforce total = 100 for active profile.
3. Lock profile after first score entry, with coordinator override workflow if changes are needed.

## 3. ATT Sheet Implementation

## 3.1 Attendance Layout

Observed structure:
- Midterm attendance entries are encoded across D:R.
- Final-term attendance entries are encoded across U:AI.
- S column stores computed midterm remainder.
- AJ column stores computed final-term remainder.

## 3.2 Core ATT Formulas

Representative formulas:
- S7 = 100 - SUM(D7:R7)
- AJ7 = S7 - SUM(U7:AI7)

Shared formula ranges observed:
- S7:S65 and S66:S81 follow the same remainder logic.
- AJ7:AJ65 and AJ66:AJ81 follow final remainder logic.

## 3.3 Feed Into MID-FINAL

MID-FINAL links:
- U row (midterm attendance source) typically references ATT!S row.
- AY row (final attendance source) references ATT!AJ row.

Examples:
- U7 = ATT!S6
- AY7 = ATT!AJ6
- U66 = ATT!S65
- AY66 = ATT!AJ65

## 4. MID-FINAL Sheet Implementation

## 4.1 Midterm Computation Columns

Representative formulas (row 7 anchor logic):
- J = SUM(E:I)
- K = J/$J$6*50+50
- L = K*(0.01*IF(D="lab",SETTINGS!$F$22,SETTINGS!$F$29))

- R = SUM(M:Q)
- S = R/$R$6*50+50
- T = S*(0.01*IF(D="lab",SETTINGS!$F$23,SETTINGS!$F$30))

- U = ATT!Sx (except boundary issue noted below)
- V = U*(0.01*IF(D="lab",SETTINGS!$F$21,SETTINGS!$F$28))

- W = recitation raw (sample default 100)
- X = W*(0.01*IF(D="lab",SETTINGS!$F$24,SETTINGS!$F$31))

- AA raw -> AB transmuted -> AC weighted laboratory:
  - AB = AA/$AA$6*50+50
  - AC = AB*(0.01*IF(D="lab",SETTINGS!$F$25,"0"))

- AD raw -> AE transmuted -> AF weighted major exam:
  - AE = AD/$AD$6*50+50
  - AF = AE*(0.01*IF(D="lab",SETTINGS!$F$26,SETTINGS!$F$32))

Midterm grade formula:
- AG = IF(U<=40,"DRP",AF+AC+X+V+T+L)

## 4.2 Final-Term Computation Columns

Representative formulas:
- AN = SUM(AI:AM)
- AO = AN/$AN$6*50+50
- AP = AO*(0.01*IF(D="lab",SETTINGS!$F$22,SETTINGS!$F$29))

- AV = SUM(AQ:AU)
- AW = AV/$AV$6*50+50
- AX = AW*(0.01*IF(D="lab",SETTINGS!$F$23,SETTINGS!$F$30))

- AY = ATT!AJx
- AZ = AY*(0.01*IF(D="lab",SETTINGS!$F$21,SETTINGS!$F$28))

- BA = recitation raw (sample default 100)
- BB = BA*(0.01*IF(D="lab",SETTINGS!$F$24,SETTINGS!$F$31))

- BC raw -> BD transmuted -> BE weighted laboratory:
  - BD = BC/$BC$6*50+50
  - BE = BD*(0.01*IF(D="lab",SETTINGS!$F$25,"0"))

- BF raw -> BG transmuted -> BH weighted major exam:
  - BG = BF/$BF$6*50+50
  - BH = BG*(0.01*IF(D="lab",SETTINGS!$F$26,SETTINGS!$F$32))

Final-term grade formula:
- BI = IF(AG="DRP","DRP",IF(AY<=40,"FA",BH+BE+BB+AZ+AX+AP))

## 4.3 Shared Formula Blocks (Observed)

Midterm grade blocks:
- AG7:AG38
- AG39:AG70
- AG71:AG82

Final-term grade blocks:
- BI8:BI71
- BI72:BI82

## 5. AVERAGE Sheet Implementation

## 5.1 Row-Link Pattern

Row 14 block example:
- C14 = SETTINGS!B10
- D14 = SETTINGS!C10
- F14 pulls MID-FINAL AG7 with DRP pass-through
- K14 pulls MID-FINAL BI7 with DRP/FA pass-through

Row 74 block example:
- C74 = SETTINGS!B70
- D74 = SETTINGS!C70
- F74 pulls MID-FINAL AG67
- K74 pulls MID-FINAL BI67

Row 85 block example:
- C85 = SETTINGS!B81
- D85 = SETTINGS!C81
- F85 pulls MID-FINAL AG78
- K85 pulls MID-FINAL BI78

## 5.2 Core AVERAGE Formulas

Half-term points:
- G = IF(F="DRP","DRP",IF(F="FA","FA",F*0.5))
- L = IF(K="DRP","DRP",IF(K="FA","FA",K*0.5))

Final points:
- P = IF(F="DRP","DRP",IF(K="DRP","DRP",IF(F="FA","FA",IF(K="FA","FA",ROUND(L+G+V,0)))))

Equivalent lookup:
- Q = IF(P="DRP","DRP",VLOOKUP(P,'GRADE EQUIVALENTS'!$C$8:$D$109,2,TRUE))

Remarks:
- S = IF(Q=5,"FAILED",IF(Q="DRP","DROPPED","PASSED"))

Ranking:
- T = RANK(P,$P$14:$P$89)

## 6. GRADE EQUIVALENTS Sheet Implementation

Lookup range used by formulas:
- C8:D109

Observed mapping highlights:
- Points 1 to 73 -> equivalent 5
- 74 to 75 -> equivalent 3
- 76 upward progressively improves to 1 at 100

Notable data condition:
- Rows 108 and 109 repeat points 66 and 67 with equivalent 5 while still included in lookup range.

System implementation recommendation:
- Maintain a clean monotonic lookup table without duplicate trailing entries.

## 7. MIDTERM SOG Sheet Implementation

MIDTERM SOG derives summary and remarks from ATT and AVERAGE.

Representative formulas:
- C14 = SETTINGS!C11
- D14 = COUNTBLANK(ATT!D7:R7)-COUNTBLANK(ATT!$D$2:$R$2)
- E14 = COUNTIFS(ATT!D7:R7,"="&10)
- F14 = COUNTIFS(ATT!D7:R7,"="&5)
- H14 = IF(AVERAGE!F15="DRP","DRP",VLOOKUP(AVERAGE!F15,'GRADE EQUIVALENTS'!$C$8:$D$109,2,TRUE))
- I14 = IF(H14=5,"FAILED",IF(H14="FA","FAILED",IF(H14="DRP","DROPPED","PASSED")))

Second summary block formulas (Q/R) include FA handling in remarks as well.

## 8. Revalidated Workbook Issues (Important)

1. Broken Z-column branch formula in MID-FINAL
- Z formulas contain #REF tokens tied to ONLINE/BLENDED/MODULAR branch checks.
- Error value appears directly in cells (example Z7 = #REF!).

2. Midterm attendance link discontinuity in U column
- U7:U66 uses ATT!S links.
- U67:U82 becomes hardcoded 100 instead of ATT links.
- This can incorrectly bypass attendance impact for affected rows.

3. Grade equivalent lookup range includes duplicate tail rows
- C8:D109 includes repeated point rows at 108 and 109.

4. AVERAGE equivalent/remarks error behavior for FA and low points
- Q only special-cases DRP before VLOOKUP.
- For FA or point values not found (example 0), Q becomes #N/A.
- S then propagates error instead of clean FAILED mapping.

## 9. System-Side Implementation Decisions

To preserve business intent and remove workbook defects:

1. Keep deterministic rule flow exactly:
- attendance and weighted components -> midterm/final statuses -> final points -> equivalent -> remarks.

2. Implement formulas in service layer, not by importing broken sheet cells directly.

3. Replace broken mode branch logic with explicit fields:
- delivery_mode in database
- explicit mode-weight map
- no #REF-based branching

4. Force attendance linking for all rows:
- no hardcoded 100 fallback in U-column logic
- always derive from ATT summaries

5. Normalize equivalent lookup behavior:
- explicit handling for DRP and FA before lookup
- explicit handling for out-of-range/zero values
- deterministic remarks output with no #N/A leakage

## 10. Data Contract (Detailed)

## 10.1 grade_sheet_settings
- class_offering_id
- semester
- academic_year
- subject_code
- subject_description
- class_section
- class_type
- weight_attendance
- weight_quizzes
- weight_activities
- weight_recitation
- weight_laboratory
- weight_major_exam
- total_weight

## 10.2 grade_attendance_entries
- class_offering_id
- student_id
- meeting_date
- period (midterm or final)
- attendance_value

## 10.3 grade_components
- class_offering_id
- student_id
- period (midterm or final)
- quizzes_raw
- quizzes_transmuted
- quizzes_weighted
- activities_raw
- activities_transmuted
- activities_weighted
- attendance_raw
- attendance_weighted
- recitation_raw
- recitation_weighted
- laboratory_raw
- laboratory_transmuted
- laboratory_weighted
- major_exam_raw
- major_exam_transmuted
- major_exam_weighted
- term_grade
- status (draft or posted)

## 10.4 grades
- class_offering_id
- student_id
- midterm_grade
- final_term_grade
- midterm_points
- final_term_points
- incentive_points
- final_points
- equivalent_grade
- remarks
- status (draft or posted)
- posted_at
- posted_by

## 10.5 grade_audit_logs
- actor_id
- actor_role
- action_type
- before_value
- after_value
- timestamp

## 11. Validation Rules Before Posting

Required checks:
1. Student exists in official class roster.
2. Class type and weight profile are valid.
3. Active profile totals 100.
4. Component raw scores are in valid ranges.
5. Attendance summaries are valid and linked.
6. DRP and FA transitions follow policy formulas.
7. Equivalent and remarks produce non-error final values.
8. Status transition is draft -> posted only.

## 12. Sidebar Placement Alignment

Teacher percentage editing location should be:
- Gradebook -> Grading Settings

This aligns with workbook behavior where SETTINGS drives MID-FINAL and AVERAGE formulas.

## 13. Final Summary

Revalidation confirms GRADUS can fully replicate Blank_GradeSheet.xlsx behavior if implementation follows formula intent and explicitly corrects workbook defects.

Recommended final system flow:
1. Configure settings and weights.
2. Encode attendance and components.
3. Compute Midterm and Final term with DRP/FA rules.
4. Compute final points and equivalent.
5. Generate remarks and reports.
6. Post validated grades for student visibility.
