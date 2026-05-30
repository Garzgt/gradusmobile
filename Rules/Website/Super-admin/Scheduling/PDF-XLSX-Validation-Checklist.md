# PDF And XLSX Validation Checklist

Use this checklist before releasing generated schedule exports.

## 1. Data Integrity

1. All scheduled classes appear in both PDF and XLSX.
2. Time slots match source schedule entries.
3. Instructor names and room labels are correct.
4. Course list and total units are correct.

## 2. Layout Validation

1. Day columns are Monday to Saturday in order.
2. Time column is complete and chronological.
3. Multi-slot classes are merged correctly.
4. No overlapping text in any class block.
5. Header blocks, metadata rows, and signature lines follow template positions.
6. Course table block appears in the expected row/column region.

## 3. Style Validation

1. Header fill and section fills match reference styles.
2. Grid border thickness is consistent.
3. Subject color coding is applied consistently.
4. Course table uses the same color mapping as schedule blocks.
5. Font family usage matches reference templates (Arial Narrow with Calibri fallback).
6. Font size usage matches role-based template sizing.

## 4. PDF-Specific Validation

1. Output opens as one printable schedule page.
2. Orientation matches the reference template behavior.
3. Text remains selectable (not image-only output).
4. No clipped rows or cut-off right edge.
5. Signature area remains fully visible.

## 5. XLSX-Specific Validation

1. Workbook opens without repair warnings.
2. Merged cells are valid and not broken.
3. Page setup matches template defaults:
- orientation portrait
- paper size code 14
- margins left/right/top/bottom = 0.35/0.12/0.29/0.38
4. Freeze pane behavior matches template (currently none).
5. Print area behavior matches template (currently none).
6. Colors and borders survive save and reopen.
7. Core A:G widths and optional extended columns follow template variant.

## 6. Final Sign-Off

1. Program coordinator checks content.
2. Super Admin checks policy and readability.
3. Approved file names follow naming rules.
4. Final files are archived with publication metadata.
