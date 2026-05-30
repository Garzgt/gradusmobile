# GRADUS Website Architecture Rules

This document defines mandatory structure rules for the website implementation.

## 1. Core Architecture

1. Use Feature-Based Modular Architecture.
2. Use Vertical Slice Architecture per route and per domain feature.
3. Keep each feature self-contained.
4. Keep shared code only in shared folders.

## 2. Vertical Slice Rule

Every route feature must keep UI, data access, and feature logic together.

Minimum slice template:

```text
feature-name/
|-- components/
|-- services/
|-- page.jsx
`-- page.module.css
```

Expanded slice template when needed:

```text
feature-name/
|-- components/
|-- hooks/
|-- services/
|-- schemas/
|-- utils/
|-- constants/
|-- page.jsx
|-- page.module.css
`-- loading.jsx
```

## 3. Folder Boundaries

1. Route-specific components stay inside that route slice.
2. Reusable cross-feature components go to components/shared or components/ui.
3. Business engines and integrations go to lib.
4. Global styling tokens go to styles.
5. Reusable hooks go to hooks.
6. API route handlers stay in app/api.

## 4. Role Route Groups

Use route groups for role boundaries:

1. (public)
2. (auth)
3. (admin)
4. (super-admin)

Each role group has:

1. layout.jsx
2. layout.module.css
3. role feature slices

## 5. API Vertical Slices

API routes must mirror UI domain structure when possible.

Example:

```text
app/api/super-admin/scheduling/generate/route.js
app/(super-admin)/scheduling/generate/page.jsx
```

## 6. Naming Rules

1. Use kebab-case for folders.
2. Use PascalCase for React component files.
3. Use camelCase for utility and service files.
4. Use page.jsx and page.module.css per route view.
5. Use route.js for API handlers.

## 7. Styling Rules

1. Prefer CSS modules per feature and per component.
2. Keep globals.css minimal.
3. Keep design tokens in styles/colors.css, styles/spacing.css, styles/fonts.css.
4. Avoid large monolithic style files.

## 8. Shared Component Rules

1. components/ui only for primitive reusable controls.
2. components/shared only for reusable composites.
3. components/layout only for shell and navigation.
4. Do not put feature-specific logic in shared UI components.

## 9. Service Rules

1. services files should be feature-scoped first.
2. Shared API clients stay in lib.
3. Keep one service file per feature context when practical.
4. Keep service methods named by business intent.

## 10. Testing Placement

Recommended test layers:

1. tests/unit
2. tests/integration
3. tests/e2e

Feature-specific test files can stay near feature slices when needed.

## 11. Allowed Exceptions

1. Complex scheduling engine logic can stay in lib/scheduling.
2. Export utilities can stay in utils when reused by many slices.
3. Shared constants can stay in config and utils/constants.js.

## 12. Non-Negotiable Guardrails

1. No giant route files mixing unrelated features.
2. No cross-role imports that bypass role boundaries.
3. No direct API calls scattered across UI components.
4. No duplicate business logic across admin and super-admin slices.

## 13. GRADUS Stack Compatibility

1. Framework compatibility
- Structure is aligned to Next.js App Router using app/* route groups and page.jsx files.

2. API compatibility
- API handlers must stay in app/api/* with route.js files.

3. Supabase compatibility
- Server/API code uses lib/supabaseAdmin.js only.
- Client-side UI code uses lib/supabaseClient.js only.

4. Styling compatibility
- CSS Modules are the default styling approach per feature slice.
- Keep primary palette values as hardcoded hex values in CSS modules/components.

5. Business logic compatibility
- Deterministic policy logic stays in lib/scheduling/* and feature services.
- Do not introduce ML-based decisions for scheduling, standing, or recognition.

6. Realtime compatibility
- Realtime-dependent features should subscribe only to approved role-allowed data states.
