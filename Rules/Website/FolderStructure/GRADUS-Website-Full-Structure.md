# GRADUS Website Full Folder Structure (Visualization Only)

This is the full proposed website folder structure using Feature-Based Modular Architecture and Vertical Slice Architecture.

## 1. Full Structure Tree

```text
website-app/
|-- app/
|   |-- globals.css
|   |-- layout.jsx
|   |-- layout.module.css
|   |-- page.jsx
|   |
|   |-- (public)/
|   |   |-- layout.jsx
|   |   |-- layout.module.css
|   |   |
|   |   |-- (landing)/
|   |   |   |-- page.jsx
|   |   |   |-- page.module.css
|   |   |   |-- hero/
|   |   |   |   |-- components/
|   |   |   |   |   |-- HeroActions.jsx
|   |   |   |   |   |-- HeroHeadline.jsx
|   |   |   |   |   `-- HeroPreview.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- heroContentService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- platform-access/
|   |   |   |   |-- components/
|   |   |   |   |   |-- AccessCard.jsx
|   |   |   |   |   |-- AccessCardList.jsx
|   |   |   |   |   `-- StatusBadge.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- platformAccessService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- workflow-timeline/
|   |   |   |   |-- components/
|   |   |   |   |   |-- TimelineItem.jsx
|   |   |   |   |   `-- TimelineTrack.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- workflowTimelineService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- modules-showcase/
|   |   |   |   |-- components/
|   |   |   |   |   |-- ModulePanel.jsx
|   |   |   |   |   |-- ModuleTabs.jsx
|   |   |   |   |   `-- ModuleVisual.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- moduleShowcaseService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- role-experience/
|   |   |   |   |-- components/
|   |   |   |   |   |-- RoleCapabilities.jsx
|   |   |   |   |   |-- RoleSwitch.jsx
|   |   |   |   |   `-- RoleSummary.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- roleExperienceService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- public-achievers/
|   |   |   |   |-- components/
|   |   |   |   |   |-- AchieverCard.jsx
|   |   |   |   |   |-- AchieverFilters.jsx
|   |   |   |   |   |-- AchieverLeaderboard.jsx
|   |   |   |   |   `-- RankingCriteriaLink.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- publicAchieversService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- trust-governance/
|   |   |   |   |-- components/
|   |   |   |   |   |-- GovernanceCard.jsx
|   |   |   |   |   `-- TrustHighlights.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- trustGovernanceService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- testimonials/
|   |   |   |   |-- components/
|   |   |   |   |   |-- TestimonialCard.jsx
|   |   |   |   |   `-- TestimonialList.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- testimonialService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   |-- faq/
|   |   |   |   |-- components/
|   |   |   |   |   |-- FaqAccordion.jsx
|   |   |   |   |   `-- FaqItem.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- faqService.js
|   |   |   |   |-- section.jsx
|   |   |   |   `-- section.module.css
|   |   |   |
|   |   |   `-- final-cta/
|   |   |       |-- components/
|   |   |       |   |-- FinalCtaActions.jsx
|   |   |       |   `-- FinalCtaBand.jsx
|   |   |       |-- services/
|   |   |       |   `-- finalCtaService.js
|   |   |       |-- section.jsx
|   |   |       `-- section.module.css
|   |   |
|   |   |-- downloads/
|   |   |   |-- components/
|   |   |   |   |-- DesktopDownloadCard.jsx
|   |   |   |   |-- MobileDownloadCard.jsx
|   |   |   |   `-- WebAccessCard.jsx
|   |   |   |-- services/
|   |   |   |   `-- downloadsService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- contact/
|   |   |   |-- components/
|   |   |   |   |-- ContactForm.jsx
|   |   |   |   `-- ContactInfoCard.jsx
|   |   |   |-- services/
|   |   |   |   `-- contactService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   `-- legal/
|   |       |-- privacy/
|   |       |   |-- page.jsx
|   |       |   `-- page.module.css
|   |       `-- terms/
|   |           |-- page.jsx
|   |           `-- page.module.css
|   |
|   |-- (auth)/
|   |   |-- layout.jsx
|   |   |-- layout.module.css
|   |   |-- login/
|   |   |   |-- components/
|   |   |   |   |-- LoginForm.jsx
|   |   |   |   `-- LoginPanel.jsx
|   |   |   |-- services/
|   |   |   |   `-- authService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |-- forgot-password/
|   |   |   |-- components/
|   |   |   |   `-- ForgotPasswordForm.jsx
|   |   |   |-- services/
|   |   |   |   `-- forgotPasswordService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   `-- reset-password/
|   |       |-- components/
|   |       |   `-- ResetPasswordForm.jsx
|   |       |-- services/
|   |       |   `-- resetPasswordService.js
|   |       |-- page.jsx
|   |       `-- page.module.css
|   |
|   |-- (admin)/
|   |   |-- layout.jsx
|   |   |-- layout.module.css
|   |   |
|   |   |-- dashboard/
|   |   |   |-- components/
|   |   |   |   |-- AdminKpiCards.jsx
|   |   |   |   |-- QueueSummary.jsx
|   |   |   |   `-- UrgentActions.jsx
|   |   |   |-- services/
|   |   |   |   `-- adminDashboardService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- students/
|   |   |   |-- components/
|   |   |   |   |-- StudentFilterBar.jsx
|   |   |   |   `-- StudentList.jsx
|   |   |   |-- services/
|   |   |   |   `-- studentAdminService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- enrollment/
|   |   |   |-- loi/
|   |   |   |   |-- components/
|   |   |   |   |   |-- LoiDecisionForm.jsx
|   |   |   |   |   `-- LoiQueueTable.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- loiService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- irregular-plans/
|   |   |   |   |-- components/
|   |   |   |   |   |-- IrregularPlanDecisionForm.jsx
|   |   |   |   |   `-- IrregularPlanQueueTable.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- irregularPlanService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- class-offerings/
|   |   |       |-- components/
|   |   |       |   |-- ClassOfferingList.jsx
|   |   |       |   `-- ClassOfferingFilters.jsx
|   |   |       |-- services/
|   |   |       |   `-- classOfferingService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- program-schedules/
|   |   |   |-- sections/
|   |   |   |   |-- components/
|   |   |   |   |   |-- SectionScheduleGrid.jsx
|   |   |   |   |   `-- SectionScheduleFilters.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- sectionScheduleService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- teachers/
|   |   |   |   |-- components/
|   |   |   |   |   |-- TeacherScheduleGrid.jsx
|   |   |   |   |   `-- TeacherScheduleFilters.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- teacherScheduleService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- venues/
|   |   |       |-- components/
|   |   |       |   |-- VenueScheduleGrid.jsx
|   |   |       |   `-- VenueScheduleFilters.jsx
|   |   |       |-- services/
|   |   |       |   `-- venueScheduleService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- grade-oversight/
|   |   |   |-- components/
|   |   |   |   |-- GradePostingMonitor.jsx
|   |   |   |   `-- SubmissionHealth.jsx
|   |   |   |-- services/
|   |   |   |   `-- gradeOversightService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- reports/
|   |   |   |-- components/
|   |   |   |   |-- ProgramReportFilters.jsx
|   |   |   |   |-- ProgramReportTable.jsx
|   |   |   |   `-- ProgramReportExport.jsx
|   |   |   |-- services/
|   |   |   |   `-- adminReportService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- notifications/
|   |   |   |-- components/
|   |   |   |   `-- NotificationFeed.jsx
|   |   |   |-- services/
|   |   |   |   `-- adminNotificationService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   `-- profile/
|   |       |-- components/
|   |       |   |-- ChangePasswordForm.jsx
|   |       |   `-- ProfileForm.jsx
|   |       |-- services/
|   |       |   `-- adminProfileService.js
|   |       |-- page.jsx
|   |       `-- page.module.css
|   |
|   |-- (super-admin)/
|   |   |-- layout.jsx
|   |   |-- layout.module.css
|   |   |
|   |   |-- dashboard/
|   |   |   |-- components/
|   |   |   |   |-- ActiveTermBanner.jsx
|   |   |   |   |-- GlobalKpiCards.jsx
|   |   |   |   |-- IssueRadar.jsx
|   |   |   |   `-- QuickActions.jsx
|   |   |   |-- services/
|   |   |   |   `-- superAdminDashboardService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- academic-terms/
|   |   |   |-- components/
|   |   |   |   |-- DeleteTermDialog.jsx
|   |   |   |   |-- TermForm.jsx
|   |   |   |   |-- TermList.jsx
|   |   |   |   `-- TermStatusBadge.jsx
|   |   |   |-- services/
|   |   |   |   `-- termService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- curriculum/
|   |   |   |-- page.jsx
|   |   |   |-- page.module.css
|   |   |   |-- programs/
|   |   |   |   |-- components/
|   |   |   |   |   |-- ProgramForm.jsx
|   |   |   |   |   `-- ProgramList.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- programService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- subjects/
|   |   |   |   |-- components/
|   |   |   |   |   |-- DeleteSubjectDialog.jsx
|   |   |   |   |   |-- PrerequisiteSelector.jsx
|   |   |   |   |   |-- SubjectColorPicker.jsx
|   |   |   |   |   |-- SubjectForm.jsx
|   |   |   |   |   |-- SubjectList.jsx
|   |   |   |   |   `-- SubjectTypeTag.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- subjectService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- versions/
|   |   |       |-- components/
|   |   |       |   |-- DeleteVersionDialog.jsx
|   |   |       |   |-- VersionForm.jsx
|   |   |       |   `-- VersionList.jsx
|   |   |       |-- services/
|   |   |       |   `-- versionService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- sections/
|   |   |   |-- components/
|   |   |   |   |-- SectionFilterBar.jsx
|   |   |   |   |-- SectionForm.jsx
|   |   |   |   `-- SectionList.jsx
|   |   |   |-- services/
|   |   |   |   `-- sectionService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- teachers/
|   |   |   |-- page.jsx
|   |   |   |-- page.module.css
|   |   |   |-- list/
|   |   |   |   |-- components/
|   |   |   |   |   |-- DeleteTeacherDialog.jsx
|   |   |   |   |   |-- TeacherForm.jsx
|   |   |   |   |   `-- TeacherList.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- teacherService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- availability/
|   |   |   |   |-- components/
|   |   |   |   |   |-- AvailabilityForm.jsx
|   |   |   |   |   |-- AvailabilityGrid.jsx
|   |   |   |   |   `-- BulkAvailabilityForm.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- availabilityService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- subject-assignments/
|   |   |       |-- components/
|   |   |       |   |-- AssignmentForm.jsx
|   |   |       |   `-- AssignmentList.jsx
|   |   |       |-- services/
|   |   |       |   `-- assignmentService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- rooms-venues/
|   |   |   |-- components/
|   |   |   |   |-- VenueCard.jsx
|   |   |   |   |-- VenueForm.jsx
|   |   |   |   |-- VenueList.jsx
|   |   |   |   `-- VenueTypeTag.jsx
|   |   |   |-- services/
|   |   |   |   `-- venueService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- scheduling/
|   |   |   |-- page.jsx
|   |   |   |-- page.module.css
|   |   |   |-- setup/
|   |   |   |   |-- components/
|   |   |   |   |   |-- RegenerationModeSelector.jsx
|   |   |   |   |   |-- ScopeSelector.jsx
|   |   |   |   |   `-- SetupForm.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- setupService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- generate/
|   |   |   |   |-- components/
|   |   |   |   |   |-- GeneratePanel.jsx
|   |   |   |   |   |-- GenerationProgress.jsx
|   |   |   |   |   `-- GenerationSummary.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- generateService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- manage/
|   |   |   |   |-- components/
|   |   |   |   |   |-- ManualSubjectPool.jsx
|   |   |   |   |   |-- ScheduleBlock.jsx
|   |   |   |   |   |-- ScheduleBulkDeleteModal.jsx
|   |   |   |   |   |-- ScheduleEditModal.jsx
|   |   |   |   |   |-- ScheduleFilterBar.jsx
|   |   |   |   |   `-- ScheduleTable.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- manageService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- conflicts/
|   |   |   |   |-- components/
|   |   |   |   |   |-- ConflictCard.jsx
|   |   |   |   |   |-- ConflictList.jsx
|   |   |   |   |   `-- ConflictTypeTag.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- conflictService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- publish/
|   |   |   |   |-- components/
|   |   |   |   |   |-- PublishConfirmDialog.jsx
|   |   |   |   |   `-- PublishSummary.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- publishService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- history/
|   |   |       |-- components/
|   |   |       |   |-- PublicationHistoryList.jsx
|   |   |       |   `-- RollbackDialog.jsx
|   |   |       |-- services/
|   |   |       |   `-- historyService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- grade-oversight/
|   |   |   |-- posting-compliance/
|   |   |   |   |-- components/
|   |   |   |   |   `-- PostingComplianceBoard.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- postingComplianceService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- grade-status/
|   |   |   |   |-- components/
|   |   |   |   |   `-- GradeStatusMonitor.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- gradeStatusService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- sync-health/
|   |   |       |-- components/
|   |   |       |   `-- GradeSyncHealthPanel.jsx
|   |   |       |-- services/
|   |   |       |   `-- syncHealthService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- reports/
|   |   |   |-- page.jsx
|   |   |   |-- page.module.css
|   |   |   |-- section-schedules/
|   |   |   |   |-- components/
|   |   |   |   |   `-- SectionScheduleReportTable.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- sectionScheduleReportService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- teacher-schedules/
|   |   |   |   |-- components/
|   |   |   |   |   `-- TeacherScheduleReportTable.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- teacherScheduleReportService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- room-venue-schedules/
|   |   |   |   |-- components/
|   |   |   |   |   `-- VenueScheduleReportTable.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- venueScheduleReportService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- print-export/
|   |   |       |-- components/
|   |   |       |   |-- ExportOptions.jsx
|   |   |       |   |-- PrintPreview.jsx
|   |   |       |   `-- PrintableScheduleTemplate.jsx
|   |   |       |-- services/
|   |   |       |   `-- exportService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- user-role-management/
|   |   |   |-- page.jsx
|   |   |   |-- page.module.css
|   |   |   |-- admins/
|   |   |   |   |-- components/
|   |   |   |   |   `-- AdminAccountList.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- adminAccountService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- teachers/
|   |   |   |   |-- components/
|   |   |   |   |   `-- TeacherAccountList.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- teacherAccountService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   |-- students/
|   |   |   |   |-- components/
|   |   |   |   |   `-- StudentAccountList.jsx
|   |   |   |   |-- services/
|   |   |   |   |   `-- studentAccountService.js
|   |   |   |   |-- page.jsx
|   |   |   |   `-- page.module.css
|   |   |   |
|   |   |   `-- access-policies/
|   |   |       |-- components/
|   |   |       |   `-- PolicyMatrix.jsx
|   |   |       |-- services/
|   |   |       |   `-- accessPolicyService.js
|   |   |       |-- page.jsx
|   |   |       `-- page.module.css
|   |   |
|   |   |-- audit-logs/
|   |   |   |-- components/
|   |   |   |   |-- AuditLogFilters.jsx
|   |   |   |   `-- AuditLogTable.jsx
|   |   |   |-- services/
|   |   |   |   `-- auditLogService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- system-settings/
|   |   |   |-- components/
|   |   |   |   |-- IntegrationSettingsForm.jsx
|   |   |   |   |-- NotificationSettingsForm.jsx
|   |   |   |   `-- PolicyTogglePanel.jsx
|   |   |   |-- services/
|   |   |   |   `-- systemSettingsService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   |-- notifications/
|   |   |   |-- components/
|   |   |   |   `-- SuperAdminNotificationFeed.jsx
|   |   |   |-- services/
|   |   |   |   `-- superAdminNotificationService.js
|   |   |   |-- page.jsx
|   |   |   `-- page.module.css
|   |   |
|   |   `-- profile/
|   |       |-- components/
|   |       |   |-- ChangePasswordForm.jsx
|   |       |   `-- ProfileForm.jsx
|   |       |-- services/
|   |       |   `-- superAdminProfileService.js
|   |       |-- page.jsx
|   |       `-- page.module.css
|   |
|   `-- api/
|       |-- auth/
|       |   |-- login/route.js
|       |   |-- logout/route.js
|       |   `-- verify-recaptcha/route.js
|       |
|       |-- public/
|       |   |-- achievers/route.js
|       |   |-- testimonials/route.js
|       |   |-- faqs/route.js
|       |   `-- contact/route.js
|       |
|       |-- admin/
|       |   |-- dashboard/route.js
|       |   |-- students/route.js
|       |   |-- enrollment/
|       |   |   |-- loi/route.js
|       |   |   |-- irregular-plans/route.js
|       |   |   `-- class-offerings/route.js
|       |   |-- program-schedules/
|       |   |   |-- section/route.js
|       |   |   |-- teacher/route.js
|       |   |   `-- venue/route.js
|       |   |-- grade-oversight/route.js
|       |   |-- reports/route.js
|       |   `-- profile/route.js
|       |
|       `-- super-admin/
|           |-- dashboard/route.js
|           |-- academic-terms/
|           |   |-- route.js
|           |   `-- [id]/route.js
|           |-- curriculum/
|           |   |-- programs/route.js
|           |   |-- subjects/route.js
|           |   `-- versions/route.js
|           |-- sections/
|           |   |-- route.js
|           |   `-- [id]/route.js
|           |-- teachers/
|           |   |-- route.js
|           |   |-- [id]/route.js
|           |   |-- availability/route.js
|           |   `-- assignments/route.js
|           |-- venues/
|           |   |-- route.js
|           |   `-- [id]/route.js
|           |-- scheduling/
|           |   |-- setup/route.js
|           |   |-- generate/route.js
|           |   |-- manage/route.js
|           |   |-- conflicts/route.js
|           |   |-- publish/route.js
|           |   `-- history/route.js
|           |-- grade-oversight/
|           |   |-- posting-compliance/route.js
|           |   |-- grade-status/route.js
|           |   `-- sync-health/route.js
|           |-- reports/
|           |   |-- section/route.js
|           |   |-- teacher/route.js
|           |   |-- venue/route.js
|           |   `-- export/route.js
|           |-- user-role-management/
|           |   |-- admins/route.js
|           |   |-- teachers/route.js
|           |   |-- students/route.js
|           |   `-- access-policies/route.js
|           |-- audit-logs/route.js
|           |-- system-settings/route.js
|           `-- profile/route.js
|
|-- components/
|   |-- layout/
|   |   |-- PublicHeader.jsx
|   |   |-- PublicFooter.jsx
|   |   |-- AdminHeader.jsx
|   |   |-- AdminSidebar.jsx
|   |   |-- SuperAdminHeader.jsx
|   |   |-- SuperAdminSidebar.jsx
|   |   `-- SidebarNavItem.jsx
|   |-- ui/
|   |   |-- Button.jsx
|   |   |-- Card.jsx
|   |   |-- Input.jsx
|   |   |-- Select.jsx
|   |   |-- Textarea.jsx
|   |   |-- Modal.jsx
|   |   |-- Badge.jsx
|   |   |-- Toast.jsx
|   |   |-- EmptyState.jsx
|   |   `-- LoadingSpinner.jsx
|   |-- shared/
|   |   |-- ConfirmDialog.jsx
|   |   |-- FilterBar.jsx
|   |   |-- PageHeader.jsx
|   |   |-- SectionTitle.jsx
|   |   `-- StatusBadge.jsx
|   |-- schedule/
|   |   |-- ScheduleGrid.jsx
|   |   |-- ScheduleBlock.jsx
|   |   |-- DayHeader.jsx
|   |   `-- TimeColumn.jsx
|   `-- charts/
|       |-- BarTrendChart.jsx
|       |-- DonutStatusChart.jsx
|       `-- HeatMapChart.jsx
|
|-- config/
|   |-- navigation.js
|   |-- site.js
|   |-- roles.js
|   |-- programs.js
|   |-- scheduleRules.js
|   `-- supabase.js
|
|-- hooks/
|   |-- useAuthSession.js
|   |-- usePagination.js
|   |-- useToast.js
|   |-- useTerms.js
|   |-- usePrograms.js
|   |-- useSubjects.js
|   |-- useSections.js
|   |-- useTeachers.js
|   |-- useVenues.js
|   `-- useScheduleEntries.js
|
|-- lib/
|   |-- supabaseClient.js
|   |-- supabaseAdmin.js
|   |-- auth/
|   |   |-- requireRole.js
|   |   `-- sessionGuard.js
|   |-- scheduling/
|   |   |-- engine.js
|   |   |-- conflictChecker.js
|   |   |-- loadBalancer.js
|   |   |-- patternResolver.js
|   |   |-- restrictions.js
|   |   |-- timeSlotUtils.js
|   |   |-- venueMapper.js
|   |   `-- generationCancellation.js
|   `-- export/
|       |-- pdfExporter.js
|       |-- xlsxExporter.js
|       `-- printTemplateBuilder.js
|
|-- public/
|   |-- icons/
|   |-- images/
|   |   |-- gradus-logo.png
|   |   |-- psu-logo.png
|   |   |-- landing-hero.jpg
|   |   `-- login-bg.jpg
|   |-- videos/
|   |   `-- landing-loop.mp4
|   `-- qr/
|       |-- android-install.png
|       `-- ios-install.png
|
|-- styles/
|   |-- animations.css
|   |-- colors.css
|   |-- spacing.css
|   |-- typography.css
|   `-- themes/
|       |-- public-theme.css
|       |-- admin-theme.css
|       `-- super-admin-theme.css
|
|-- types/
|   |-- auth.types.js
|   |-- schedule.types.js
|   |-- enrollment.types.js
|   |-- grading.types.js
|   `-- report.types.js
|
|-- utils/
|   |-- constants.js
|   |-- helpers.js
|   |-- formatters.js
|   |-- validators.js
|   |-- timeUtils.js
|   |-- exportUtils.js
|   |-- colorUtils.js
|   `-- uploadUtils.js
|
`-- tests/
    |-- unit/
    |-- integration/
    `-- e2e/
```

## 2. Implementation Notes

1. Keep route slices role-specific.
2. Keep shared logic in lib, hooks, utils, and shared components.
3. Keep super-admin and admin features separated to avoid permission leaks.
4. Keep public landing features isolated under (public)/(landing).
