# Gradus Mobile — Agent Handoff

This document is for the next AI agent continuing development of this project.
Read every section before writing a single line of code.

---

## Project Overview

**Gradus** is a React Native (Expo v56) student portal mobile app for Pampanga State University.
Students use it to view their grades, schedule, advising plan, enrollment status, recognition/honors, and profile.

- **Platform:** React Native + Expo SDK 56, Windows 11 dev environment
- **Backend:** Supabase (PostgreSQL + RLS + Auth)
- **Auth:** Google OAuth via Supabase, restricted to `@pampangastateu.edu.ph` domain
- **Navigation:** React Navigation v6 — bottom tab + stack navigators
- **Icons:** `@expo/vector-icons` Ionicons only
- **State:** Local `useState` / `useCallback` — no Redux or Zustand

---

## Navigation Structure

```
AppNavigator (Stack)
├── Auth → AuthNavigator (Login, DomainBlocked)
├── ProfileSetup (first-time only)
└── StudentApp → StudentTabNavigator (5 tabs)
    ├── Home        → HomeDashboard
    ├── Schedule    → WeeklySchedule
    ├── Grades      → GradesStackNavigator
    │                  └── GradesOverview → SubjectGradeDetail
    ├── AdvisingPlan → AdvisingStackNavigator
    │                   └── BuildAdvisingPlan → EvaluationViewer → AdvisingFormPreview
    └── Profile     → Profile

AppNavigator also registers (pushed modally over tabs):
  └── Notifications → NotificationInbox
```

Routes are defined in `src/config/routes.js`.

---

## Screen Status

### ✅ Built & Functional
| Screen | File |
|---|---|
| Login | `src/screens/Auth/Login.jsx` |
| Domain Blocked | `src/screens/Auth/DomainBlocked.jsx` |
| Profile Setup | `src/screens/ProfileSetup/ProfileSetup.jsx` |
| Home Dashboard | `src/screens/Home/HomeDashboard.jsx` |
| Weekly Schedule | `src/screens/Schedule/WeeklySchedule.jsx` |
| Grades Overview | `src/screens/Grades/GradesOverview.jsx` |
| Subject Grade Detail | `src/screens/Grades/SubjectGradeDetail.jsx` |
| Build Advising Plan | `src/screens/AdvisingPlan/BuildAdvisingPlan.jsx` |
| Evaluation Viewer | `src/screens/AdvisingPlan/EvaluationViewer.jsx` |
| Advising Form Preview | `src/screens/AdvisingPlan/AdvisingFormPreview.jsx` |
| Profile | `src/screens/Profile/Profile.jsx` |

### ❌ Empty Placeholders — Build These Next (priority order)
| Priority | Screen | File |
|---|---|---|
| 1 | Enrollment Status | `src/screens/Enrollment/EnrollmentStatus/EnrollmentStatus.jsx` |
| 2 | Notification Inbox | `src/screens/Notifications/NotificationInbox.jsx` |
| 3 | My Recognition | `src/screens/Recognition/MyRecognition.jsx` |
| 4 | Recognition Criteria | `src/screens/Recognition/RecognitionCriteria.jsx` |
| 5 | Settings | `src/screens/Settings/Settings.jsx` |
| 6 | Help & Support | `src/screens/HelpSupport/HelpSupport.jsx` |
| 7 | Welcome Tour | `src/screens/Onboarding/WelcomeTour.jsx` |
| 8 | Advising Form Download | `src/screens/Enrollment/AdvisingForm/AdvisingFormDownload.jsx` |
| 9 | Schedule Detail | `src/screens/Schedule/ScheduleDetail.jsx` |
| 10 | Media Uploads | `src/screens/MediaUploads/MediaUploads.jsx` |

---

## Design Rules — MUST FOLLOW

### 1. Theme Colors Only
**Never introduce a new hex value.** Only use colors already in the palette:

