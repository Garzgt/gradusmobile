# Classlist Import and Grade Export Implementation

This document defines the exact file format, parsing rules, manual-add behavior, and export specification
for the teacher classlist workflow in the GRADUS Electron desktop application.

## 1. Source File Overview

File origin: PSU portal class list download.

File naming pattern: `{portalClassID}_{SubjectCode}.xlsx`

Example: `35112_MS 323.xlsx`
- `35112` = portal class/section identifier
- `MS 323` = subject code as registered in PSU portal

Sheet count: 1

Sheet name: `eClassRecord`

## 2. eClassRecord Sheet Structure

### 2.1 Row Layout

| Row(s) | Visibility | Purpose |
|--------|-----------|---------|
| 1 | Hidden | Portal machine-readable column key row |
| 2 | Hidden | Portal machine-readable metadata row (contains portal event ID in E2) |
| 3 | Hidden | Portal machine-readable count row |
| 4–8 | Visible, merged | Display header block |
| 9–N | Visible | Student data rows (one row per student) |

### 2.2 Column Map (Visible Columns Only)

| Col | Header Label | Data Type | Notes |
|-----|-------------|-----------|-------|
| A | # | Integer | Sequential row number, 1-based. Ignore on import. |
| B | StudentNo | Numeric string | Student number (e.g., 2023309289). Password-protected in source. |
| C | Student Name | String | Format: LAST, First Middle. (e.g., "NOCHE, Gary D.") |
| D | Sex | String | "F" or "M" only. |
| E | Midterm | Numeric or empty | Score column. EMPTY on classlist import. Filled on export. |

### 2.3 Hidden Column Map (Full Portal Schema, Columns A–J)

| Col | Hidden Row 1 Key | Meaning |
|-----|-----------------|---------|
| A | number | Row sequence |
| B | StudentNo | Student number |
| C | StudentName | Student name |
| D | Sex | Sex |
| E | Event5 | Exam/event score (Midterm in this sample) |
| F | FG | Final Grade equivalent |
| G | Total | Total computed score |
| H | PS | Passing status |
| I | WS | Weighted score |
| J | rawgrades | Raw grade value before transmutation |

Note: The portal uses EventN naming (Event1, Event2, …, Event5, etc.) for each graded component.
This sample file has only Event5 (Midterm) visible. The full grade export will populate F–J.

### 2.4 Header Sub-rows (Rows 4–8, Column E Specifically)

| Row | Value in Col E | Meaning |
|-----|---------------|---------|
| 4 | "Midterm" | Column section label |
| 5 | (merged) | |
| 6 | 1 | Number of events in this column group |
| 7 | "[Date]" | Exam date placeholder (editable in portal) |
| 8 | 100 | Maximum score for this event |

## 3. Import Flow (Classlist → GRADUS)

### 3.1 Trigger

Teacher selects "Import Classlist" in the class workspace of the Electron app.
Teacher picks the xlsx file downloaded from PSU portal.

### 3.2 Parsing Rules

1. Open file, locate sheet `eClassRecord`. Abort if sheet not found.
2. Skip rows 1–8 entirely (hidden metadata + display header block).
3. Data rows begin at row 9. Continue reading until column B is empty.
4. For each data row:
   - Extract col B → `student_number` (trim, convert to string)
   - Extract col C → `student_name` (trim, preserve original casing from portal)
   - Extract col D → `sex` (trim, accept "F" or "M" only; reject row if neither)
   - Col E → IGNORE on import (empty in classlist files)
5. Validate `student_number` is not blank. Skip blank rows silently.
6. Detect duplicate student numbers in the file → flag as warning, skip duplicates.

### 3.3 Filename Metadata Extraction

From filename `{portalClassID}_{SubjectCode}.xlsx`:
- Parse on first underscore: left part = portal class ID, right part = subject code.
- Subject code is for display and matching reference only.
- GRADUS does not rely on filename metadata for DB assignment — the teacher must confirm which class offering this import belongs to before the import runs.

### 3.4 Class Confirmation Step (UI Requirement)

Before executing the import:
- Show teacher: "Importing roster for [SubjectCode] — confirm this applies to [ClassName / Section / Term]"
- Teacher confirms → import proceeds.
- Teacher cancels → no records written.

### 3.5 Import Outcome

For each valid student row:
- Check if student already exists in `students` table by `student_number`.
  - If exists: link to class roster, do not duplicate student record.
  - If not exists: create provisional student record with name and sex from import.
    Flag as `import_source = 'classlist_import'` for later reconciliation.
