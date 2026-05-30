# Teacher Desktop Animation Blueprint

This blueprint defines desktop motion behavior for a polished and efficient teacher experience.

## 1. Motion Goals

1. Make dense grading workflows easier to scan.
2. Highlight state changes clearly.
3. Keep interactions responsive and lightweight.

## 2. Required Animation Targets

1. Screen transitions between sidebar modules
2. Grade row state updates (draft, edited, posted)
3. Offline and sync status transitions
4. Validation feedback highlights
5. Export completion feedback

## 3. Required Shared Animation Units

1. FadeInPanel
2. StaggeredRows
3. PulseHighlight
4. Skeleton and shimmer states

## 4. Timing Guidance

1. Row highlight pulse: 160ms to 220ms
2. Panel transition: 180ms to 260ms
3. Sidebar page switch: 220ms to 320ms
4. Toast feedback entrance: 140ms to 200ms

## 5. UX Safety Rules

1. Never block grade editing while animation runs.
2. Avoid large motion in data-dense tables.
3. Keep attention cues focused on changed rows only.
4. Respect reduced-motion settings globally.

## 6. High-Value Animated Moments

1. Draft save confirmation in gradebook
2. Post grades success transition
3. Sync-reconnected status transition
4. Export generated success feedback

## 7. Responsive Motion Rule

1. Reduce non-essential motion as window width gets smaller.
2. Keep sidebar collapse and drawer transitions short and predictable.
3. Avoid row-level animation overload in dense compact table mode.
4. Preserve visible validation and status feedback in every viewport size.