| Role | Hex |
|---|---|
| Primary dark navy | `#1a3c5e` |
| Primary blue | `#2A7AB6` |
| Screen background | `#F2F6FA` |
| Light blue chip/badge bg | `#EBF4FC` |
| Secondary text | `#8BA4BC` |
| Medium text | `#5A7A9A` |
| Dark text | `#1A2A3A` |
| Card white | `#FFFFFF` |
| Divider / subtle bg | `#F0F6FC`, `#EEF4FA` |
| Success green bg | `#E8F5EE` |
| Success green text | `#16A34A`, `#1a6e4a` |
| Error red (status only) | `#DC2626` |
| Warning orange (status only) | `#D97706` |
| Placeholder/skeleton | `#C8DFF0` |

For **action buttons** (including destructive ones like Sign Out): use `#2A7AB6` or `#1a3c5e`.
Red (`#DC2626`) is **only** for status indicators (absent, failed grades) — never for buttons.

### 2. Card Margins
All cards, section containers, and list wrappers use `marginHorizontal: 10`. Never use `marginHorizontal: 16`.

### 3. Screen Header Pattern
Every main screen uses this exact dark navy header structure:
```jsx
<SafeAreaView style={{ flex: 1, backgroundColor: '#1a3c5e' }} edges={['top']}>
  <View style={styles.header}>
    <View style={styles.decOrb} />           {/* decorative orb — always present */}
    <Text style={styles.headerLabel}>SCREEN NAME</Text>   {/* 10px, letterSpacing 2, opacity 0.4 */}
    <Text style={styles.headerTitle}>Title</Text>          {/* 28px, fontWeight 800 */}
    <Text style={styles.headerSub}>Subtitle</Text>         {/* 13px, opacity 0.45 */}
  </View>
  <ScrollView style={{ backgroundColor: '#F2F6FA' }}>
    ...
  </ScrollView>
</SafeAreaView>
```
Copy the exact header styles from any existing screen (e.g. `GradesOverview.jsx`).

### 4. Section Label Cards
Section dividers (like "Enrolled Subjects", "Weekly Schedule") are full-width centered white cards:
```jsx
<View style={styles.sectionLabelCard}>
  <Text style={styles.sectionLabelText}>SECTION NAME</Text>
</View>
```
Style: `backgroundColor: '#FFFFFF'`, `borderRadius: 12`, `paddingVertical: 9`, `alignItems: 'center'`, `elevation: 2`, text: `fontSize: 11`, `fontWeight: '700'`, `color: '#8BA4BC'`, `letterSpacing: 1.5`, `textTransform: 'uppercase'`.

### 5. ScrollView Bottom Padding
Always use `useSafeAreaInsets()` and set `paddingBottom: insets.bottom + 100` on content container to avoid tab bar overlap.

### 6. Data Fetching Pattern
```jsx
const loadData = useCallback(async () => {
  if (!user) { setLoading(false); return; }
  setLoading(true);
  const { data, error } = await supabase.from(...);
  if (error) setError('Could not load. Pull down to retry.');
  else setData(data);
  setLoading(false);
}, [user]);

useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
```
Always use `useFocusEffect` (not `useEffect`) for screen-level data fetches so data refreshes when navigating back.

### 7. Empty / Error States
```jsx
{loading ? <SkeletonBox ... /> : error ? (
  <View style={styles.emptyCard}>
    <Ionicons name="alert-circle-outline" size={32} color="#C8DFF0" />
    <Text style={styles.emptyTitle}>{error}</Text>
  </View>
) : data.length === 0 ? (
  <View style={styles.emptyCard}>
    <Ionicons name="..." size={36} color="#C8DFF0" />
    <Text style={styles.emptyTitle}>No data yet</Text>
    <Text style={styles.emptyText}>Descriptive message here.</Text>
  </View>
) : ( /* real content */ )}
```

