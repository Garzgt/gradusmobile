# GRADUS Landing AI Image Prompt Pack

Use this file to generate landing-page visuals that match GRADUS style.

Important:
1. AI illustrations are for explanatory visuals only.
2. Developer Team member cards should use real formal photos, not AI portraits.
3. Keep one consistent illustration style across all generated images.
4. All prompts in this file are transparent-background only.
5. Public achiever prompts are maintained separately in [AchieverUI-Guide.md](./AchieverUI-Guide.md).

## 1. Global Art Direction (Use In Every Prompt)

Use this style prefix in your generator before each prompt:

```text
Modern institutional web illustration, premium clean composition, stylized cinematic family-friendly 3D character art, western animated feature look, rounded forms, expressive but natural faces, maroon and gold accent palette, high contrast, realistic lighting, polished but friendly, suitable for university system landing page, isolated main subject, transparent background, alpha channel, no scene, no floor, no watermark, no logo, no gibberish text, no distorted hands, no extra fingers, no low-resolution artifacts, non-anime, non-manga
```

Color anchors to keep consistent:
1. Maroon: #800000
2. Gold: #FFB400
3. Charcoal: #2C2E36
4. Surface neutral: #F8F9FA
5. Card white: #FFFFFF
6. Border neutral: #DEE2E6
7. Muted text: #666666
8. Maroon hover: #660000
9. Maroon active: #920003
10. Gold hover: #CC9000

## 2. Suggested Output Settings

1. Hero images: 16:9, 1920x1080
2. Section visuals: 3:2, 1500x1000
3. Card visuals: 4:3, 1200x900
4. Portrait placeholders (if ever needed): 4:5, 1200x1500

## 2.1 Transparent PNG Only Rule (Mandatory)

All prompts in this file must output no background, only the main subject.

Mandatory suffix (append to every prompt):

```text
isolated character only, transparent background, alpha channel, no floor, no scene, no shadow plate, centered composition, western animated feature style, non-anime, non-manga, non-chibi
```

## 2.2 System UI Color Lock (Mandatory for Web/App/Desktop Panels)

When any generated image includes interface screens, use these exact UI colors:
1. Primary buttons, active tabs, active nav: #800000
2. Primary hover and active states: #660000 and #920003
3. Accent chips and highlights: #FFB400 and #CC9000
4. Main text: #2C2E36
5. Secondary text: #666666
6. Surface backgrounds: #F8F9FA
7. Card backgrounds: #FFFFFF
8. Borders and dividers: #DEE2E6
9. Avoid blue, purple, or neon primary UI themes.

Mandatory UI color-lock suffix (append to prompts with screens):

```text
strict GRADUS UI palette on all visible screens: primary #800000, hover #660000, active #920003, accent #FFB400, accent hover #CC9000, text #2C2E36, secondary text #666666, surface #F8F9FA, card #FFFFFF, border #DEE2E6, avoid blue or purple UI accents
```

## 2.3 Character Style Lock (Mandatory)

Use these rules for all character prompts:
1. Keep faces expressive but natural, not exaggerated anime proportions.
2. Keep eyes proportionate and avoid anime eye styling.
3. Keep body proportions balanced (no chibi or super-deformed style).
4. Keep shading soft and cinematic, not cel-shaded anime look.

## 2.4 Public Achiever Prompt Split

Public achiever prompts are intentionally split out of this file.
Use [AchieverUI-Guide.md](./AchieverUI-Guide.md) for:
1. Achiever ranking UI implementation details
2. Achiever-only AI prompts
3. Top 1, Top 2, Top 3 badge color lock rules

Export format guidance:
1. Transparent assets: PNG preferred
2. WebP with alpha is optional if your generator supports it

Optional negative prompt add-on:

```text
blurry, noisy, low quality, pixelated, text artifacts, watermark, signature, oversaturated, deformed face, bad anatomy, duplicate body parts, anime, manga, chibi, cel-shaded anime, oversized anime eyes, blue primary UI theme, purple UI theme, neon UI theme
```

## 3. Copy-Paste Prompts By Landing Section

Important for Section 3 prompts:
1. Always append transparent suffix from section 2.1.
2. If the prompt includes any web/app/desktop screen, also append the UI color-lock suffix from section 2.2.

### 3.1 Hero Section (Generate 4)

HERO-01: Unified platform hero visual
```text
A confident Filipino university student and teacher standing beside floating UI panels of web, desktop, and mobile academic system screens, premium hero composition with strong visual depth, maroon and gold highlights, clean modern shapes, high detail, cinematic but professional
```

