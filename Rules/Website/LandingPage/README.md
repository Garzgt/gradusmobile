# GRADUS Landing Page Plan

This document defines the target UI/UX, motion system, responsiveness, and content structure for the public landing page of GRADUS.

Domain:
- gradus.college

Important note:
- Color theme is now defined using a PSU-inspired palette.
- Implementation tokens and usage rules are documented in [Color-Scheme.md](./Color-Scheme.md).

Documentation pack:
- Full feature inventory: [Features-Complete.md](./Features-Complete.md)
- Section layout and behavior: [Section-Blueprint.md](./Section-Blueprint.md)
- Public achievers ranking rules: [Public-Achievers-Ranking.md](./Public-Achievers-Ranking.md)
- Public achiever UI and achiever-only prompts: [AchieverUI-Guide.md](./AchieverUI-Guide.md)
- Image and developer team guide: [Image-Team-Guide.md](./Image-Team-Guide.md)
- AI image prompt pack: [AI-Image-Prompt-Pack.md](./AI-Image-Prompt-Pack.md)
- Launch QA checklist: [Launch-Checklist.md](./Launch-Checklist.md)
- Public navigation model: [Sidebar.md](./Sidebar.md)
- Beautiful visual direction guide: [Beautiful-UI-Guide.md](./Beautiful-UI-Guide.md)
- Rules and guardrails: [Landing-Rules.md](./Landing-Rules.md)

## 1. Landing Page Goals

Primary goals:
1. Explain what GRADUS is in less than 10 seconds.
2. Make app access obvious (Web, Desktop, Mobile).
3. Show system credibility (features, governance, workflow clarity).
4. Keep users engaged through polished animation and interaction.
5. Perform well on mobile and low bandwidth connections.

Secondary goals:
1. Build trust for students, teachers, and administrators.
2. Reduce support questions by exposing clear FAQs and role-based flow.

## 2. Target Audience

1. Students
- Need quick understanding of grade visibility and mobile access.

2. Teachers
- Need confidence in grading workflow and reliability.

3. Program Coordinators and Super Admin
- Need confidence in governance, scheduling, and compliance logic.

4. Public visitors
- Need clear first impression and institutional credibility.

## 3. Experience Principles

1. Clarity first
- Every section must answer one question only.

2. Motion with purpose
- Animations should explain hierarchy and flow, not distract.

3. Fast interaction
- All CTAs should remain visible and reachable in 1 to 2 taps.

4. Responsive by default
- Design mobile first, then scale to tablet and desktop.

5. Accessible always
- Keyboard support, readable contrast, reduced motion support.

## 4. Information Architecture

Recommended section order:
1. Sticky Header
2. Hero + Primary CTAs
3. Platform Access Hub (Web, Desktop, Mobile)
4. How GRADUS Works (4-step timeline)
5. Core Modules Showcase
6. Role-Based Experience
7. System Trust and Governance
8. Public Academic Achievers
9. Testimonials or Campus Feedback
10. Developer Team Showcase
11. FAQ
12. Final CTA Band
13. Footer

## 5. Section-by-Section UI/UX Specification

### 5.1 Sticky Header

Required items:
- Logo + wordmark
- Nav links (Features, Roles, Team, Achievers, FAQ, Contact)
- Primary CTA buttons: Open Web, Desktop App, Mobile App

Behavior:
- Transparent at top, solid background after scroll threshold.
- Desktop: full menu visible.
- Mobile: compact menu with slide panel.

### 5.2 Hero Section

Purpose:
- Deliver the product value in one screen.

Content:
- Strong headline describing GRADUS as one unified academic platform.
- Supporting text: scheduling, enrollment, grading, recognition.
- CTAs:
  - Open Web System
  - Download Desktop App
  - Get Mobile App
- Optional secondary element: short product video loop or animated product mockup.

Animation:
- Staggered text reveal (headline, then support text, then buttons).
- Subtle floating motion for dashboard mock cards.

### 5.3 Platform Access Hub

Purpose:
- Make app links impossible to miss.

Cards:
1. Web App card
- URL, role access note (Admin/Super Admin)
- Open button

2. Desktop App card
- Latest version, OS compatibility, file size
- Download button

3. Mobile App card
- Android and iOS links (or planned state)
- QR code for quick install access

UX details:
- Each card should show status badge (Available, Coming Soon, Beta if needed).
- Keep CTA label consistent and action-oriented.

### 5.4 How GRADUS Works (Timeline)

Timeline steps:
1. Schedule generation and publication
2. Enrollment flow by standing (regular/irregular)
3. Teacher encoding and grade posting
4. Academic standing and recognition output

Animation:
- Vertical timeline on mobile, horizontal on desktop.
- Progress line animates as section enters viewport.

### 5.5 Core Modules Showcase

Modules to highlight:
- Scheduling Engine
- Enrollment Workflow
- Grade Management
- Academic Recognition

Interaction:
- Use tabs or segmented controls.
- Switching modules animates content panel and media preview.

