# GRADUS Student App Architecture Rules

This defines the architecture rules for the student mobile app.

## 1. Core Pattern

1. Feature-Based Modular Architecture is required.
2. Vertical Slice Architecture per screen feature is required.
3. Keep UI, services, and feature styles inside each feature folder.

## 2. Feature Slice Rule

Minimum feature slice:

```text
FeatureName/
|-- components/
|-- services/
|-- FeatureScreen.jsx
`-- FeatureScreen.styles.js
```

## 3. Shared Code Rule

1. Shared primitives go to src/components.
2. Reusable animation wrappers go to src/components/animated.
3. Cross-feature services go to src/services/core.
4. Global style tokens go to src/styles.
5. Utilities go to src/utils.

## 4. Student Policy Rule Integration

Architecture must support:
1. posted-grades-only visibility
2. published-schedule gate for advising form generation
3. irregular no-advance-subject enforcement
4. PSU evaluation scan and eligibility mapping
5. advising form download and print flow

## 5. Data Access Rule

1. Keep Supabase config centralized in src/config/supabase.js.
2. Keep auth/session handling in core services and context.
3. Feature screens should not duplicate low-level network code.

## 6. Navigation Rule

1. Keep Auth and Student app flows separated via navigators.
2. Use stack nesting for Enrollment and Grades flows.
3. Keep route names centralized in src/config/routes.js.

## 7. Responsive Layout Rule

1. Student screens must adapt across small phones, large phones, and tablets.
2. Keep breakpoint and layout-profile tokens centralized in shared config or styles.
3. Respect safe-area insets and orientation changes in all primary flows.
4. Dense data screens must switch to compact cards or wrapped rows instead of clipping.
5. Primary actions must keep accessible touch targets across all supported sizes.

## 8. Animation Rule

1. Motion tokens must be centralized in src/animations/motionTokens.js.
2. Screen transitions should use shared wrappers.
3. Respect reduced-motion setting in all animated flows.
4. Use skeleton or shimmer placeholders for loading states.

## 9. Naming Rule

1. Components use PascalCase.jsx.
2. Styles use matching PascalCase.styles.js.
3. Services use camelCaseService.js.
4. Keep feature folder names in PascalCase to match sample style.

## 10. Guardrails

1. No business-rule logic inside pure UI components.
2. No duplicated policy checks across unrelated screens.
3. No direct hardcoded endpoint calls inside screen files.
4. No animation implementation that blocks user actions.