HERO-02: Student using mobile app
```text
A Filipino college student in formal casual attire using a smartphone showing academic app interface, bright natural light, modern friendly cartoon style, professional educational technology mood, maroon and gold accent details
```

HERO-03: Teacher using desktop app
```text
A Filipino teacher in professional attire working on a laptop with gradebook and class management interface visible, polished 2.5D illustration style, trustworthy and efficient mood, maroon and gold UI accents
```

HERO-04: Product collage visual
```text
Three-device product composition with a desktop monitor, laptop, and smartphone showing scheduling, enrollment, and grading interfaces, floating cards and subtle gradients, premium SaaS landing-page art direction, clean geometry, maroon and gold brand accents
```

### 3.2 Platform Access Hub (Generate 3)

PLATFORM-01: Web access visual
```text
Modern web dashboard on a large monitor, role-based admin layout concept, crisp interface blocks, subtle depth, maroon primary and gold accent palette, no readable random text
```

PLATFORM-02: Desktop app visual
```text
Desktop application window mockup for teacher workflows showing classes, attendance, and grading modules, neat sidebar layout, high clarity illustration for download card, professional educational software aesthetic
```

PLATFORM-03: Mobile app visual
```text
Smartphone app mockup focused on student schedule, grades, and notifications, clear UI sections, polished app-store style presentation, academic brand colors
```

### 3.3 How GRADUS Works Timeline (Generate 4)

TIMELINE-01: Schedule generation
```text
Illustration of academic schedule planning with calendar grid, class blocks, and conflict indicators, controlled and deterministic workflow feel, clean iconography, maroon and gold accents, professional composition
```

TIMELINE-02: Enrollment flow
```text
Student enrollment process visual with approval flow cards, section selection, and status progression, clear directional movement from request to approval, neat educational system UI style
```

TIMELINE-03: Teacher grade posting
```text
Teacher encoding scores and posting final grades in a structured gradebook interface, progress status chips from draft to posted, confident and reliable workflow atmosphere
```

TIMELINE-04: Recognition publishing
```text
Academic recognition publication visual with award cards, approval badges, and policy-safe summary elements, formal and celebratory but professional tone, clean institutional design
```

### 3.4 Core Modules Showcase (Generate 8)

MODULE-01: Scheduling engine
```text
Advanced scheduling engine interface with subject blocks, room assignments, and conflict markers, precision-focused dashboard style, modern educational operations UI
```

MODULE-02: Conflict detection
```text
Conflict resolution visual with highlighted overlaps in teacher, room, and section schedules, before-and-after correction state, clean analytics style
```

MODULE-03: LOI workflow
```text
Letter of intent workflow interface with status timeline from submitted to approved, clear cards and decision states, polished admin-friendly design
```

MODULE-04: Irregular planning
```text
Irregular student planning interface with subject eligibility filters, unit cap meter, and conflict warnings, supportive and structured visual tone
```

MODULE-05: Gradebook encoder
```text
Teacher gradebook interface with attendance, quizzes, activities, exam columns, and validation indicators, detailed but readable, professional academic software style
```

MODULE-06: Grade posting state
```text
Draft versus posted grade state comparison visual, secure publication confirmation, clean trust-oriented interface design
```

MODULE-07: Recognition criteria view
```text
Recognition criteria checklist interface with transparent rule indicators and eligibility states, clean cards and icons, policy clarity emphasis
```

MODULE-08: Recognition publication output
```text
Public recognition publication board concept with award-ready cards, eligibility summary area, and policy disclaimer slot, formal and fair presentation style, no real personal identity data
```

### 3.5 Role-Based Experience (Generate 4)

ROLE-01: Super Admin context
```text
Super admin control panel visual with governance modules, system-level oversight cards, and scheduling publication controls, authoritative but clean UI composition
```

ROLE-02: Program Coordinator context
```text
Program coordinator review dashboard with approval queues, enrollment decisions, and policy checks, structured workflow emphasis
```

ROLE-03: Teacher context
```text
Teacher daily workflow visual with classes list, attendance, and grade posting controls, practical and efficient interface presentation
```

ROLE-04: Student context
```text
Student app journey visual with schedule, posted grades, enrollment status, and notifications, accessible and positive educational experience
```

### 3.6 Trust and Governance (Generate 4)

TRUST-01: Deterministic rules
```text
Rule-based decision engine concept using clear logic nodes and policy cards, transparent process visualization, reliable institutional feel
```

