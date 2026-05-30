# GRADUS Teacher Desktop Full Folder Structure (Electron, Visualization Only)

This is the full proposed folder structure for the Teacher Desktop app using Electron and feature-based vertical slices.

## 1. Full Structure Tree

```text
teacher-desktop/
|-- package.json
|-- electron-builder.json
|-- vite.config.js
|-- jsconfig.json
|-- .env.example
|
|-- build/
|   |-- entitlements.mac.plist
|   |-- icon.ico
|   |-- icon.icns
|   `-- icon.png
|
|-- scripts/
|   |-- postbuild-copy.js
|   |-- prepackage-checks.js
|   `-- release-notes.js
|
|-- electron/
|   |-- main/
|   |   |-- index.js
|   |   |-- windowManager.js
|   |   |-- menuBuilder.js
|   |   |-- trayManager.js
|   |   |-- protocolHandler.js
|   |   |-- lifecycle.js
|   |   |-- storage/
|   |   |   |-- localDb.js
|   |   |   |-- keyStore.js
|   |   |   |-- localMigrations.js
|   |   |   `-- queueRepository.js
|   |   |-- updater/
|   |   |   |-- autoUpdateService.js
|   |   |   `-- updateDialog.js
|   |   |-- security/
|   |   |   |-- cspPolicy.js
|   |   |   |-- externalLinkGuard.js
|   |   |   `-- permissionPolicy.js
|   |   `-- ipc/
|   |       |-- channels.js
|   |       |-- authIpc.js
|   |       |-- classIpc.js
|   |       |-- attendanceIpc.js
|   |       |-- gradebookIpc.js
|   |       |-- postingIpc.js
|   |       |-- importIpc.js
|   |       |-- exportIpc.js
|   |       |-- syncIpc.js
|   |       |-- storageIpc.js
|   |       |-- auditIpc.js
|   |       |-- notificationIpc.js
|   |       `-- appStateIpc.js
|   |
|   |-- preload/
|   |   |-- index.js
|   |   |-- bridge/
|   |   |   |-- authBridge.js
|   |   |   |-- classBridge.js
|   |   |   |-- attendanceBridge.js
|   |   |   |-- gradebookBridge.js
|   |   |   |-- postingBridge.js
|   |   |   |-- importBridge.js
|   |   |   |-- exportBridge.js
|   |   |   |-- syncBridge.js
|   |   |   |-- auditBridge.js
|   |   |   |-- notificationBridge.js
|   |   |   `-- appStateBridge.js
|   |   `-- validators/
|   |       |-- payloadValidator.js
|   |       `-- channelGuard.js
|   |
|   `-- shared/
|       |-- constants/
|       |   |-- ipcChannels.js
|       |   |-- roles.js
|       |   |-- gradeStatus.js
|       |   `-- syncStatus.js
|       `-- utils/
|           |-- logger.js
|           |-- errorNormalizer.js
|           `-- timestamp.js
|
|-- src/
|   |-- main.jsx
|   |-- App.jsx
|   |-- App.module.css
|   |
|   |-- assets/
|   |   |-- icons/
|   |   |-- images/
|   |   |   |-- app-logo.png
|   |   |   |-- teacher-avatar-placeholder.png
|   |   |   `-- empty-gradebook.png
|   |   `-- animation/
|   |       |-- sync-success.json
|   |       |-- draft-save.json
|   |       |-- post-success.json
|   |       `-- no-data.json
|   |
|   |-- config/
|   |   |-- env.js
|   |   |-- supabase.js
|   |   |-- navigation.js
|   |   |-- breakpoints.js
|   |   |-- responsiveRules.js
|   |   |-- gradingRules.js
|   |   |-- postingRules.js
|   |   `-- exportPresets.js
|   |
|   |-- context/
|   |   |-- AuthContext.jsx
|   |   |-- ToastContext.jsx
|   |   |-- OfflineQueueContext.jsx
|   |   `-- RealtimeContext.jsx
|   |
|   |-- components/
|   |   |-- ui/
|   |   |   |-- Button.jsx
|   |   |   |-- Button.module.css
|   |   |   |-- Card.jsx
|   |   |   |-- Card.module.css
|   |   |   |-- Input.jsx
|   |   |   |-- Input.module.css
|   |   |   |-- Select.jsx
|   |   |   |-- Select.module.css
|   |   |   |-- Modal.jsx
|   |   |   |-- Modal.module.css
|   |   |   |-- Badge.jsx
|   |   |   |-- Badge.module.css
|   |   |   |-- Toast.jsx
|   |   |   `-- Toast.module.css
|   |   |
|   |   |-- layout/
|   |   |   |-- DesktopHeader.jsx
|   |   |   |-- DesktopHeader.module.css
|   |   |   |-- TeacherSidebar.jsx
|   |   |   |-- TeacherSidebar.module.css
|   |   |   |-- SidebarNavGroup.jsx
|   |   |   |-- SidebarNavGroup.module.css
|   |   |   |-- SidebarNavItem.jsx
|   |   |   |-- SidebarNavItem.module.css
|   |   |   |-- ResponsiveShell.jsx
|   |   |   |-- ResponsiveShell.module.css
|   |   |   |-- ResponsiveSidebarDrawer.jsx
|   |   |   `-- ResponsiveSidebarDrawer.module.css
|   |   |
|   |   |-- feedback/
|   |   |   |-- InlineAlert.jsx
|   |   |   |-- InlineAlert.module.css
|   |   |   |-- OfflineBanner.jsx
|   |   |   |-- OfflineBanner.module.css
|   |   |   |-- SaveStatusChip.jsx
|   |   |   `-- SaveStatusChip.module.css
|   |   |
|   |   `-- animation/
|   |       |-- FadeInPanel.jsx
|   |       |-- FadeInPanel.module.css
|   |       |-- StaggeredRows.jsx
|   |       |-- StaggeredRows.module.css
|   |       |-- PulseHighlight.jsx
|   |       `-- PulseHighlight.module.css
|   |
|   |-- hooks/
|   |   |-- useAuthSession.js
|   |   |-- useClassContext.js
|   |   |-- useOfflineSync.js
|   |   |-- useRealtimeDrafts.js
|   |   |-- useGradeValidation.js
|   |   |-- useFormulaTrace.js
|   |   |-- useExportPreview.js
|   |   |-- useBreakpoint.js
|   |   |-- useViewport.js
|   |   |-- useResponsiveTable.js
|   |   `-- useToast.js
|   |
|   |-- animation/
|   |   |-- motionTokens.js
|   |   |-- easing.js
|   |   |-- transitions.js
|   |   |-- useReducedMotion.js
|   |   |-- useShimmerPulse.js
|   |   `-- useStaggerIn.js
|   |
|   |-- navigation/
|   |   |-- TeacherDesktopNavigator.jsx
|   |   |-- TeacherDesktopNavigator.module.css
|   |   |-- TeacherRouteConfig.js
|   |   `-- routeKeys.js
|   |
|   |-- services/
|   |   |-- core/
|   |   |   |-- apiClient.js
|   |   |   |-- realtimeService.js
|   |   |   |-- offlineQueueService.js
|   |   |   |-- syncService.js
|   |   |   |-- connectivityService.js
|   |   |   |-- localCacheService.js
|   |   |   |-- auditLogService.js
|   |   |   |-- storageService.js
|   |   |   `-- uploadService.js
|   |   |
|   |   |-- grading/
|   |   |   |-- formulaEngineService.js
|   |   |   |-- equivalentLookupService.js
|   |   |   |-- attendanceRuleService.js
|   |   |   |-- drpFaRuleService.js
|   |   |   `-- rankingService.js
|   |   |
|   |   `-- exports/
|   |       |-- pdfExportService.js
|   |       |-- xlsxExportService.js
|   |       `-- printService.js
|   |
|   |-- state/
|   |   |-- classStore.js
|   |   |-- attendanceStore.js
|   |   |-- gradebookStore.js
|   |   |-- postingStore.js
|   |   |-- syncStore.js
|   |   `-- notificationStore.js
|   |
|   |-- features/
|   |   |-- Dashboard/
|   |   |   |-- components/
|   |   |   |   |-- DeadlineReminderCard.jsx
|   |   |   |   |-- DeadlineReminderCard.module.css
|   |   |   |   |-- DraftCountCard.jsx
|   |   |   |   |-- DraftCountCard.module.css
|   |   |   |   |-- TodayClassesCard.jsx
|   |   |   |   `-- TodayClassesCard.module.css
|   |   |   |-- services/
|   |   |   |   `-- dashboardService.js
|   |   |   |-- DashboardPage.jsx
|   |   |   `-- DashboardPage.module.css
|   |   |
|   |   |-- MyClasses/
|   |   |   |-- components/
|   |   |   |   |-- ClassCard.jsx
|   |   |   |   |-- ClassCard.module.css
|   |   |   |   |-- ClassFilterBar.jsx
|   |   |   |   `-- ClassFilterBar.module.css
|   |   |   |-- services/
|   |   |   |   `-- myClassesService.js
|   |   |   |-- MyClassesPage.jsx
|   |   |   `-- MyClassesPage.module.css
|   |   |
|   |   |-- ClassRoster/
|   |   |   |-- components/
|   |   |   |   |-- EnrollmentChangeLog.jsx
|   |   |   |   |-- EnrollmentChangeLog.module.css
|   |   |   |   |-- RosterTable.jsx
|   |   |   |   `-- RosterTable.module.css
|   |   |   |-- services/
|   |   |   |   `-- classRosterService.js
|   |   |   |-- ClassRosterPage.jsx
|   |   |   `-- ClassRosterPage.module.css
|   |   |
|   |   |-- ClasslistImport/
|   |   |   |-- components/
|   |   |   |   |-- ImportDropzone.jsx
|   |   |   |   |-- ImportDropzone.module.css
|   |   |   |   |-- ImportPreviewTable.jsx
|   |   |   |   |-- ImportPreviewTable.module.css
|   |   |   |   |-- ImportHistoryTable.jsx
|   |   |   |   `-- ImportHistoryTable.module.css
|   |   |   |-- services/
|   |   |   |   `-- classlistImportService.js
|   |   |   |-- ClasslistImportPage.jsx
|   |   |   `-- ClasslistImportPage.module.css
|   |   |
|   |   |-- Attendance/
|   |   |   |-- components/
|   |   |   |   |-- AttendanceEncoderGrid.jsx
|   |   |   |   |-- AttendanceEncoderGrid.module.css
|   |   |   |   |-- AttendanceSummaryPanel.jsx
|   |   |   |   `-- AttendanceSummaryPanel.module.css
|   |   |   |-- services/
|   |   |   |   `-- attendanceService.js
|   |   |   |-- AttendancePage.jsx
|   |   |   `-- AttendancePage.module.css
|   |   |
|   |   |-- Gradebook/
|   |   |   |-- GradingSettings/
|   |   |   |   |-- components/
|   |   |   |   |   |-- ClassTypeSelector.jsx
|   |   |   |   |   |-- ClassTypeSelector.module.css
|   |   |   |   |   |-- MetadataForm.jsx
|   |   |   |   |   |-- MetadataForm.module.css
|   |   |   |   |   |-- WeightProfileEditor.jsx
|   |   |   |   |   `-- WeightProfileEditor.module.css
|   |   |   |   |-- services/
|   |   |   |   |   `-- gradingSettingsService.js
|   |   |   |   |-- GradingSettingsPage.jsx
|   |   |   |   `-- GradingSettingsPage.module.css
|   |   |   |
|   |   |   |-- ComponentScores/
|   |   |   |   |-- components/
|   |   |   |   |   |-- ActivityScoresTable.jsx
|   |   |   |   |   |-- ActivityScoresTable.module.css
|   |   |   |   |   |-- ExamScoresPanel.jsx
|   |   |   |   |   |-- ExamScoresPanel.module.css
|   |   |   |   |   |-- QuizScoresTable.jsx
|   |   |   |   |   `-- QuizScoresTable.module.css
|   |   |   |   |-- services/
|   |   |   |   |   `-- componentScoresService.js
|   |   |   |   |-- ComponentScoresPage.jsx
|   |   |   |   `-- ComponentScoresPage.module.css
|   |   |   |
|   |   |   |-- MidtermComputation/
|   |   |   |   |-- components/
|   |   |   |   |   |-- MidtermBreakdownPanel.jsx
|   |   |   |   |   `-- MidtermBreakdownPanel.module.css
|   |   |   |   |-- services/
|   |   |   |   |   `-- midtermComputationService.js
|   |   |   |   |-- MidtermComputationPage.jsx
|   |   |   |   `-- MidtermComputationPage.module.css
|   |   |   |
|   |   |   |-- FinalTermComputation/
|   |   |   |   |-- components/
|   |   |   |   |   |-- FinalTermBreakdownPanel.jsx
|   |   |   |   |   `-- FinalTermBreakdownPanel.module.css
|   |   |   |   |-- services/
|   |   |   |   |   `-- finalTermComputationService.js
|   |   |   |   |-- FinalTermComputationPage.jsx
|   |   |   |   `-- FinalTermComputationPage.module.css
|   |   |   |
|   |   |   |-- FinalGradeView/
|   |   |   |   |-- components/
|   |   |   |   |   |-- FinalGradeTable.jsx
|   |   |   |   |   |-- FinalGradeTable.module.css
|   |   |   |   |   |-- RemarksLegend.jsx
|   |   |   |   |   `-- RemarksLegend.module.css
|   |   |   |   |-- services/
|   |   |   |   |   `-- finalGradeViewService.js
|   |   |   |   |-- FinalGradeViewPage.jsx
|   |   |   |   `-- FinalGradeViewPage.module.css
|   |   |   |
|   |   |   `-- FormulaTrace/
|   |   |       |-- components/
|   |   |       |   |-- FormulaTraceTable.jsx
|   |   |       |   `-- FormulaTraceTable.module.css
|   |   |       |-- services/
|   |   |       |   `-- formulaTraceService.js
|   |   |       |-- FormulaTracePage.jsx
|   |   |       `-- FormulaTracePage.module.css
|   |   |
|   |   |-- GradePosting/
|   |   |   |-- components/
|   |   |   |   |-- DraftRecordsTable.jsx
|   |   |   |   |-- DraftRecordsTable.module.css
|   |   |   |   |-- PostConfirmDialog.jsx
|   |   |   |   |-- PostConfirmDialog.module.css
|   |   |   |   |-- PostedRecordsTable.jsx
|   |   |   |   |-- PostedRecordsTable.module.css
|   |   |   |   |-- ReopenRequestsTable.jsx
|   |   |   |   `-- ReopenRequestsTable.module.css
|   |   |   |-- services/
|   |   |   |   |-- gradePostingService.js
|   |   |   |   `-- reopenRequestService.js
|   |   |   |-- GradePostingPage.jsx
|   |   |   `-- GradePostingPage.module.css
|   |   |
|   |   |-- SubmissionCenter/
|   |   |   |-- components/
|   |   |   |   |-- EndTermSubmissionPanel.jsx
|   |   |   |   |-- EndTermSubmissionPanel.module.css
|   |   |   |   |-- SubmissionHistoryTable.jsx
|   |   |   |   `-- SubmissionHistoryTable.module.css
|   |   |   |-- services/
|   |   |   |   `-- submissionCenterService.js
|   |   |   |-- SubmissionCenterPage.jsx
|   |   |   `-- SubmissionCenterPage.module.css
|   |   |
|   |   |-- Notifications/
|   |   |   |-- components/
|   |   |   |   |-- NotificationFilters.jsx
|   |   |   |   |-- NotificationFilters.module.css
|   |   |   |   |-- NotificationList.jsx
|   |   |   |   `-- NotificationList.module.css
|   |   |   |-- services/
|   |   |   |   `-- teacherNotificationService.js
|   |   |   |-- NotificationsPage.jsx
|   |   |   `-- NotificationsPage.module.css
|   |   |
|   |   |-- ReportsExports/
|   |   |   |-- ClassGradeSheetExport/
|   |   |   |   |-- components/
|   |   |   |   |   |-- GradeSheetExportOptions.jsx
|   |   |   |   |   `-- GradeSheetExportOptions.module.css
|   |   |   |   |-- services/
|   |   |   |   |   `-- classGradeSheetExportService.js
|   |   |   |   |-- ClassGradeSheetExportPage.jsx
|   |   |   |   `-- ClassGradeSheetExportPage.module.css
|   |   |   |
|   |   |   |-- AttendanceReportExport/
|   |   |   |   |-- components/
|   |   |   |   |   |-- AttendanceExportOptions.jsx
|   |   |   |   |   `-- AttendanceExportOptions.module.css
|   |   |   |   |-- services/
|   |   |   |   |   `-- attendanceReportExportService.js
|   |   |   |   |-- AttendanceReportExportPage.jsx
|   |   |   |   `-- AttendanceReportExportPage.module.css
|   |   |   |
|   |   |   `-- SubmissionSummaryExport/
|   |   |       |-- components/
|   |   |       |   |-- SubmissionSummaryExportOptions.jsx
|   |   |       |   `-- SubmissionSummaryExportOptions.module.css
|   |   |       |-- services/
|   |   |       |   `-- submissionSummaryExportService.js
|   |   |       |-- SubmissionSummaryExportPage.jsx
|   |   |       `-- SubmissionSummaryExportPage.module.css
|   |   |
|   |   `-- Profile/
|   |       |-- components/
|   |       |   |-- ChangePasswordForm.jsx
|   |       |   |-- ChangePasswordForm.module.css
|   |       |   |-- ProfileInfoForm.jsx
|   |       |   |-- ProfileInfoForm.module.css
|   |       |   |-- SecuritySettingsPanel.jsx
|   |       |   `-- SecuritySettingsPanel.module.css
|   |       |-- services/
|   |       |   `-- teacherProfileService.js
|   |       |-- ProfilePage.jsx
|   |       `-- ProfilePage.module.css
|   |
|   |-- AuthSession/
|   |   |-- components/
|   |   |   |-- LogoutConfirmDialog.jsx
|   |   |   `-- LogoutConfirmDialog.module.css
|   |   |-- services/
|   |   |   `-- authSessionService.js
|   |   |-- LogoutPage.jsx
|   |   `-- LogoutPage.module.css
|   |
|   |-- styles/
|   |   |-- colors.css
|   |   |-- breakpoints.css
|   |   |-- responsive.css
|   |   |-- spacing.css
|   |   |-- typography.css
|   |   |-- shadows.css
|   |   |-- animations.css
|   |   `-- zIndex.css
|   |
|   |-- utils/
|   |   |-- constants.js
|   |   |-- formatters.js
|   |   |-- gradeMath.js
|   |   |-- attendanceMath.js
|   |   |-- exportUtils.js
|   |   |-- validators.js
|   |   `-- workbookMapping.js
|   |
|   `-- tests/
|       |-- unit/
|       |-- integration/
|       `-- e2e/
|
`-- docs/
    |-- Architecture.md
    |-- Offline-Sync-Policy.md
    |-- Grade-Formula-Mapping.md
    `-- Release-Checklist.md
```

## 2. Core Coverage Included

1. Full Teacher sidebar module coverage
2. Classlist import workflow for roster bootstrap
3. Grading settings and formula-trace pipeline
4. Attendance, component, midterm, final-term, and final-grade flow
5. Draft-to-posted lifecycle and student visibility gate
6. Offline encoding with sync queue and reconnect strategy
7. PDF/XLSX report and export slices
8. Electron main, preload, IPC, and local encrypted storage boundaries
9. Reopen requests, audit trail, and secure logout flow
10. Responsive layout strategy for compact to full desktop windows
11. Animation layer for premium but functional desktop UX
