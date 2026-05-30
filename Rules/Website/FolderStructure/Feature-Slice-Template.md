# Feature Slice Template (Copy And Use)

Use this template whenever creating a new website feature.

## 1. Route Feature Template

```text
app/(role-group)/feature-name/
|-- components/
|   |-- FeaturePrimaryPanel.jsx
|   `-- FeatureSecondaryPanel.jsx
|-- services/
|   `-- featureNameService.js
|-- page.jsx
`-- page.module.css
```

## 2. Nested Vertical Slice Template

```text
app/(role-group)/parent-feature/child-feature/
|-- components/
|   |-- ChildFeatureList.jsx
|   `-- ChildFeatureForm.jsx
|-- services/
|   `-- childFeatureService.js
|-- page.jsx
`-- page.module.css
```

## 3. API Slice Template

```text
app/api/role-or-domain/feature-name/
|-- route.js
`-- [id]/route.js
```

## 4. File Naming Quick Guide

1. React component files: PascalCase.jsx
2. CSS modules: Match component name + .module.css
3. Service files: camelCase + Service.js
4. Route files: page.jsx, layout.jsx, route.js

## 5. Definition Of Done For A New Slice

1. Route page file created.
2. Feature components folder created.
3. Feature service file created.
4. CSS module styles created.
5. API route created if feature needs backend endpoint.
6. Navigation config updated.
7. Role guard applied if required.
