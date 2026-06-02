# Handoff: Grades Screen
**Project:** Gradus Mobile App (PSU Students)
**Working directory:** `c:\Capstone\Gradus\Mobile\Gradus`

---

## FIRST THING TO DO
Read this file before writing any code:
```
Rules\FinalDatabase\GradusTableStructure.sql
```
Understand the grades-related tables from the schema before building anything.

---

## Tech Stack
- React Native + Expo v56 — docs: https://docs.expo.dev/versions/v56.0.0/
- Supabase — `src/config/supabase.js` (database + auth)
- `@react-navigation/native` — navigation
- `react-native-safe-area-context` — safe area
- `@expo/vector-icons` (Ionicons) — icons
- Platform: Android primary

---

## Theme / Design System

**Colors:**
```
Primary navy:   #1a3c5e
Primary blue:   #2A7AB6
Light blue bg:  #EBF4FC
Screen bg:      #F2F6FA
Text primary:   #1A2A3A
Text muted:     #8BA4BC
```

**Every screen uses this header pattern:**
```jsx
<SafeAreaView style={{ flex:1, backgroundColor:'#1a3c5e' }} edges={['top']}>
  <View style={styles.header}>
    <View style={styles.decOrb} />
    <Text style={styles.headerLabel}>GRADES</Text>
    <Text style={styles.headerTitle}>My Grades</Text>
    <Text style={styles.headerSub}>Your academic performance</Text>
  </View>
  <ScrollView style={{ backgroundColor:'#F2F6FA' }}>
    {/* content */}
  </ScrollView>
</SafeAreaView>
```

**Floating tab bar** is `position: absolute` (~68px + insets.bottom + 10).
Any bottom content needs `paddingBottom: insets.bottom + 88` to clear it.

---

## Global Systems (already wired in App.js — use these, not Alert)
```js
import { useToast } from '../../context/ToastContext';
import { useAlert } from '../../context/AlertContext';

const toast = useToast();
const alert = useAlert();

toast.show({ type: 'success' | 'error' | 'warning' | 'info', title: '...', message: '...' });

alert.show({
  title: '...',
  message: '...',
  buttons: [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', onPress: () => {} },
  ],
});
```

---

## Navigation Structure
```
StudentTabNavigator (bottom tabs)
  ├── Home
  ├── Schedule
  ├── GradesStackNavigator   ← BUILD THIS
  │     ├── GradesOverview        (stub)
  │     └── SubjectGradeDetail    (stub)
  ├── AdvisingStackNavigator (done)
  └── Profile
```

Routes:
```js
// src/config/routes.js
routes.GRADES_OVERVIEW      = 'GradesOverview'
routes.SUBJECT_GRADE_DETAIL = 'SubjectGradeDetail'
```

---

## Current State of Grades Files (all stubs — empty Views)
```
src/screens/Grades/
  GradesOverview.jsx              ← main screen (stub)
  GradesOverview.styles.js
  SubjectGradeDetail.jsx          ← detail screen (stub)
  SubjectGradeDetail.styles.js
  services/
    gradeService.js               ← empty export {}
    gradeHistoryService.js        ← empty
  components/
    GradeCard.jsx                 ← stub
    GradeCard.styles.js
    GradePeriodTabs.jsx           ← stub
    GradePeriodTabs.styles.js
    GradeStatusBadge.jsx          ← stub
    GradeStatusBadge.styles.js
    GwaSummaryCard.jsx            ← stub
    GwaSummaryCard.styles.js
```

---

## What to Build

1. **Read the SQL schema first** (`Rules\FinalDatabase\GradusTableStructure.sql`)
2. **`gradeService.js`** — Supabase fetch functions for student grades
3. **`GradesOverview.jsx`** — semester tabs, GWA summary card, list of subject grade cards per term
4. **`SubjectGradeDetail.jsx`** — per-subject breakdown (prelim / midterm / final if available)
5. **Components** — implement all the stubs:
   - `GwaSummaryCard` — shows overall GWA prominently
   - `GradeCard` — one subject row with grade + status badge
   - `GradePeriodTabs` — tab bar switching between terms/semesters
   - `GradeStatusBadge` — passed / failed / incomplete badge

## UX Goals
- Student sees GWA immediately on open
- Subjects grouped by semester/term
- Failing grades visually distinct (red)
- Passed subjects clearly marked (blue/green)
- Tap a subject card → go to SubjectGradeDetail
- Pull to refresh
- Loading skeleton while fetching
