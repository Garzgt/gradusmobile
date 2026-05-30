# GRADUS Student Mobile App Full Folder Structure (Visualization Only)

This structure follows your sample logic and is scoped for the student app only.

## 1. Full Structure Tree

```text
src/
|-- App.jsx
|-- app.json
|-- babel.config.js
|-- metro.config.js
|-- package.json
|-- .env.example
|
|-- assets/
|   |-- icons/
|   |   |-- app-icon.png
|   |   |-- adaptive-icon.png
|   |   `-- notification-icon.png
|   |-- images/
|   |   |-- splash.png
|   |   |-- gradus-logo.png
|   |   |-- login-bg.png
|   |   `-- empty-state.png
|   `-- animations/
|       |-- loading-dots.json
|       |-- success-check.json
|       |-- no-data.json
|       |-- grade-posted.json
|       `-- schedule-sync.json
|
`-- src/
    |-- AppBootstrap.jsx
    |
    |-- components/
    |   |-- Button.jsx
    |   |-- Button.styles.js
    |   |-- Card.jsx
    |   |-- Card.styles.js
    |   |-- EmptyState.jsx
    |   |-- EmptyState.styles.js
    |   |-- Input.jsx
    |   |-- Input.styles.js
    |   |-- LoadingSpinner.jsx
    |   |-- LoadingSpinner.styles.js
    |   |-- Modal.jsx
    |   |-- Modal.styles.js
    |   |-- SearchBar.jsx
    |   |-- SearchBar.styles.js
    |   |-- SkeletonLoader.jsx
    |   |-- SkeletonLoader.styles.js
    |   |-- Toast.jsx
    |   |-- Toast.styles.js
    |   |-- index.js
    |   |
    |   |-- animated/
    |   |   |-- AnimatedScreenWrapper.jsx
    |   |   |-- AnimatedScreenWrapper.styles.js
    |   |   |-- FadeInSection.jsx
    |   |   |-- FadeInSection.styles.js
    |   |   |-- FloatingActionButton.jsx
    |   |   |-- FloatingActionButton.styles.js
    |   |   |-- ParallaxHeader.jsx
    |   |   |-- ParallaxHeader.styles.js
    |   |   |-- StaggeredList.jsx
    |   |   `-- StaggeredList.styles.js
    |   |
    |   |-- feedback/
    |   |   |-- InlineMessage.jsx
    |   |   |-- InlineMessage.styles.js
    |   |   |-- RetryBanner.jsx
    |   |   |-- RetryBanner.styles.js
    |   |   |-- StatusChip.jsx
    |   |   `-- StatusChip.styles.js
    |   |
    |   `-- schedule/
    |       |-- DayHeader.jsx
    |       |-- DayHeader.styles.js
    |       |-- ScheduleBlock.jsx
    |       |-- ScheduleBlock.styles.js
    |       |-- ScheduleGrid.jsx
    |       |-- ScheduleGrid.styles.js
    |       |-- TimeColumn.jsx
    |       `-- TimeColumn.styles.js
    |
    |-- animations/
    |   |-- motionTokens.js
    |   |-- easing.js
    |   |-- transitions.js
    |   |-- useReducedMotion.js
    |   |-- useStaggerIn.js
    |   |-- useShimmerPulse.js
    |   |-- useParallaxMotion.js
    |   `-- index.js
    |
    |-- config/
    |   |-- env.js
    |   |-- featureFlags.js
    |   |-- breakpoints.js
    |   |-- layoutProfiles.js
    |   |-- routes.js
    |   |-- roleRules.js
    |   `-- supabase.js
    |
    |-- context/
    |   |-- AuthContext.jsx
    |   |-- NetworkContext.jsx
    |   |-- ThemeContext.jsx
    |   `-- ToastContext.jsx
    |
    |-- hooks/
    |   |-- useAuthSession.js
    |   |-- useBreakpoint.js
    |   |-- useResponsiveValue.js
    |   |-- useOrientationMode.js
    |   |-- useDebouncedSearch.js
    |   |-- useInfiniteScroll.js
    |   |-- useNetworkStatus.js
    |   |-- useRealtimeGrades.js
    |   |-- useRealtimeNotifications.js
    |   |-- usePublishedSchedule.js
    |   |-- useSkeletonDelay.js
    |   `-- useToast.js
    |
    |-- navigation/
    |   |-- AppNavigator.jsx
    |   |-- AppNavigator.styles.js
    |   |-- AuthNavigator.jsx
    |   |-- AuthNavigator.styles.js
    |   |-- StudentTabNavigator.jsx
    |   |-- StudentTabNavigator.styles.js
    |   |-- EnrollmentStackNavigator.jsx
    |   |-- EnrollmentStackNavigator.styles.js
    |   |-- GradesStackNavigator.jsx
    |   `-- GradesStackNavigator.styles.js
    |
    |-- screens/
    |   |-- Auth/
    |   |   |-- components/
    |   |   |   |-- DomainNoticeCard.jsx
    |   |   |   |-- DomainNoticeCard.styles.js
    |   |   |   |-- GoogleSignInButton.jsx
    |   |   |   `-- GoogleSignInButton.styles.js
    |   |   |-- services/
    |   |   |   `-- authService.js
    |   |   |-- Login.jsx
    |   |   |-- Login.styles.js
    |   |   |-- DomainBlocked.jsx
    |   |   `-- DomainBlocked.styles.js
    |   |
    |   |-- Onboarding/
    |   |   |-- components/
    |   |   |   |-- OnboardingPager.jsx
    |   |   |   |-- OnboardingPager.styles.js
    |   |   |   |-- OnboardingSlide.jsx
    |   |   |   `-- OnboardingSlide.styles.js
    |   |   |-- services/
    |   |   |   `-- onboardingService.js
    |   |   |-- WelcomeTour.jsx
    |   |   `-- WelcomeTour.styles.js
    |   |
    |   |-- ProfileSetup/
    |   |   |-- components/
    |   |   |   |-- BasicInfoForm.jsx
    |   |   |   |-- BasicInfoForm.styles.js
    |   |   |   |-- ProgramPicker.jsx
    |   |   |   `-- ProgramPicker.styles.js
    |   |   |-- services/
    |   |   |   `-- profileSetupService.js
    |   |   |-- ProfileSetup.jsx
    |   |   `-- ProfileSetup.styles.js
    |   |
    |   |-- Home/
    |   |   |-- components/
    |   |   |   |-- ActionQuickLinks.jsx
    |   |   |   |-- ActionQuickLinks.styles.js
    |   |   |   |-- AdvisingFeatureCard.jsx
    |   |   |   |-- AdvisingFeatureCard.styles.js
    |   |   |   |-- DashboardHeader.jsx
    |   |   |   |-- DashboardHeader.styles.js
    |   |   |   |-- EnrollmentStatusCard.jsx
    |   |   |   |-- EnrollmentStatusCard.styles.js
    |   |   |   |-- GradeSnapshotCard.jsx
    |   |   |   `-- GradeSnapshotCard.styles.js
    |   |   |-- services/
    |   |   |   `-- homeDashboardService.js
    |   |   |-- HomeDashboard.jsx
    |   |   `-- HomeDashboard.styles.js
    |   |
    |   |-- Schedule/
    |   |   |-- components/
    |   |   |   |-- NstpNoticeCard.jsx
    |   |   |   |-- NstpNoticeCard.styles.js
    |   |   |   |-- ScheduleDaySwitcher.jsx
    |   |   |   |-- ScheduleDaySwitcher.styles.js
    |   |   |   |-- ScheduleLegend.jsx
    |   |   |   `-- ScheduleLegend.styles.js
    |   |   |-- services/
    |   |   |   `-- scheduleService.js
    |   |   |-- WeeklySchedule.jsx
    |   |   |-- WeeklySchedule.styles.js
    |   |   |-- ScheduleDetail.jsx
    |   |   `-- ScheduleDetail.styles.js
    |   |
    |   |-- Enrollment/
    |   |   |-- AdvisingForm/
    |   |   |   |-- components/
    |   |   |   |   |-- AdvisingFormPreview.jsx
    |   |   |   |   |-- AdvisingFormPreview.styles.js
    |   |   |   |   |-- AdvisingFormStatusCard.jsx
    |   |   |   |   `-- AdvisingFormStatusCard.styles.js
    |   |   |   |-- services/
    |   |   |   |   `-- advisingFormService.js
    |   |   |   |-- AdvisingFormDownload.jsx
    |   |   |   `-- AdvisingFormDownload.styles.js
    |   |   |
    |   |   |-- EnrollmentStatus/
    |   |   |   |-- components/
    |   |   |   |   |-- EnrolledSubjectCard.jsx
    |   |   |   |   |-- EnrolledSubjectCard.styles.js
    |   |   |   |   |-- EnrollmentSummary.jsx
    |   |   |   |   `-- EnrollmentSummary.styles.js
    |   |   |   |-- services/
    |   |   |   |   `-- enrollmentStatusService.js
    |   |   |   |-- EnrollmentStatus.jsx
    |   |   |   `-- EnrollmentStatus.styles.js
    |   |   |
    |   |
    |   |-- AdvisingPlan/
    |   |   |-- components/
    |   |   |   |-- ConflictAlertBar.jsx
    |   |   |   |-- ConflictAlertBar.styles.js
    |   |   |   |-- EvaluationStatusCard.jsx
    |   |   |   |-- EvaluationStatusCard.styles.js
    |   |   |   |-- EligibilityLegend.jsx
    |   |   |   |-- EligibilityLegend.styles.js
    |   |   |   |-- PlanBuilderGrid.jsx
    |   |   |   |-- PlanBuilderGrid.styles.js
    |   |   |   |-- SubjectPoolList.jsx
    |   |   |   `-- SubjectPoolList.styles.js
    |   |   |-- services/
    |   |   |   |-- portalAuthService.js
    |   |   |   |-- evaluationViewerService.js
    |   |   |   |-- advisingPlanService.js
    |   |   |   |-- advisingValidationService.js
    |   |   |   `-- noAdvanceRuleService.js
    |   |   |-- EvaluationViewer.jsx
    |   |   |-- EvaluationViewer.styles.js
    |   |   |-- BuildAdvisingPlan.jsx
    |   |   |-- BuildAdvisingPlan.styles.js
    |   |   |-- AdvisingFormPreview.jsx
    |   |   `-- AdvisingFormPreview.styles.js
    |   |
    |   |-- Grades/
    |   |   |-- components/
    |   |   |   |-- GradeCard.jsx
    |   |   |   |-- GradeCard.styles.js
    |   |   |   |-- GradePeriodTabs.jsx
    |   |   |   |-- GradePeriodTabs.styles.js
    |   |   |   |-- GradeStatusBadge.jsx
    |   |   |   |-- GradeStatusBadge.styles.js
    |   |   |   |-- GwaSummaryCard.jsx
    |   |   |   `-- GwaSummaryCard.styles.js
    |   |   |-- services/
    |   |   |   |-- gradeService.js
    |   |   |   `-- gradeHistoryService.js
    |   |   |-- GradesOverview.jsx
    |   |   |-- GradesOverview.styles.js
    |   |   |-- SubjectGradeDetail.jsx
    |   |   `-- SubjectGradeDetail.styles.js
    |   |
    |   |-- Recognition/
    |   |   |-- components/
    |   |   |   |-- CriteriaChecklist.jsx
    |   |   |   |-- CriteriaChecklist.styles.js
    |   |   |   |-- HonorCard.jsx
    |   |   |   |-- HonorCard.styles.js
    |   |   |   |-- PublicRankingPreview.jsx
    |   |   |   `-- PublicRankingPreview.styles.js
    |   |   |-- services/
    |   |   |   `-- recognitionService.js
    |   |   |-- MyRecognition.jsx
    |   |   |-- MyRecognition.styles.js
    |   |   |-- RecognitionCriteria.jsx
    |   |   `-- RecognitionCriteria.styles.js
    |   |
    |   |-- Notifications/
    |   |   |-- components/
    |   |   |   |-- NotificationCard.jsx
    |   |   |   |-- NotificationCard.styles.js
    |   |   |   |-- NotificationFilterTabs.jsx
    |   |   |   `-- NotificationFilterTabs.styles.js
    |   |   |-- services/
    |   |   |   `-- notificationService.js
    |   |   |-- NotificationInbox.jsx
    |   |   `-- NotificationInbox.styles.js
    |   |
    |   |-- Profile/
    |   |   |-- components/
    |   |   |   |-- ProfileInfoCard.jsx
    |   |   |   |-- ProfileInfoCard.styles.js
    |   |   |   |-- UpdateProfileForm.jsx
    |   |   |   `-- UpdateProfileForm.styles.js
    |   |   |-- services/
    |   |   |   `-- profileService.js
    |   |   |-- Profile.jsx
    |   |   `-- Profile.styles.js
    |   |
    |   |-- Settings/
    |   |   |-- components/
    |   |   |   |-- AppearanceSettingItem.jsx
    |   |   |   |-- AppearanceSettingItem.styles.js
    |   |   |   |-- NotificationSettingItem.jsx
    |   |   |   `-- NotificationSettingItem.styles.js
    |   |   |-- services/
    |   |   |   `-- settingsService.js
    |   |   |-- Settings.jsx
    |   |   `-- Settings.styles.js
    |   |
    |   |-- HelpSupport/
    |   |   |-- components/
    |   |   |   |-- FaqAccordion.jsx
    |   |   |   |-- FaqAccordion.styles.js
    |   |   |   |-- SupportTicketForm.jsx
    |   |   |   `-- SupportTicketForm.styles.js
    |   |   |-- services/
    |   |   |   `-- supportService.js
    |   |   |-- HelpSupport.jsx
    |   |   `-- HelpSupport.styles.js
    |   |
    |   `-- MediaUploads/
    |       |-- components/
    |       |   |-- UploadPreviewCard.jsx
    |       |   `-- UploadPreviewCard.styles.js
    |       |-- services/
    |       |   `-- mediaUploadService.js
    |       |-- MediaUploads.jsx
    |       `-- MediaUploads.styles.js
    |
    |-- services/
    |   |-- core/
    |   |   |-- apiClient.js
    |   |   |-- authSessionService.js
    |   |   |-- networkService.js
    |   |   |-- realtimeService.js
    |   |   |-- storageService.js
    |   |   |-- syncQueueService.js
    |   |   `-- syncService.js
    |   |-- analytics/
    |   |   `-- analyticsService.js
    |   `-- exports/
    |       `-- shareService.js
    |
    |-- state/
    |   |-- enrollmentStore.js
    |   |-- gradeStore.js
    |   |-- notificationStore.js
    |   `-- scheduleStore.js
    |
    |-- styles/
    |   |-- colors.js
    |   |-- breakpoints.js
    |   |-- responsive.js
    |   |-- commonStyles.js
    |   |-- fonts.js
    |   |-- index.js
    |   |-- motion.js
    |   |-- shadows.js
    |   `-- spacing.js
    |
    |-- utils/
    |   |-- constants.js
    |   |-- dateTime.js
    |   |-- formatters.js
    |   |-- helpers.js
    |   |-- storage.js
    |   |-- uploadUtils.js
    |   `-- validation.js
    |
    `-- __tests__/
        |-- unit/
        |-- integration/
        `-- e2e/
```

## 2. Feature Coverage Included

1. Authentication and profile setup
2. Unified student registration and direct dashboard access
3. PSU evaluation viewer via WebView inside advising feature
4. Advising plan building with no-advance rule and conflict checks
5. Advising form generation and download
6. Enrollment status and enrolled subjects view
7. Published schedule views including NSTP notice context
8. Posted-grade-only visibility and grade history
9. Recognition and criteria tracking
10. Notifications, settings, support, and media uploads
11. Realtime updates, offline sync queue, and animation system
12. Responsive layouts for small phones, large phones, and tablets

## 3. Animation And UI Coverage Included

1. Dedicated animation hooks and motion tokens
2. Animated wrappers and staggered list components
3. Skeleton and shimmer loading support
4. Smooth transitions for screen entry and tab changes
5. Reduced-motion support for accessibility
