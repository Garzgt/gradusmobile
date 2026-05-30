# Schedule Generation Logic

This document defines the exact rules and logic used by the scheduling engine in GRADUS.
All rules are derived from the reference system and adapted to the GRADUS DB schema.

---

## 1. Time Grid

- Start: 7:00 AM
- End: 5:30 PM (last slot ends at 5:30 PM)
- Last slot start: 5:00 PM
- Increment: 30 minutes
- Total slots: 21
- DB format: 24-hour strings `"HH:MM"` (e.g. `"07:00"`, `"14:30"`)
- Display format: 12-hour (e.g. `"7:00 AM"`, `"2:30 PM"`)

### Slot list (start times, 12-hour)

7:00 AM, 7:30 AM, 8:00 AM, 8:30 AM, 9:00 AM, 9:30 AM,
10:00 AM, 10:30 AM, 11:00 AM, 11:30 AM, 12:00 PM, 12:30 PM,
1:00 PM, 1:30 PM, 2:00 PM, 2:30 PM, 3:00 PM, 3:30 PM,
4:00 PM, 4:30 PM, 5:00 PM

> The timetable grid runs **7:00 AM – 5:30 PM**. 5:30 PM is the end boundary row displayed on the grid.
> The last valid **start time** is 5:00 PM (21st slot). Sessions must end **by or before 5:30 PM**.
> Whether a session can actually start at 5:00 PM depends on its duration
> (e.g. a 2h PE session starting at 5:00 PM would end at 7:00 PM — invalid, so it would be placed earlier).

---

## 2. Days of Week

| Value | Label     | Notes                                                        |
|-------|-----------|--------------------------------------------------------------|
| 1     | Monday    | Always available                                             |
| 2     | Tuesday   | Always available                                             |
| 3     | Wednesday | Always available                                             |
| 4     | Thursday  | Always available                                             |
| 5     | Friday    | Always available                                             |
| 6     | Saturday  | Only if `section.saturday_blocked = false` AND `year_level ≠ 1` |

Year 1 sections are always Saturday-blocked regardless of the `saturday_blocked` flag
(Saturday is reserved for NSTP).

DB stores day as integer 1–6.

---

## 3. Session Duration Rules

Durations are **fixed constants by subject_type** — they are NOT calculated from unit counts.
`lec_units` and `lab_units` are credit/load tracking fields only.

| subject_type   | session_part | Duration   | Notes                                    |
|----------------|--------------|------------|------------------------------------------|
| lecture_only   | lecture      | 3 hours    | Always 3h straight                       |
| pe             | pe           | 2 hours    | Always 2h straight                       |
| lecture_lab    | lecture      | 2 hours    | Lecture session only                     |
| lecture_lab    | lab          | 3 hours    | Lab session only                         |
| lecture_lab    | combined     | 5 hours    | Combined lec+lab straight (2h + 3h)     |
| ojt            | ojt          | TBD        | Single block; hours vary by department (to be specified) |
| nstp           | —            | SKIP       | Not placed in schedule at all            |

---

## 4. Delivery Pattern Rules

Delivery pattern controls how sessions are split across days.

### single_day
- 1 session placed on one day.
- `lecture_only` → 3h straight.
- `pe` → 2h straight.
- `ojt` → single block; duration per department TBD (default 6h until specified).

### flexible
- Applies to 3-unit lecture subjects.
- **Try Option A first**: 3h straight on one day (1 session).
- **Fallback to Option B**: Two 1.5-hour (90-min) sessions on separate days (2 sessions).
- If Option A finds a valid day+slot+venue, use it. Only fall back to Option B if no single valid day exists.

### split_lec_lab
- 2 sessions, **always on separate days**.
- Lecture session: 2 hours on one day.
- Lab session: 3 hours on a different day.
- The engine tries lecture-first placement, then lab-first if lecture placement fails.
- **Co-teach fallback**: If the lecture and lab sessions are assigned to different teachers (co-teach), each session is placed on a day valid for its own teacher.

### combined_lec_lab
- 1 session placed on one day.
- Duration: 5 hours straight (2h lecture + 3h lab, no break).

---

## 5. Venue Requirements

GRADUS `venue_type` enum values are **lowercase**: `lecture`, `lab`, `open_area`.