- Insert into class roster linking table (e.g., `class_students`):
  - `class_offering_id`
  - `student_id`
  - `source` = `'classlist_import'`
  - `import_batch_id` (UUID per import session, for rollback reference)
  - `added_at`

### 3.6 Import Duplicate Guard

If teacher imports the same classlist again (same class + same student numbers):
- Update name/sex if changed.
- Do not create duplicate roster entries.
- Show summary: X new, Y updated, Z skipped.

## 4. Manual Student Add

### 4.1 When to Use

A student may be missing from the PSU portal classlist because:
- Late enrollment processed after the teacher downloaded the list.
- Portal data lag.
- Special enrollment cases.

### 4.2 Manual Add Fields (Required)

| Field | Type | Validation |
|-------|------|-----------|
| Student Number | String | Must not be blank. Must not already exist in this class roster. |
| Full Name | String | Must not be blank. Format: LAST, First M. (suggested, not enforced by system) |
| Sex | Dropdown | F or M only. |

### 4.3 Manual Add DB Behavior

- Same insert logic as import but `source = 'manual_add'`.
- Flagged separately so reports can distinguish portal-sourced vs manually added students.
- Manually added students can be removed by teacher before midterm grades are posted.
- After midterm grades are posted, manual removal requires a note/reason (audit logged).

## 5. Export Flow (Grades → PSU Portal Format)

### 5.1 When Export is Available

Export is available after:
- Midterm grades are computed (Midterm export).
- Final grades are computed (Final/Full export).

Two export types:
- **Midterm Grade Export**: contains classlist + Midterm grade column filled.
- **Full Grade Export**: contains classlist + all grade summary columns (Midterm, Final, FG, etc.).

### 5.2 Output File Naming

Format: `{portalClassID}_{SubjectCode}_{ExportType}_{YYYYMMDD}.xlsx`

Example:
- `35112_MS 323_MIDTERM_20260601.xlsx`
- `35112_MS 323_FINAL_20260801.xlsx`

### 5.3 Output Sheet Structure

Mirror the PSU portal format exactly so the registrar/portal can re-import or print directly.

Sheet name: `eClassRecord`

#### Hidden rows (rows 1–3): replicate portal metadata format

| Row | A | B | C | D | E | F | G | H | I | J |
|-----|---|---|---|---|---|---|---|---|---|---|
| 1 | "number" | "StudentNo" | "StudentName" | "Sex" | "Event5" | "FG" | "Total" | "PS" | "WS" | "rawgrades" |
| 2 | "number" | "StudentNo" | "StudentName" | "Sex" | {portalEventID} | "Total" | "PS" | "WS" | "rawgrades" | |
| 3 | "number" | "StudentNo" | "StudentName" | "Sex" | {eventCount} | "Total" | "Total" | "Total" | "rawgrades" | |

Set row hidden = true for rows 1–3.

#### Header block (rows 4–8):

| Row | A | B | C | D | E | F | G | H |
|-----|---|---|---|---|---|---|---|---|
| 4 | "#" | "StudentNo" | "Student Name" | "Sex" | "Midterm" | "Final Grade" | "Status" | |
| 5–8 | (merged) | | | | Event sub-headers | | | |

Row 7 Col E: actual midterm exam date (from `grade_sheet_settings.exam_date_midterm`)
Row 8 Col E: `100` (max score)

#### Data rows (row 9 onward):

| Col | Value |
|-----|-------|
| A | Sequence number (1-based) |
| B | Student number |
| C | Student name (LAST, First M.) |
| D | Sex (F or M) |
| E | Midterm final points (rounded integer, from `grades` table, midterm) |
| F | Final Grade equivalent (e.g., 1.25, 2.00, 5.00, "DRP", "FA") |
| G | Total / average score |
| H | PS: "PASSED" or "FAILED" or "DROPPED" |
| I | (WS: leave blank or repeat grade) |
| J | (rawgrades: raw numeric before transmutation) |

Sort order: alphabetical by student name (LAST, First) — same as PSU portal default.

### 5.4 Cell Protection on Export

Do NOT apply cell protection on exported files.
Exported files are for submission to registrar, not for re-import into GRADUS.
The password-protected StudentNo cells in the portal source are a portal-side behavior only.

### 5.5 Midterm-Only Export (Partial)

When teacher exports after midterm:
- Col E: Midterm grade filled.
- Col F–J: Leave blank or omit.
- Sheet dimensions: `A1:E{lastRow}`.

