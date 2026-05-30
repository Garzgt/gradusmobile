# GRADUS Landing Page Color Scheme (PSU-Inspired)

This color scheme is derived from the live visual theme of:
- https://pampangastateu.edu.ph/

Extraction basis:
- Dominant rendered page colors (text, background, border, fill)
- Site custom properties found in computed styles
- Accessibility checks for critical foreground/background pairs

## 1. Brand Direction

The PSU site theme is strongly built around:
1. Maroon as the institutional primary color
2. Golden yellow as the highlight/accent color
3. Charcoal and neutral gray for readability and structure

This landing-page palette keeps that same identity while improving usability and contrast consistency.

## 2. Core Palette

Primary brand colors:
- Maroon 800: #800000
- Maroon 900 (hover/active): #660000
- Maroon 700 (alternative action): #920003

Accent colors:
- Gold 500: #FFB400
- Gold 600 (hover/active): #CC9000
- Gold 450 (soft accent): #FFC107

Neutrals:
- Charcoal 900: #2C2E36
- Black 1000: #000000
- White 0: #FFFFFF
- Surface 50: #F8F9FA
- Surface 100: #F3F3F3
- Border 200: #DEE2E6
- Muted text 600: #666666

## 3. Semantic Design Tokens

Use these tokens for implementation so components stay consistent:

- --bg-page: #FFFFFF
- --bg-surface: #F8F9FA
- --bg-soft: #F3F3F3
- --bg-hero-overlay: rgba(44, 46, 54, 0.55)

- --text-primary: #2C2E36
- --text-secondary: #666666
- --text-on-brand: #FFFFFF
- --text-on-accent: #2C2E36

- --brand-primary: #800000
- --brand-primary-hover: #660000
- --brand-primary-active: #920003

- --accent-primary: #FFB400
- --accent-primary-hover: #CC9000
- --accent-soft: #FFF0CC

- --border-default: #DEE2E6
- --border-strong: #B7B7B7

- --focus-ring: #FFB400
- --focus-ring-offset: #2C2E36

## 4. Component Color Rules

Header:
- Default (top): transparent background over hero
- Scrolled: #FFFFFF with border-bottom #DEE2E6
- Nav text: #2C2E36
- Nav active/hover: #CC9000

Hero:
- Background image + overlay using rgba(44, 46, 54, 0.55)
- Headline text: #FFFFFF
- Supporting text: #F8F9FA

Buttons:
1. Primary CTA
- Background: #800000
- Text: #FFFFFF
- Hover: #660000
- Active: #920003

2. Secondary CTA
- Background: #FFB400
- Text: #2C2E36
- Hover: #CC9000
- Active: #CC9000

3. Outline CTA
- Border: #800000
- Text: #800000
- Hover background: #FFF0CC

Cards and sections:
- Card background: #FFFFFF
- Alternate section background: #F8F9FA
- Borders/dividers: #DEE2E6
- Icon accents: #800000 or #FFB400 depending on hierarchy

Status chips:
- Available: background #FFF0CC, text #800000
- Beta/Info: background #F8F9FA, text #2C2E36
- Warning: background #FFC107, text #2C2E36

## 5. Accessibility Check Highlights

Validated contrast examples:
1. #FFFFFF text on #800000 background = 10.95 (AAA pass)
2. #2C2E36 text on #FFFFFF background = 13.54 (AAA pass)
3. #2C2E36 text on #FFB400 background = 7.59 (AAA pass)

Important caution:
- #FFFFFF text on #CC9000 background = 2.78 (fails for normal text)
- Use dark text (#2C2E36) on gold buttons and gold surfaces.

## 6. CSS Variables (Ready To Use)

```css
:root {
  --bg-page: #ffffff;
  --bg-surface: #f8f9fa;
  --bg-soft: #f3f3f3;
  --bg-hero-overlay: rgba(44, 46, 54, 0.55);

  --text-primary: #2c2e36;
  --text-secondary: #666666;
  --text-on-brand: #ffffff;
  --text-on-accent: #2c2e36;

  --brand-primary: #800000;
  --brand-primary-hover: #660000;
  --brand-primary-active: #920003;

  --accent-primary: #ffb400;
  --accent-primary-hover: #cc9000;
  --accent-soft: #fff0cc;

  --border-default: #dee2e6;
  --border-strong: #b7b7b7;

  --focus-ring: #ffb400;
  --focus-ring-offset: #2c2e36;
}
```

## 7. Quick Implementation Mapping

For your current landing-page sections:
1. Hero + Final CTA band: maroon-primary treatment
2. Platform cards + FAQ + module blocks: white/surface neutrals
3. Role chips, highlights, and key links: gold accent
4. Policy/governance callouts: maroon headings + neutral body text

This keeps the page recognizable as PSU-aligned while still modern and readable on desktop and mobile.