### Venue type by session_part

| subject_type         | session_part      | Required venue_type | Notes                                  |
|----------------------|-------------------|---------------------|----------------------------------------|
| lecture_only         | lecture           | lecture             |                                        |
| lecture_lab          | lecture           | lecture             |                                        |
| lecture_lab          | lab               | lab                 | subtype depends on program             |
| lecture_lab          | combined          | lab                 | subtype depends on program             |
| pe                   | pe                | open_area           |                                        |
| ojt                  | ojt               | none                | No venue assigned (off-campus / TBD)   |
| nstp                 | —                 | —                   | Skipped entirely                       |

If `subject.required_venue_type` is explicitly set on the subject record, use that value
instead of the default above (except for `lecture_lab` lecture sessions, which always use `lecture`).

### Venue matching conditions (all must be true)

1. `venue.is_active = true`
2. `venue.venue_type` matches required venue_type
3. `venue.venue_subtype` matches `subject.required_venue_subtype` (if set)
4. Venue is not already booked at the target day + overlapping time slot
5. If `venue_program_restrictions` exist for the venue, the section's program must be allowed (`is_allowed = true`)

---

## 6. Teacher Assignment Rules

1. Teacher is fetched from `teacher_subject_assignments` for the subject and active term.
2. If no assignment exists for a subject, `teacher_id` is left null (entry still scheduled, unassigned).
3. Teacher availability is checked against `teacher_availability` rows for the same term.
   - A teacher is available on a day/slot only if a matching `teacher_availability` row covers that slot.
   - If no availability rows exist for a teacher, treat the teacher as available any time.
4. A teacher cannot be placed in two overlapping slots on the same day (**teacher_overlap** rule).
5. `teacher.max_teaching_days` limits how many distinct days per week the teacher is assigned.
   - If teacher is already scheduled on the proposed day, it does not count as a new day.
6. `teacher.max_load_units` limits total credit units assigned per term.
   - Multi-session subjects (split_lec_lab, flexible Option B) count units **once** per section-subject pair.
7. **Teacher ranking** (lightest assigned first):
   - Primary sort: lowest `load_percentage` (scheduled_units / max_load_units)
   - Secondary sort: fewest scheduled days
   - For `single_day` and `combined_lec_lab`: part-time teachers are prioritized first
   - Teachers with fewer available days are scheduled earlier (harder to place)

---

## 7. Section Constraints

1. A section cannot have two overlapping slots on the same day (**section_overlap** rule).
2. If `section.saturday_blocked = true`, no entries may be placed on Saturday (day 6).
3. Year level 1 sections are always blocked from Saturday regardless of `saturday_blocked`.
4. Section `year_level` must match subject `year_level`.
5. Section `semester` must match the active term's `semester`.

---

## 8. Placement Algorithm (Greedy)

### Order of processing

1. Sections are processed in ascending `year_level` order (year 1 first).
2. Within a section, subjects are processed in descending `credit_units` order (harder to place first).

### For each subject in a section

1. Call `shouldSkipSubject(subject)` — returns true for `nstp`. Skip if true.
2. Call `resolvePattern(subject)` to get the list of sessions required (each with `session_part` and `duration_mins`).
3. For each session:
   a. Determine allowed days: Mon–Fri always; add Sat only if `isSaturdayAllowedForSection(section)`.
   b. Iterate days in order: Mon (1), Tue (2), Wed (3), Thu (4), Fri (5), Sat (6 if allowed).
   c. For each day, iterate start times in ascending order (07:00 first).
   d. Skip any slot where:
      - The section is already booked (section_overlap).
      - The teacher is already booked (teacher_overlap).
      - The teacher is not available per `teacher_availability`.
      - `endTime` would exceed 17:30.
   e. For the first valid slot, call `findAvailableVenue`.
   f. If a venue is found (or no venue is required), record the entry in memory and mark the slot booked.
   g. If no valid slot+venue is found after all candidates, mark the subject as unscheduled.
4. For `split_lec_lab`: the lab session must be placed on a **different day** than the lecture session.
5. For `flexible` Option B: the second 1.5h session must be on a **different day** than the first.

### Load balancing

