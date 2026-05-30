# Student Color Scheme (Unified With Admin)

This theme applies the same admin-derived color scheme to all student interfaces so all GRADUS roles use one consistent design language.

Source alignment:
- [../Super-admin/Color-Scheme.md](../Super-admin/Color-Scheme.md)
- [../Program-coordinator-Admin/Color-Scheme.md](../Program-coordinator-Admin/Color-Scheme.md)
- [../teacher/Color-Scheme.md](../teacher/Color-Scheme.md)
- https://sms.pampangastateu.edu.ph/

## 1. Unified Palette (Same As Admin And Teacher)

Core shell and layout colors:
- Header maroon: #701D0B
- Sidebar charcoal: #28303B
- Page background: #F1F3FA
- Surface white: #FFFFFF
- Primary text: #333333
- Border neutral: #E5E7EB

Shared accents:
- Primary action blue: #2A7AB6
- Primary hover blue: #2F7FB8
- Teal accent: #32C5D2
- Purple analytics: #8E44AD
- Danger red: #D91E18
- Warning saffron: #F4D03F

## 2. Student Semantic Tokens

Use the same system tokens as Teacher/Admin:

- --app-bg-page: #F1F3FA
- --app-bg-surface: #FFFFFF
- --app-bg-soft: #EEF1F5

- --app-text-primary: #333333
- --app-text-secondary: #606C7D
- --app-text-on-dark: #FFFFFF

- --app-shell-header: #701D0B
- --app-shell-sidebar: #28303B
- --app-shell-sidebar-active: #556B86

- --app-primary: #2A7AB6
- --app-primary-hover: #2F7FB8
- --app-primary-soft: #DEEDF7

- --app-accent: #32C5D2
- --app-accent-hover: #27A6B2
- --app-accent-soft: #DDF5F7

- --app-border: #E5E7EB
- --app-divider: #DDE3EA
- --app-focus-ring: #32C5D2

Status tokens:
- --app-success: #1BBC9B
- --app-warning: #F4D03F
- --app-danger: #D91E18
- --app-info: #67809F
- --app-analytics: #8E44AD

## 3. Student UI Mapping

Dashboard and profile:
- Shell and cards use same colors as admin/teacher for consistency.

Grade and enrollment pages:
- Main actions (Open, View, Submit): --app-primary
- Support/secondary actions: --app-accent
- Alerts and blocking states: --app-warning / --app-danger as needed

Posted-grade visibility chips:
- Posted status: --app-success (use dark text)
- Draft hidden indicator in internal admin views only: --app-info

## 4. Accessibility Rules (Shared)

Use these required pairings:
1. White text on maroon/charcoal shell colors.
2. White text on --app-primary.
3. Dark text (#333333) on teal and warning surfaces.

Important:
- Do not use white text on #32C5D2.
- Use dark text on #F4D03F.

## 5. CSS Variables (Ready)

```css
:root {
  --app-bg-page: #f1f3fa;
  --app-bg-surface: #ffffff;
  --app-bg-soft: #eef1f5;

  --app-text-primary: #333333;
  --app-text-secondary: #606c7d;
  --app-text-on-dark: #ffffff;

  --app-shell-header: #701d0b;
  --app-shell-sidebar: #28303b;
  --app-shell-sidebar-active: #556b86;

  --app-primary: #2a7ab6;
  --app-primary-hover: #2f7fb8;
  --app-primary-soft: #deedf7;

  --app-accent: #32c5d2;
  --app-accent-hover: #27a6b2;
  --app-accent-soft: #ddf5f7;

  --app-border: #e5e7eb;
  --app-divider: #dde3ea;
  --app-focus-ring: #32c5d2;

  --app-success: #1bbc9b;
  --app-warning: #f4d03f;
  --app-danger: #d91e18;
  --app-info: #67809f;
  --app-analytics: #8e44ad;
}
```

## 6. Final Alignment Statement

Student UI now uses the same admin-based color scheme as Super Admin, Program Coordinator Admin, and Teacher.