### 5.6 Role-Based Experience

Roles:
- Super Admin
- Program Coordinator Admin
- Teacher
- Student

Interaction:
- Role switcher updates visible capability list.
- Show quick summary of what each role can and cannot do.

### 5.7 Trust and Governance Section

Key trust points:
- Rule-based deterministic engine
- Auditability and approval ownership
- Posted-only grade visibility for students
- Institutional domain controlled access

UI style:
- Status chips, icon-supported points, concise policy statements.

### 5.8 Testimonials or Campus Feedback

If official quotes are available:
- 2 to 4 short testimonials with role labels.

If quotes are not yet available:
- Replace with measurable pilot outcomes or process improvements.

### 5.9 FAQ Section

Suggested topics:
- Who can access web admin system?
- Where to download desktop app?
- How students view grades?
- Why posted-only grade visibility?
- How to get support?

Interaction:
- Accordion with smooth open/close transitions.

### 5.10 Final CTA Band

Single-line message + 3 CTA buttons:
- Open Web System
- Download Desktop App
- Get Mobile App

Behavior:
- High contrast block with clear spacing and immediate action.

### 5.11 Footer

Include:
- Domain: gradus.college
- Campus/system note
- Quick links
- Contact/support email
- Social links if available

## 6. Animation System Requirements

Motion categories:
1. Entrance motion
- Fade + translate on first section reveal.

2. Scroll-triggered motion
- Timeline line fill, section card rise, stat counter reveal.

3. Interactive motion
- Hover lift for cards, button ripple/glow, tab transitions.

4. Background ambient motion
- Very subtle floating shapes or gradient drift.

Motion safety and consistency:
- Duration target: 180ms to 500ms for most interactions.
- Easing: ease-out or ease-in-out.
- Respect reduced motion setting.
- Never block content behind long intro animation.

## 7. Responsiveness Requirements

Breakpoints:
- Mobile: 320 to 639px
- Tablet: 640 to 1023px
- Desktop: 1024px and above

Mobile behavior:
- Single-column layout first.
- Sticky bottom CTA bar for app access.
- Keep touch targets at least 44x44px.

Tablet behavior:
- Two-column modules where useful.
- Preserve scroll rhythm and readable spacing.

Desktop behavior:
- Rich hero layout with visual preview area.
- Horizontal timeline and larger interactive panels.

## 8. UI Token Strategy (PSU Theme Applied)

Use semantic tokens with the approved PSU-inspired palette:
- --brand-primary (maroon)
- --brand-primary-hover
- --accent-primary (gold)
- --accent-primary-hover
- --bg-page
- --bg-surface
- --text-primary
- --text-secondary
- --border-default
- --focus-ring

Reference:
- Full values, accessibility notes, and component mapping are defined in [Color-Scheme.md](./Color-Scheme.md).

## 9. Accessibility Requirements

Required:
1. Keyboard navigable menu, CTA buttons, and accordion.
2. Visible focus states on all interactive controls.
3. Proper heading hierarchy (H1 to H3).
4. Alt text for all non-decorative images.
5. Reduced motion mode support.
6. Sufficient color contrast after theme is selected.

## 10. Performance Requirements

Targets:
1. Fast first paint on mobile.
2. No heavy animation libraries if simple CSS/JS can handle effects.
3. Lazy-load videos, high-resolution images, and non-critical sections.
4. Use compressed media formats and responsive images.
5. Keep large background effects GPU-friendly.

## 11. SEO and Domain Structure

Canonical public site:
- gradus.college

Recommended supporting routes/subdomains:
- app.gradus.college (web system)
- download.gradus.college (desktop installers)
- gradus.college/mobile (mobile app links and QR)

SEO essentials:
- Descriptive title and meta description
- Open Graph tags
- Twitter card tags
- Structured data for software application if needed

## 12. Suggested CTA Copy

Hero CTA labels:
- Open Web System
- Download Desktop App
- Get Mobile App

Support copy examples:
- One platform for scheduling, enrollment, grading, and recognition.
- Trusted academic workflows with clear role-based governance.

## 13. Build Phases

Phase 1 (Foundation):
1. Header, Hero, Platform Access Hub, Final CTA, Footer
2. Basic responsive layout
3. Core CTA routing

Phase 2 (Content Depth):
1. Timeline, Modules Showcase, Role section, FAQ
2. Trust and governance highlights

Phase 3 (Polish):
1. Motion refinement
2. Accessibility pass
3. Performance optimization and analytics tracking

## 14. Final Implementation Checklist

1. App links are visible in header, hero, and final CTA.
2. Desktop and mobile CTA paths are tested.
3. Motion works smoothly on mid-range phones.
4. Reduced motion preference is respected.
5. Layout is fully responsive at mobile, tablet, desktop breakpoints.
6. Theme can be swapped later via tokens.
7. Domain references use gradus.college.
8. Content clearly explains what the system does and who it serves.
