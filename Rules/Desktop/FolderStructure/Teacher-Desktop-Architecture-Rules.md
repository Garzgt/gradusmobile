# Teacher Desktop Architecture Rules (Electron)

These rules define the required architecture for the GRADUS teacher desktop app.

## 1. Core Architecture

1. Use Feature-Based Modular Architecture.
2. Use Vertical Slice Architecture for renderer features.
3. Keep Electron main and preload strictly separated from renderer UI.

## 2. Electron Process Boundaries

1. Main process handles windows, app lifecycle, secure IPC, and OS integrations.
2. Preload exposes a safe bridge API only.
3. Renderer never accesses Node APIs directly.
4. All privileged actions must go through controlled IPC channels.

## 3. Renderer Feature Slice Rule

Minimum slice format:

```text
FeatureName/
|-- components/
|-- services/
|-- FeaturePage.jsx
`-- FeaturePage.module.css
```

## 4. Grading Pipeline Rule

Architecture must preserve deterministic grading pipeline:
1. settings
2. attendance and components
3. midterm and final-term computation
4. final grade and equivalent
5. draft to posted transition

## 5. Visibility And Posting Rule

1. Draft grades are internal only.
2. Posted grades are the only student-visible state.
3. Posting actions require validation and audit logging.
4. Reopen requests must follow explicit policy-gated workflow.

## 6. Offline And Sync Rule

1. Teacher encoding must support offline continuation.
2. Pending changes go to an offline queue.
3. Sync service resolves queued operations when online.
4. UI must show clear sync status and conflict outcomes.

## 7. Local Storage Rule

1. Store offline queue and cached records in local encrypted storage.
2. Apply deterministic local schema migrations on app startup.
3. Keep queue operations atomic to prevent partial sync writes.
4. Clear auth-sensitive local data on logout.

## 8. Responsive Layout Rule

1. Teacher desktop pages must remain fully usable from compact window width to full-screen desktop.
2. Keep breakpoints centralized in shared config or style tokens.
3. Sidebar must support collapsed and drawer modes for narrower widths.
4. Data-heavy views (attendance and gradebook) must provide compact table behavior without hidden critical actions.
5. No core workflow page should require horizontal scrolling to complete primary tasks.

## 9. Styling Rule

1. CSS Modules first for renderer features.
2. Shared tokens and motion styles in src/styles.
3. Keep colors and spacing consistent with teacher theme docs.

## 10. Animation Rule

1. Motion must support clarity, not distraction.
2. Use shared animation wrappers and hooks.
3. Respect reduced-motion preference.
4. Avoid long blocking transitions.

## 11. Security Rule

1. Validate IPC payloads in preload and main handlers.
2. Restrict external navigation and shell actions.
3. Keep secrets and admin credentials out of renderer.
4. Logout must revoke session and remove local auth artifacts.

## 12. Testing Rule

1. Unit tests for formula helpers and validators.
2. Integration tests for draft/posted transitions.
3. E2E tests for key teacher workflow slices.