### 8. Skeleton Loader
Use `SkeletonBox` from `../../components/SkeletonLoader` for loading placeholders:
```jsx
import SkeletonBox from '../../components/SkeletonLoader';
<SkeletonBox width="100%" height={80} borderRadius={14} />
```

### 9. Pull-to-Refresh
All scrollable screens support pull-to-refresh:
```jsx
const [refreshing, setRefreshing] = useState(false);
const onRefresh = async () => { setRefreshing(true); await loadData(true); setRefreshing(false); };
<ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A7AB6" colors={['#2A7AB6']} />}>
```

---

## Database Key Tables

| Table | Purpose |
|---|---|
| `profiles` | Auth user info: `user_id`, `email`, `full_name`, `app_role`, `avatar_url` |
| `students` | Student record: `student_number`, `first_name`, `last_name`, `contact_number`, `sex`, `program_id`, `current_year_level` |
| `programs` | `code`, `name` |
| `academic_terms` | `school_year`, `semester`, `is_active` |
| `class_students` | Enrollment bridge: `student_id`, `class_offering_id`, `is_active` |
| `class_offerings` | `section_id`, `subject_id`, `teacher_id`, `term_id` |
| `subjects` | `subject_code`, `title`, `credit_units`, `color_hex` |
| `schedule_entries` | Timetable: `term_id`, `section_id`, `subject_id`, `teacher_id`, `venue_id`, `day_of_week`, `start_time`, `end_time` |
| `grades` | Official posted grades: `equivalent_grade`, `remarks`, `midterm_points`, `final_term_points`, `status` ('draft'/'posted') |
| `grade_components` | Raw score breakdown per period (midterm/final) |
| `grade_attendance_entries` | Per-meeting attendance records |
| `grade_sheet_settings` | Weight config per class offering |

**Critical rules learned from bugs:**
- `schedule_entries` has NO `class_offering_id` — query via `section_id` + `subject_id` + `term_id`
- `grades` table has `status` field — students only see `status = 'posted'` grades
- RLS policies must reference `students` table (not a non-existent `enrollments` table)

---

## Auth Context

`useAuth()` returns:
```js
{ user, profile, isLoading, isAuthenticated, signOut, refreshProfile }
```
- `user` = Supabase auth user (`user.id`, `user.email`, `user.user_metadata.avatar_url` / `user.user_metadata.picture`)
- `profile` = row from `profiles` table (`full_name`, `app_role`, `avatar_url`)

---

## Code Style Rules

- **No comments** unless the WHY is non-obvious
- **No new abstractions** beyond what the task requires
- **Prefer editing existing files** over creating new ones
- Component styles: define inline `StyleSheet.create({})` at the bottom of the screen file unless a `.styles.js` file already exists for it
- Many screens have empty companion `.styles.js` files — ignore those, put styles inline in the `.jsx`
- Use `Ionicons` from `@expo/vector-icons` for all icons
- Always check Expo v56 docs before using any Expo API: https://docs.expo.dev/versions/v56.0.0/

---

## Behavior Rules for Agent

1. **Plan first, build second.** When given a new screen to build, present a layout plan and wait for "go" before writing code.
2. **Never introduce off-palette colors.** Check the theme table above before every hex value you write.
3. **Always `marginHorizontal: 10`** on cards — never 16.
4. **Match the header pattern** exactly — every screen has the same dark navy header with `decOrb`.
5. **RLS issues** are common in Supabase. If a query returns `null` data with no error (or a table-not-found error), suspect RLS and provide the SQL policy fix to the user.
6. **Debug logs**: add `console.log` with numbered steps when a screen fails to load data. Remove them once the user confirms it's working.
7. **Never use red for buttons.** Red is for status badges only.
8. **Keep responses short.** No trailing summaries — the user can read the diff.
9. **Ask before doing** anything irreversible (deleting files, force push, etc.).
10. **useFocusEffect** for all screen data fetches — not useEffect.
