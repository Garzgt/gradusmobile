# GRADUS Achiever UI Guide

This guide is a dedicated reference for the Public Academic Achievers section.
It is intentionally separated from AI-Image-Prompt-Pack.md.

Use this with:
1. Public-Achievers-Ranking.md for policy and publication rules
2. AI-Image-Prompt-Pack.md for all non-achiever landing visuals

## 1. Purpose

1. Define how the achiever section should look and behave.
2. Keep achiever prompts and rank color rules isolated from the general prompt pack.
3. Standardize responsive and accessibility behavior for this block.

## 2. UI Structure

Top control bar:
1. Term selector
2. Academic year selector
3. Program selector
4. Sort control (rank or program)
5. Last updated timestamp label

Main content area:
1. Top 3 highlight cards with stronger visual emphasis
2. Top 25 achiever list or compact table (always show ranks 1 to 25)
3. Recognition label chip per entry
4. Criteria link and policy-safe disclaimer below list

Footer area:
1. Publication metadata
2. "View criteria" link
3. "Updated" timestamp

## 3. Rank Card System

Top 1 to 3 must always include explicit text labels and color-coded badges:
1. Rank 1: Gold #FFB400
2. Rank 2: Silver #C0C0C0
3. Rank 3: Bronze #CD7F32

Rules:
1. Do not rely on color alone; always show rank text (1st, 2nd, 3rd).
2. Keep badge contrast readable on all breakpoints.
3. Preserve card width consistency so ranking order is visually clear.

## 4. Responsive Behavior

Desktop (1200px and above):
1. Controls in a single row
2. Top 3 cards in a 3-column row
3. Remaining achievers in 2-column card grid or table

Tablet (768px to 1199px):
1. Controls wrap to two rows
2. Top 3 cards stacked as 2 plus 1 or 1-column fallback
3. Remaining achievers in single-column cards

Mobile (767px and below):
1. Controls become vertical stack
2. Top 3 cards shown one per row
3. Remaining achievers in compact list with rank badge, name, and program
4. Keep tap targets at least 44px high

## 5. Accessibility and Privacy

1. Keyboard focus must reach all filters and achiever cards.
2. Keep visible focus indicators for controls and links.
3. Color is never the only rank signal.
4. If privacy policy requires masking, show initial-based names.
5. Never show private identifiers or draft records.

## 6. Data Contract (Frontend)

Suggested per-row fields:
1. achieverId
2. displayName
3. isMasked
4. programCode
5. recognitionLabel
6. rank
7. termCode
8. academicYear
9. publishedAt
10. criteriaUrl

## 7. Achiever-Only AI Prompt Set

Use this section for achiever visuals only.

### 7.1 Base Style Prefix

Use the same Global Art Direction from AI-Image-Prompt-Pack.md section 1.

### 7.2 Transparent PNG Suffix (Mandatory)

Append to every achiever prompt:

```text
isolated character only, transparent background, alpha channel, no floor, no scene, no shadow plate, centered composition, western animated feature style, non-anime, non-manga, non-chibi
```

### 7.3 Rank Color Lock Suffix (Mandatory)

Append to every achiever prompt:

```text
top 3 rank badge colors must be exact: rank 1 gold #FFB400, rank 2 silver #C0C0C0, rank 3 bronze #CD7F32, maintain readable contrast labels for 1st 2nd 3rd
```

### 7.4 Copy-Paste Prompts (Generate 5)

ACHIEVER-01: Leaderboard panel visual
```text
Public academic achievers leaderboard panel with ranked cards, polished academic UI style, clear hierarchy from rank 1 to rank 25, fair and formal presentation, no real personal identity data
```

ACHIEVER-02: Top 3 highlight card set
```text
Top three achiever highlight card group with explicit 1st, 2nd, and 3rd rank badges, gold silver bronze treatment, clean spacing, balanced typography, institutional and professional visual tone
```

ACHIEVER-03: Term and academic year filter panel
```text
Filter control panel for term and academic year selection with clean dropdown style and readable metadata chips, modern institutional interface treatment
```

ACHIEVER-04: Program filter and sorting controls
```text
Program filter and sorting control block for achiever listing, clear segmented controls, compact and professional academic UI composition
```

ACHIEVER-05: Publication metadata and criteria link card
```text
Policy-safe metadata card showing last updated timestamp and criteria link area for achiever ranking transparency, clean compliance-friendly visual style
```

## 8. File Naming

Use this naming format for achiever assets:
1. lp-achiever-01.png
2. lp-achiever-02.png
3. lp-achiever-03.png
4. lp-achiever-04.png
5. lp-achiever-05.png

## 9. Build Checklist

1. Achiever section matches publication policy.
2. Top 3 rank badge colors are exact.
3. Top 25 entries are always visible in ranking output.
4. Filters work for term, year, and program.
5. Empty and loading states are implemented.
6. Mobile layout remains readable and tappable.
7. Accessibility checks pass for keyboard and contrast.
