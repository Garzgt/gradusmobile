# Scheduling Rules (Super Admin)

This document defines mandatory scheduling rules for GRADUS.

## 1. Hard Constraints (Must Never Break)

1. A teacher cannot be assigned to overlapping time slots.
2. A section cannot have overlapping classes.
3. A venue cannot be double-booked in the same slot.
4. Subject prerequisites must be respected.
5. Capacity-sensitive classes must use valid venue type and size.

## 2. Academic Policy Constraints

1. Schedule generation must target the active academic term only.
2. Year level and program alignment must be respected.
3. Approved curriculum version must be used per program.
4. Day and time restrictions from policy must be enforced.

## 3. Teacher Constraints

1. Teacher availability must be treated as blocking constraints.
2. Subject assignment eligibility must be checked before placement.
3. Employment and load policies must be respected.
4. Manual override actions require reason logging.

## 4. Venue Constraints

1. Venue type must match class type requirements.
2. Program-restricted venues can only be used by allowed programs.
3. Inactive venues must be excluded.

## 5. Publication Rules

1. Only published schedules are enrollment-valid.
2. Publication requires conflict review completion.
3. Any publish or unpublish action must be auditable.
4. Rollback context must be retained in publication history.

## 6. Governance Rules

1. Super Admin can override only with recorded reason.
2. Cross-program consistency has priority over local preference.
3. Data corrections should happen at source tables, not by repeated manual patching.
