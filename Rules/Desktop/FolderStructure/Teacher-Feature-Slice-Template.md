# Teacher Desktop Feature Slice Template

Use this template for new renderer features in the teacher desktop app.

## 1. Standard Slice

```text
src/features/FeatureName/
|-- components/
|   |-- FeaturePanel.jsx
|   `-- FeaturePanel.module.css
|-- services/
|   `-- featureService.js
|-- FeaturePage.jsx
`-- FeaturePage.module.css
```

## 2. Nested Slice Variant

```text
src/features/ParentFeature/ChildFeature/
|-- components/
|   |-- ChildPanel.jsx
|   `-- ChildPanel.module.css
|-- services/
|   `-- childService.js
|-- ChildPage.jsx
`-- ChildPage.module.css
```

## 3. Optional Additions

Add only if needed:
1. hooks/
2. constants/
3. schemas/
4. adapters/
5. responsive/

## 4. IPC Integration Pattern

If feature needs privileged access:
1. define channel in electron/main/ipc/channels.js
2. add preload bridge function
3. call bridge from feature service
4. validate payloads before processing

## 5. Definition Of Done

1. Feature page created.
2. Feature components created.
3. Feature service created.
4. CSS module styles created.
5. Validation and loading states implemented.
6. Audit and posting rules honored when applicable.
7. IPC bridge path added if required.
8. Compact-window responsive behavior verified.
