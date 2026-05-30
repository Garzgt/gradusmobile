# Public Academic Achievers Ranking (Landing Page)

This document defines how the landing page can safely and clearly present academic achievers to the public.

Companion guide:
1. [AchieverUI-Guide.md](./AchieverUI-Guide.md)

## 1. Purpose

1. Celebrate academic excellence publicly.
2. Build trust in recognition workflows.
3. Provide transparent and policy-safe visibility.

## 2. Public Section Title Options

1. Academic Achievers
2. Term Honor Roll Highlights
3. Public Recognition Board

## 3. Data Visibility Rules

Show publicly:
1. Student display name based on privacy policy
2. Program
3. Recognition label
4. Rank
5. Academic term
6. Last updated timestamp

Do not show publicly:
1. Raw component scores
2. Sensitive identifiers
3. Private profile attributes
4. Draft or unposted records

## 4. Publication Preconditions

Only publish ranking when all are true:
1. Grades are posted and finalized.
2. Recognition process is completed.
3. Super Admin approval is recorded.
4. Compliance checks are passed.

## 5. Ranking Logic (Policy-Driven)

Primary rank basis:
1. Highest approved weighted result for the selected term.

Tie-break guidance:
1. Higher credit load completed first.
2. Earlier completion approval timestamp second.
3. Stable alphabetical fallback third.

## 6. UI Block Requirements

Top controls:
1. Term selector
2. Program selector
3. Refresh timestamp label

Main display:
1. Top 25 card list or compact table (always show ranks 1 to 25)
2. Rank badge style for top 3
3. Recognition label chip

Bottom area:
1. Link to recognition criteria
2. Policy disclaimer

## 7. Accessibility Requirements

1. Ranking table must be keyboard navigable.
2. Color is never the only signal for rank status.
3. Clear text labels for top 1, top 2, and top 3.
4. Readable contrast for badges and chips.

## 8. Privacy and Governance Notes

1. Public ranking display must follow institutional policy.
2. If policy requires masking, show initial-based display names.
3. Keep audit logs for publish and unpublish actions.
4. Include publication owner and timestamp in admin records.

## 9. Suggested Empty States

1. No published ranking for selected term.
2. Ranking pending final validation.
3. Data temporarily unavailable.

## 10. Suggested Microcopy

1. Powered by posted and policy-approved academic records.
2. Recognition results are published after institutional validation.
3. Rankings are updated per official term publication cycle.
