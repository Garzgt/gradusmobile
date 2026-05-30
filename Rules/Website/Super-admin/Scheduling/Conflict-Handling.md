# Conflict Handling Guide (Super Admin)

## 1. Conflict Types

1. Teacher Conflict
- Teacher assigned to overlapping classes.

2. Section Conflict
- Section has overlapping class slots.

3. Venue Conflict
- Venue is assigned to multiple classes at the same time.

4. Constraint Conflict
- Assignment breaks availability, eligibility, or policy rule.

## 2. Triage Priority

1. Blocking conflicts (must resolve before publish)
2. High operational impact conflicts
3. Remaining optimization conflicts

## 3. Standard Resolution Steps

1. Identify exact entities involved.
2. Check if source data is incorrect.
3. Apply minimal correction at source.
4. Re-run generation for impacted scope.
5. Confirm conflict is cleared.

## 4. Escalation Rules

Escalate when:
1. policy interpretation is unclear
2. cross-program resource contention persists
3. repeated conflicts indicate incorrect master data

## 5. Audit Requirements

For any manual override or forced placement, log:
- actor
- reason
- entities affected
- timestamp
- before and after state
