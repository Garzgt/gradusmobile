# Super Admin Removal Plan (Phase 1)

## Why
The updated flow removes LOI and irregular plan oversight from Gradus. Enrollment approvals and classlist creation are no longer managed inside the Super Admin dashboard. Teachers import classlists via Excel, and official lists are sourced outside the app.

## Remove from navigation
- Remove the Enrollment Oversight group and its children (LOI Monitoring, Irregular Plan Monitoring, Escalations and Overrides, Capacity Watch) in [config/navigation.js](config/navigation.js).

## Remove from the Super Admin dashboard
- Quick action for LOI review in [app/(super-admin)/super-admin/dashboard/components/QuickActions.jsx](app/(super-admin)/super-admin/dashboard/components/QuickActions.jsx).
- "Pending LOIs" KPI card in [app/(super-admin)/super-admin/dashboard/components/GlobalKpiCards.jsx](app/(super-admin)/super-admin/dashboard/components/GlobalKpiCards.jsx).
- "LOI backlog" and "Irregular plan queue" checks in [app/(super-admin)/super-admin/dashboard/components/IssueRadar.jsx](app/(super-admin)/super-admin/dashboard/components/IssueRadar.jsx).
- LOI and irregular plan queries and payload fields in [app/(super-admin)/super-admin/dashboard/services/superAdminDashboardService.js](app/(super-admin)/super-admin/dashboard/services/superAdminDashboardService.js).

## Enrollment Oversight removal (completed)
- Enrollment Oversight UI routes removed from the Super Admin app.
- Enrollment Oversight API routes removed from the super-admin API surface.

## Optional cleanup
- If nothing else depends on LOI or irregular plan data, deprecate related tables and policies outside the UI layer.
