# Schedule Export Style Guide (PDF And XLSX)

This document defines the required output style for generated schedules.

## 1. Goal

Generated schedule exports must match the same visual style used in the sample references inside the scheduling reference folder.

## 2. Reference Samples

Use these files as the source of truth:
1. SchedRefference/BSIT_SecondSem_ClassSchedule.pdf
2. SchedRefference/BSHM_SecondSem_ClassSchedule.pdf
3. SchedRefference/BSBA_SecondSem_ClassSchedule.pdf
4. SchedRefference/BSIT_SecondSem_ClassSchedule.xlsx
5. SchedRefference/BSHM_SecondSem_ClassSchedule.xlsx
6. SchedRefference/BSBA_SecondSem_ClassSchedule.xlsx
7. SchedRefference/Sample_schedTable.png
8. SchedRefference/Sample_courseTable.png

## 3. Template Baseline (Observed)

Observed from current XLSX references:
1. One workbook contains multiple section tabs.
2. Sheet naming format follows section naming (example: BSBA 2-A).
3. The schedule block uses 7 core columns (A:G):
- A: Time
- B to G: Monday to Saturday
4. Some templates include additional styled columns (I:L) and one spacer column (H).
5. Typical sheet row count is 79, while some templates (BSIT) extend to 100.

## 4. Typography

1. Primary font family: Arial Narrow.
2. Fallback/system font found in template styles: Calibri.
3. Font sizes vary by area and program template.
4. Common body sizes are 10 to 12.
5. Small labels/signature lines may use 8 to 9.
6. Institutional heading lines may use larger sizes up to 15 to 18 in some templates.

Implementation rule:
1. Match size and weight by cell role from the reference template, not one fixed size for all cells.

## 5. Grid And Content Layout

Header block pattern (top of sheet):
1. Institutional header lines in rows 1 to 5.
2. Schedule title in rows 7 to 8.
3. College/program metadata around rows 10 to 11.
4. Day header around rows 14 to 15.

Schedule grid rules:
1. Use 30-minute rows in chronological order.
2. Keep class placements as merged time blocks when class duration spans multiple rows.
3. Keep class text vertically stacked:
- subject code/title
- teacher/instructor
- room/venue

Observed core column widths (A:G):
1. A: 13.55 (approx)
2. B: 16.33 (approx)
3. C: 16.66 (approx)
4. D: 17.11 (approx)
5. E: 17.66 (approx)
6. F: 17.00 (approx)
7. G: 17.44 (approx)

Optional extended columns (seen in some sheets):
1. H acts as spacer.
2. I to L are styled at width about 8.66.

## 6. Course Table Layout

Reference placement pattern (example in BSBA tabs):
1. Starts around row 40.
2. Uses columns D to G.

Course table headers:
1. Course Code
2. Course Title
3. Lec/ (Lab) Units

Rules:
1. Keep subject color in the course-code column.
2. Keep units numeric in the units column.
3. Keep total units row at the bottom of the table block.

## 7. Color Rules (Observed Palette)

Keep color behavior from references:
1. Subject-to-color mapping should be consistent inside one sheet.
2. The same subject color should be reused in schedule block and course table.

Observed fill colors include:
1. #00B050
2. #00B0F0
3. #FF0000
4. #FFFF00
5. #FFC000
6. #A5A5A5
7. #7F7F7F
8. #BFBFBF
9. #B2A1C7
10. #D99594
11. #C6EFCE
12. #FFC7CE
13. #FFEB9C
14. #FFCC99
15. #FFFFCC
16. #F2F2F2
17. #92D050

Text contrast rule:
1. Use dark text on light fills.
2. Use light text only for dark fills where readability requires it.

## 8. Page Setup (From XLSX References)

Use these defaults unless a specific template overrides them:
1. Orientation: portrait.
2. Paper size code: 14 (keep same as reference templates).
3. Margins:
- left: 0.35
- right: 0.12
- top: 0.29
- bottom: 0.38
- header: 0.30
- footer: 0.30
4. Zoom is usually 70, with some tabs using 80.
5. No freeze panes are defined in current references.
6. No explicit print area is defined in current references.

## 9. PDF Output Rules

1. PDF must mirror the approved XLSX template layout per section.
2. Keep page orientation consistent with the reference template behavior.
3. Keep text selectable.
4. Preserve merged structure, borders, and fill colors.
5. Avoid clipping on right edge and bottom signatures.

## 10. XLSX Output Rules

1. Keep sheet-per-section structure.
2. Preserve merged cells and row heights from template pattern.
3. Preserve page setup values from Section 8.
4. Preserve style role mapping (header, grid, class block, course table, signatures).
5. Keep workbook valid with no repair warning on open.

## 11. Export File Naming

Recommended naming format:
1. Program_Term_ClassSchedule.pdf
2. Program_Term_ClassSchedule.xlsx

Examples:
1. BSIT_SecondSem_ClassSchedule.pdf
2. BSIT_SecondSem_ClassSchedule.xlsx

## 12. Consistency Rule Across Formats

PDF and XLSX must represent the same data with the same:
1. order of rows and columns
2. text content
3. color coding
4. merged block structure

Differences are allowed only for format-specific print behavior.
