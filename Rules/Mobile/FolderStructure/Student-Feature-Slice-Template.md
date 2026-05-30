# Student App Feature Slice Template

Use this template for every new student app feature.

## 1. Feature Slice Template

```text
src/screens/FeatureName/
|-- components/
|   |-- FeatureWidget.jsx
|   `-- FeatureWidget.styles.js
|-- services/
|   `-- featureService.js
|-- FeatureMain.jsx
`-- FeatureMain.styles.js
```

## 2. Nested Feature Template

```text
src/screens/ParentFeature/ChildFeature/
|-- components/
|   |-- ChildWidget.jsx
|   `-- ChildWidget.styles.js
|-- services/
|   `-- childFeatureService.js
|-- ChildMain.jsx
`-- ChildMain.styles.js
```

## 3. Optional Add-Ons

Add only when needed:

1. hooks/
2. constants/
3. schemas/
4. adapters/
5. responsive/

## 4. Screen Build Checklist

1. Feature components are inside feature folder.
2. Service layer exists for data operations.
3. Screen has matching styles file.
4. Loading, empty, and error states are handled.
5. Animation wrapper is applied where needed.
6. Accessibility labels are set for key actions.
7. Policy checks are validated for student rules.
8. Responsive behavior is verified for phone and tablet layouts.