When multiple days are equally valid for a slot, prefer the day where the teacher has fewer
total minutes already assigned. This spreads teacher load across the week instead of front-loading Monday.

### Subject spacing

When a section already has subjects on certain days, prefer placing new subjects on days
with fewer or no existing assignments (gap penalty). This reduces daily class density.

---

## 9. Generation Modes

| Mode                  | Behavior                                                                        |
|-----------------------|---------------------------------------------------------------------------------|
| full_regeneration     | Delete all existing `schedule_entries` for the term, then regenerate from scratch. |
| generate_unscheduled  | Keep existing entries; only place subjects that have no entry yet.              |
| replace_section       | Delete entries for the specific section(s) only, then regenerate those sections. |

**Constraint**: `full_regeneration` requires `scope = whole_term`.
Use `replace_section` for scoped (single section / program) re-runs.

---

## 10. Generation Scope

| Scope           | Sections processed                                    |
|-----------------|-------------------------------------------------------|
| whole_term      | All active sections for the active term               |
| program         | All active sections under the specified `program_id`  |
| single_section  | Only the one section specified in the log             |

---

## 11. Conflict Detection (Post-placement)

Conflict check runs after all entries are placed. It scans all draft entries for the term
and writes rows to `schedule_conflicts`.

### Conflict types and severities

| conflict_type             | Severity | Description                                                    |
|---------------------------|----------|----------------------------------------------------------------|
| teacher_overlap           | 1        | Teacher assigned to two overlapping entries on the same day    |
| section_overlap           | 1        | Section has two overlapping entries on the same day            |
| room_overlap              | 2        | Same venue booked for two entries at the same time             |
| saturday_violation        | 2        | Entry placed on Saturday for a Saturday-blocked section        |
| venue_mismatch            | 3        | Entry's venue type does not match subject's required_venue_type|
| venue_program_restriction | 3        | Entry's venue is not allowed for the section's program         |
| other                     | 4        | Any other constraint violation                                 |

### Severity scale

| Severity | Label    | Blocks publish? |
|----------|----------|-----------------|
| 1        | Critical | Yes             |
| 2        | Hard     | Yes             |
| 3        | Medium   | No              |
| 4        | Low      | No              |
| 5        | Info     | No              |

Only severity 1 and 2 conflicts block the Publish step.

---

## 12. Generation Log Summary

When generation completes, the `schedule_generation_logs` row is updated with:

```json
{
  "entries_created": 120,
  "sections_covered": 8,
  "sections_total": 10,
  "unscheduled_count": 3,
  "conflicts_found": 5,
  "conflict_by_severity": { "1": 2, "2": 1, "3": 2 },
  "duration_ms": 1240
}
```

---

## 13. Cancellation Handling

- The engine checks for cancellation after loading data and after each section is processed.
- If `schedule_generation_logs.status` has been set to `"cancelled"` externally (by user action),
  the engine stops immediately and does not commit further entries.
- Entries already inserted before cancellation are retained and must be cleared via a full regeneration.

---

## 14. Special Subject Types (No Venue)

The following `subject_type` values require no venue — `venue_id` is left `null`:

- `ojt` (off-campus / TBD per department)

These subjects are still placed in the time grid and generate no `venue_mismatch` conflict.
The time block represents off-campus time, not a room booking.

`nstp` is never placed at all (skipped before pattern resolution).

---

## 15. GRADUS DB Schema Notes

The GRADUS DB differs from the reference system in these ways:

| Concept        | Reference system          | GRADUS DB                       |
|----------------|---------------------------|---------------------------------|
| Day of week    | String: `'Monday'`…`'Saturday'` | Integer: `1`…`6`          |
| Venue active   | `venue.status = 'active'` | `venue.is_active = true`        |
| Section active | `section.status = 'active'` | `section.is_active = true`    |
| Subject code   | `subject.code`            | `subject.subject_code`          |
| Subject name   | `subject.name`            | `subject.title`                 |
| Venue type     | `'Lecture'`, `'Lab'`, `'Open Area'` | `'lecture'`, `'lab'`, `'open_area'` |
| Conflict types | `teacher_conflict`, `room_conflict` | `teacher_overlap`, `room_overlap` |

All time strings use `"HH:MM"` 24-hour format in both reading and writing.
