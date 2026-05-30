# Publish And Regenerate (Super Admin)

## 1. Publication Gate

Publish only when all are true:
1. active term is correct
2. no hard conflicts remain
3. required section coverage is acceptable
4. review and approval checks are complete

## 2. Regeneration Modes

1. Full Regeneration
- Use for wide structural changes.

2. Scoped Regeneration
- Use for selected sections, teachers, or programs.

3. Targeted Correction Run
- Use for specific conflict repairs.

## 3. Safe Regeneration Practices

1. Capture baseline snapshot before re-run.
2. Prefer smallest possible scope.
3. Validate impact before publish.
4. Keep change reason in logs.

## 4. Publication History Essentials

Each publication should store:
- publication id
- scope
- actor
- timestamp
- summary of changes
- rollback reference

## 5. Rollback Guidance

Rollback is allowed when:
1. published schedule introduced critical conflict
2. incorrect scope was published
3. governance review requires previous stable set

After rollback:
1. communicate impact
2. run corrective regeneration
3. publish corrected set with full audit trail
