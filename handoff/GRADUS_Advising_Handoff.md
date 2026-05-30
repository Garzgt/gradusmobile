# GRADUS Irregular Student Advising — Complete Handoff Summary

## Project Context
- **App**: React Native Expo mobile app (Gradus) for PSU Sto. Tomas Campus students
- **Website**: Next.js admin portal at `C:\Capstone\Gradus\Website\Gradus` — handles scheduling only, no advising feature
- **Database**: Supabase (shared between website and mobile app)
- **PSU Portal**: `https://sms.pampangastateu.edu.ph` — holds student evaluation/grade history per curriculum

---

## What "Irregular Student" Means
A student who has back subjects (failed/not yet taken), shifted programs, or did not follow the standard curriculum sequence. They cannot auto-enroll — they need a faculty adviser to approve a custom subject plan each semester.

---

## Full Advising Flow

### Step 1 — Evaluation Viewer (`EvaluationViewer.jsx`)
- Opens a **WebView** pointing to `https://sms.pampangastateu.edu.ph/#student/evaluation`
- Student is already logged into the PSU portal through the WebView (their own session)
- When the WebView URL contains `#student/evaluation`, a floating **"Scan" button** appears as an overlay on top of the WebView
- Student taps **Scan** → app injects JavaScript into the WebView DOM
- The injected JS reads the evaluation table:
  - **Blue/teal rows** = subject already taken (has "View Grades" link) → SKIP
  - **White rows** = subject not yet taken (no "View Grades" link) → INCLUDE
- The JS extracts from each white row: `subjectCode`, `subjectName`, `units`, `yearLevel`, `semester`, `prerequisites`
- Data is sent back to React Native via `window.ReactNativeWebView.postMessage(JSON.stringify(data))`
- App stores this as the student's **eligible subject pool**

> **NOTE FOR NEXT AI**: The exact HTML structure of the evaluation table at `https://sms.pampangastateu.edu.ph/#student/evaluation` needs to be inspected (DevTools) to write the correct JS selectors. Key things to find:
> - The `<table>` or container element's `id` or `class`
> - How each `<tr>` row is colored (inline style? CSS class?)
> - Which column index contains: subject code, subject name, units, year/sem label, prerequisites
> - Whether "View Grades" is a link `<a>` or button inside the row

---

### Step 2 — Auto-Generate Advising Plan (`BuildAdvisingPlan.jsx` → plan builder)
- App takes the extracted subject pool from Step 1
- Queries Supabase `schedule_entries` for those subjects in the **active term**, across ALL departments/programs (not just the student's own program — a BSIT student can take Math from a BSED section if needed)
- App **automatically selects the best non-conflicting schedule entries** — the student does NOT manually pick
- **Conflict detection logic** (same as the website scheduling engine):
  ```js
  // Two entries conflict if same day AND times overlap
  // day_of_week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // times stored as "HH:MM" strings
  function isTimeOverlap(startA, endA, startB, endB) {
    return timeToMinutes(startA) < timeToMinutes(endB) &&
           timeToMinutes(endA)   > timeToMinutes(startB);
  }
  // CONFLICT = entryA.day_of_week === entryB.day_of_week && isTimeOverlap(...)
  ```
- If a subject has **no available slot** that fits (all schedule entries for it conflict with already-assigned subjects) → **notify the student**: subject could not be scheduled
- If the schedule is too tight to fit all needed subjects → show which ones were left out and why

---

### Step 3 — Preview & Submit (`AdvisingFormPreview.jsx`)
- Student reviews the auto-generated plan
- Shows each subject with: subject code, name, units, teacher, section, room, day, time
- Shows a separate list of subjects that **could not be scheduled** with reason
- Student submits → generates the **advising form** (document for adviser approval)

---

## Key Database Tables (Supabase)

| Table | Purpose | Key Columns |
|---|---|---|
| `academic_terms` | Active term | `id`, `semester`, `school_year`, `is_active` |
| `schedule_entries` | Published class schedules | `subject_id`, `section_id`, `teacher_id`, `venue_id`, `day_of_week`, `start_time`, `end_time`, `term_id`, `schedule_status` |
| `sections` | Class sections | `id`, `section_code`, `year_level`, `program_id`, `term_id` |
| `subjects` | Subject info | `id`, `subject_code`, `name`, `credit_units`, `curriculum_version_id` |
| `teachers` | Teacher info | `id`, `first_name`, `last_name` |
| `venues` | Room info | `id`, `name` |
| `students` | Student profile | `id`, `user_id`, `program_id` |
| `grades` | Student grade history | `student_id`, `subject_id`, `final_grade`, `status` |
| `class_students` | Enrolled subjects | `student_id`, `class_id` |

---

## Existing File Structure (Mobile App)

```
src/screens/AdvisingPlan/
  BuildAdvisingPlan.jsx          ← Step landing screen (UI done, no logic)
  EvaluationViewer.jsx           ← EMPTY — needs WebView + Scan button
  AdvisingFormPreview.jsx        ← EMPTY — needs form preview + submit
  EvaluationViewer.styles.js     ← empty
  BuildAdvisingPlan.styles.js    ← empty
  AdvisingFormPreview.styles.js  ← empty
  components/
    ConflictAlertBar.jsx         ← EMPTY — shows conflict warnings
    EvaluationStatusCard.jsx     ← EMPTY — shows evaluation summary
    EligibilityLegend.jsx        ← EMPTY — legend for subject status colors
    PlanBuilderGrid.jsx          ← EMPTY — grid of auto-selected subjects
    SubjectPoolList.jsx          ← EMPTY — list of eligible subjects
  services/
    portalAuthService.js         ← EMPTY — PSU portal session handling
    evaluationViewerService.js   ← EMPTY — parse evaluation data from WebView
    advisingPlanService.js       ← EMPTY — generate plan from schedule_entries
    advisingValidationService.js ← EMPTY — conflict detection logic
    noAdvanceRuleService.js      ← EMPTY — enforce no-advance rule

src/navigation/
  AdvisingStackNavigator.jsx     ← DONE — Stack: BuildAdvisingPlan → EvaluationViewer → AdvisingFormPreview
```

---

## What Needs to Be Built (Priority Order)

1. **EvaluationViewer.jsx** — WebView + Scan button + JS injection + postMessage parsing
2. **evaluationViewerService.js** — parse raw postMessage data into structured subject list
3. **advisingPlanService.js** — query schedule_entries, auto-assign subjects, return plan
4. **advisingValidationService.js** — conflict detection (day + time overlap)
5. **noAdvanceRuleService.js** — rule: student cannot take subjects beyond their current year level without completing prerequisites
6. **PlanBuilderGrid.jsx** — display the auto-generated plan
7. **ConflictAlertBar.jsx** — show which subjects couldn't be scheduled
8. **AdvisingFormPreview.jsx** — final review screen + form generation

---

## Design Style Reference
- Primary dark blue: `#1a3c5e`
- Accent blue: `#2A7AB6`
- Light blue bg: `#EBF4FC`
- Light screen bg: `#F2F6FA`
- Success green: `#1a6e4a`, bg `#E8F5EE`
- Card style: `backgroundColor: '#FFFFFF'`, `borderRadius: 18-22`, `elevation: 3`, `shadowColor: '#1a3c5e'`
- All screens use `SafeAreaView` with `edges={['top']}` and dark blue safe area bg
- Font weights: labels `700`, titles `800`, body `500`
- Skeleton loader available at `src/components/SkeletonLoader.jsx` (SkeletonBox default export, SkeletonRow named export)