TRUST-02: Audit-ready workflow
```text
Audit trail interface visual with timestamped actions, user roles, and event logs, clean compliance-focused composition
```

TRUST-03: Posted-only visibility
```text
Visibility policy visual showing draft records locked and posted records visible, clear state distinction, privacy-safe design
```

TRUST-04: Institutional accountability
```text
Institutional governance visual with approval checkpoints and role boundaries, formal trustworthy style with subtle academic symbolism
```

### 3.7 Testimonials and Outcome Visuals (Generate 3 to 6)

OUTCOME-01: Student success visual
```text
Positive student outcome illustration with progress cards and achievement indicators, clean and authentic educational mood
```

OUTCOME-02: Teacher efficiency visual
```text
Teacher productivity illustration with streamlined grading and attendance flows, professional interface-centered composition
```

OUTCOME-03: Admin operational clarity visual
```text
Admin operations summary visual with queue reduction and workflow completion indicators, data-informed but friendly presentation
```

Optional infographic prompts:

OUTCOME-04: Process improvement card set
```text
Simple institutional infographic style cards showing faster approval cycles, clearer records, and reduced process friction, clean vector style
```

OUTCOME-05: Platform adoption visual
```text
Adoption trend concept with role-based usage blocks and growth markers, minimal chart-like illustration suitable for landing section
```

OUTCOME-06: Service quality visual
```text
Support and reliability illustration showing response flow and resolved requests, clear visual storytelling without dense text
```

### 3.8 Supplementary Landing Assets (Generate 6)

SUPPORT-01: Social proof metrics strip
```text
Social proof metrics strip with three to four compact statistic cards for adoption, efficiency, and workflow completion, clean and modern institutional style
```

SUPPORT-02: Platform status badge set
```text
Status badge set for platform cards including available, beta, and coming soon states, consistent rounded badge style, maroon and gold accents
```

SUPPORT-03: FAQ icon set
```text
Minimal FAQ icon set for access, download, grade visibility, and support topics, consistent stroke and fill style, clean academic look
```

SUPPORT-04: Final CTA companion visual
```text
Strong final CTA companion illustration with education technology theme, clean directional composition that supports call-to-action buttons without visual clutter
```

SUPPORT-05: Footer trust icon cluster
```text
Footer trust icon cluster representing policy, support, and institutional reliability, simple geometric icon style, polished and consistent
```

SUPPORT-06: QR placeholder tile set
```text
Android and iOS QR placeholder tiles with clear scan callout area and download labels, clean UI frame style, designed to be replaced by real generated QR codes later
```

## 4. Developer Team Section Rule

1. Use real formal photos for actual team members.
2. Do not use AI-generated faces for real member identity cards.
3. If you need temporary placeholders before final photos, use neutral avatar illustrations only.

Temporary placeholder prompt (optional):

```text
Neutral professional avatar placeholder portrait, formal attire silhouette style, transparent background, no real identifiable person, consistent card-ready composition
```

## 5. Naming Convention For Generated Files

Use this naming format:
1. lp-hero-01.png
2. lp-platform-01.png
3. lp-timeline-01.png
4. lp-module-01.png
5. lp-role-01.png
6. lp-trust-01.png
7. lp-outcome-01.png
8. lp-support-01.png

## 6. Quick Production Workflow

1. Generate 2 to 4 variants per prompt.
2. Pick one best image per slot based on clarity and brand fit.
3. Export transparent PNG for all final assets.
4. Keep alt text notes while selecting final assets.
5. Recheck style consistency before landing-page integration.

## 7. Coverage Double-Check

Covered by prompts in this file:
1. Hero visuals
2. Platform access visuals
3. Timeline visuals
4. Core module visuals
5. Role-based visuals
6. Trust and governance visuals
7. Testimonials and outcome visuals
8. Supplementary assets (social proof, FAQ icons, final CTA companion, footer trust icons, QR placeholders)

Handled in a separate file:
1. Public achievers visuals and achiever rank color lock (see [AchieverUI-Guide.md](./AchieverUI-Guide.md))

Not AI-generated by default (use real assets):
1. Developer Team formal photos
2. Official logos and brand marks
3. Real scannable QR codes for app downloads

Prompt slot count in this file:
1. Hero: 4
2. Platform: 3
3. Timeline: 4
4. Modules: 8
5. Roles: 4
6. Trust: 4
7. Outcomes: 6
8. Supplementary: 6
9. Total prompt slots: 39