### 5.6 Full/Final Export

When teacher exports after final term grades are posted:
- All columns A–J filled per the mapping above.
- Final Grade (col F) = equivalent grade from transmutation table.
- Status (col H): PASSED / FAILED / DROPPED.

## 6. Database Tables Involved

### 6.1 class_students (Roster Table)

```
class_offering_id    UUID     FK to class_offerings
student_id           UUID     FK to students
source               TEXT     'classlist_import' | 'manual_add'
import_batch_id      UUID     Groups records from same import session
added_at             TIMESTAMPTZ
removed_at           TIMESTAMPTZ  NULL = active
remove_reason        TEXT     Only if removed post-midterm-post
```

### 6.2 students (Student Record)

Fields used from import:
```
student_number       TEXT     Unique, from col B
student_name         TEXT     From col C (full name as imported)
sex                  TEXT     'F' | 'M'
import_source        TEXT     'classlist_import' | 'manual_add' | 'self_registered'
```

If student already exists (matched by `student_number`): update `student_name` and `sex` only if they differ and the existing record does not have a self-registered profile already merged.

### 6.3 grade_export_logs

```
id                   UUID
class_offering_id    UUID
export_type          TEXT     'midterm' | 'final'
exported_by          UUID     FK to teachers
exported_at          TIMESTAMPTZ
file_name            TEXT
student_count        INT
```

## 7. Validation Rules

### 7.1 Import Validation

| Check | Behavior on Fail |
|-------|-----------------|
| Sheet `eClassRecord` exists | Abort import, show error |
| Col B (StudentNo) not blank | Skip row, log warning |
| Col D (Sex) is F or M | Skip row, log warning |
| Student number already in this class roster | Skip with "already enrolled" notice |
| File has zero valid data rows | Abort import, show error |

### 7.2 Manual Add Validation

| Check | Behavior on Fail |
|-------|-----------------|
| Student number blank | Block save |
| Student number already in class roster | Block save, show "already enrolled" |
| Name blank | Block save |
| Sex not selected | Block save |

### 7.3 Export Validation

| Check | Behavior on Fail |
|-------|-----------------|
| No students in roster | Block export, show "Roster is empty" |
| Midterm grades not computed (midterm export) | Block export |
| Final grades not computed (final export) | Block export |
| Any student has draft (unposted) grade | Warn teacher, allow override with confirmation |

## 8. UI Flows Summary

### 8.1 Import Flow

```
Teacher opens class workspace
  → Clicks "Import Classlist"
  → File picker opens (filter: .xlsx)
  → Teacher selects file
  → System reads file, shows preview table:
     - Columns: #, StudentNo, Name, Sex
     - Row count shown
     - Warnings shown (duplicates, invalid sex, etc.)
  → Teacher confirms class assignment
  → Teacher clicks "Import"
  → Success summary: X imported, Y skipped, Z already existed
```

### 8.2 Manual Add Flow

```
Teacher opens class roster
  → Clicks "Add Student Manually"
  → Modal opens with fields: Student Number, Full Name, Sex
  → Teacher fills in and saves
  → Student appears in roster tagged "Manual Add"
```

### 8.3 Export Flow

```
Teacher opens class workspace (after grading complete)
  → Clicks "Export Grade Sheet"
  → Selects export type: Midterm or Final
  → System checks: all required grades computed and posted
  → Preview table shown with grade columns filled
  → Teacher clicks "Download"
  → File saved: {portalClassID}_{SubjectCode}_{Type}_{Date}.xlsx
  → Export logged to grade_export_logs
```

## 9. Known PSU Portal File Quirks

1. Student number cells (col B) are individually password-protected in the portal file (password: CBE7).
   GRADUS reads these normally since xlsx parsing reads raw cell values, bypassing UI-level protection.

2. Student name format from portal is LAST, First Middle. — preserve exactly as-is in both roster and export.

3. Some student names have trailing spaces (e.g., "CABANDING, Jelyn "). Trim on import and storage.

4. Portal includes a `[Date]` placeholder in row 7 for the exam date column. On export, replace with the
   actual exam date from `grade_sheet_settings`.

5. File may contain up to 82 unique string values in sharedStrings.xml (confirmed from sample). Parser
   must support standard xlsx sharedStrings resolution.

6. The filename uses a space in the subject code (e.g., `MS 323`). When parsing the filename,
   split only on the FIRST underscore to get the portal class ID; everything after is the subject code.
