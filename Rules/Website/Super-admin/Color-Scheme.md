# Super Admin Color Scheme (SMS-Inspired)

This scheme is based on authenticated UI colors extracted from:
- https://sms.pampangastateu.edu.ph/

Sampling context:
- Logged-in dashboard shell and dashboard tiles
- Header, sidebar, content, button, and status colors

## 1. Extracted Base Colors

Core shell colors observed:
- Header maroon: #701D0B
- Sidebar charcoal: #28303B
- Main page background: #F1F3FA
- Primary text dark: #333333
- Surface white: #FFFFFF
- Border neutral: #E5E7EB

Common dashboard accents observed:
- System blue: #3598DC
- Steel blue: #67809F
- Purple: #8E44AD
- Teal: #32C5D2
- Danger red: #D91E18
- Warning saffron: #F4D03F

## 2. Super Admin Theme Intent

Super Admin should feel:
1. Authoritative and high-control
2. Clear for governance and audit-heavy workflows
3. Visually stable for long daily use

Design approach:
- Keep institutional maroon + charcoal shell
- Use a darker accessible blue for primary actions
- Keep red/warning colors for risk and exception actions

## 3. Super Admin Semantic Tokens

- --sa-bg-page: #F1F3FA
- --sa-bg-surface: #FFFFFF
- --sa-bg-soft: #EEF1F5

- --sa-text-primary: #333333
- --sa-text-secondary: #606C7D
- --sa-text-on-dark: #FFFFFF

- --sa-shell-header: #701D0B
- --sa-shell-sidebar: #28303B
- --sa-shell-sidebar-active: #4E637D

- --sa-primary: #2B6FA0
- --sa-primary-hover: #1F6EA8
- --sa-primary-soft: #DEEDF7

- --sa-accent: #8E44AD
- --sa-accent-soft: #E6DAEE

- --sa-border: #E5E7EB
- --sa-divider: #DDE3EA
- --sa-focus-ring: #2A7AB6

Status tokens:
- --sa-success: #1BBC9B
- --sa-warning: #F4D03F
- --sa-danger: #D91E18
- --sa-info: #67809F

## 4. Accessibility Pairing Rules

Use these text/background pairs for safe readability:
1. White text on header maroon #701D0B
2. White text on sidebar #28303B
3. Dark text #333333 on page background #F1F3FA
4. White text on primary action #2B6FA0
5. Dark text #333333 on warning #F4D03F

Important caution from source colors:
- White on source blue #3598DC is low for normal-size text.
- Prefer white text on #2B6FA0 for primary action buttons.

## 5. Component Mapping (Super Admin)

Top navigation/header:
- Background: #701D0B
- Text/icons: #FFFFFF

Sidebar:
- Background: #28303B
- Default text: #C6CFDA
- Active item background: #4E637D
- Active text: #FFFFFF

Primary buttons (Save, Publish, Approve):
- Background: #2B6FA0
- Hover: #1F6EA8
- Text: #FFFFFF

Secondary buttons:
- Background: #E1E5EC
- Text: #333333

Risk actions (Delete, Override reject):
- Background: #D91E18
- Text: #FFFFFF

Tables/cards:
- Card: #FFFFFF
- Border: #E5E7EB
- Header strip: #F1F3FA

## 6. CSS Variables (Ready)

```css
:root {
  --sa-bg-page: #f1f3fa;
  --sa-bg-surface: #ffffff;
  --sa-bg-soft: #eef1f5;

  --sa-text-primary: #333333;
  --sa-text-secondary: #606c7d;
  --sa-text-on-dark: #ffffff;

  --sa-shell-header: #701d0b;
  --sa-shell-sidebar: #28303b;
  --sa-shell-sidebar-active: #4e637d;

  --sa-primary: #2b6fa0;
  --sa-primary-hover: #1f6ea8;
  --sa-primary-soft: #deedf7;

  --sa-accent: #8e44ad;
  --sa-accent-soft: #e6daee;

  --sa-border: #e5e7eb;
  --sa-divider: #dde3ea;
  --sa-focus-ring: #2a7ab6;

  --sa-success: #1bbc9b;
  --sa-warning: #f4d03f;
  --sa-danger: #d91e18;
  --sa-info: #67809f;
}
```

## 7. Quick Usage Guidance

1. Use maroon only for shell and top-level authority actions.
2. Use blue family for frequent workflow CTAs.
3. Keep red only for destructive/critical states.
4. Keep warning tiles/cards with dark text, not white text.
5. Preserve neutral-heavy backgrounds for data-dense admin screens.
