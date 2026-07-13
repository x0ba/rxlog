# Plan 004: Minimize production PII and raw error disclosure

> **Executor instructions**: Apply only the scoped diagnostic changes and run
> the plan 002 quality gate. Update `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 1322b36..HEAD -- instrument.server.mjs src/router.tsx src/components/auth-bootstrap-error.tsx`
> Stop if telemetry initialization or the default error component was replaced.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/002-add-critical-test-baseline.md`
- **Category**: security / privacy
- **Planned at**: commit `1322b36`, 2026-07-12

## Why this matters

RxLog handles names, birth dates, medication schedules, notes, and caregiver
relationships. Both Sentry runtimes explicitly enable default PII collection,
and the production error boundary passes raw error messages to a visible detail
field despite showing a generic headline. Minimize third-party and client-facing
diagnostics by default; add only scrubbed operational context intentionally.

## Current state

- `instrument.server.mjs:3-8` initializes Sentry with `sendDefaultPii: true` and
  notes automatic IP collection.
- `src/router.tsx:60-66` enables the same option in the browser and notes request
  header/IP collection.
- `src/router.tsx:10-20` uses a generic production message but always passes
  `detail={error.message}`.
- `src/components/auth-bootstrap-error.tsx:20-22` renders `detail` whenever it is
  present.
- Development behavior already uses `import.meta.env.DEV`; preserve detailed
  local errors there.

## Commands you will need

| Purpose       | Command                     | Expected on success                              |
| ------------- | --------------------------- | ------------------------------------------------ |
| Focused tests | `bun test -- router`        | production hides details; development shows them |
| Lint/types    | `bun lint && bun typecheck` | exit 0                                           |
| Quality       | `bun run check`             | exit 0                                           |
| Build         | `bun run build`             | exit 0                                           |

## Scope

**In scope**:

- `instrument.server.mjs`
- `src/router.tsx`
- a focused error-component/router test file created under the plan 002 test convention

**Out of scope**:

- Removing Sentry or changing its DSN, sampling, retention, or dashboard settings.
- PostHog analytics policy; audit it separately with the product owner and vendor configuration.
- Changing user-facing mutation validation messages.
- Logging new patient, medication, email, birth-date, or note fields.

## Git workflow

- Branch: `advisor/004-minimize-production-diagnostics`
- Commit: `Minimize production diagnostic data`
- Do not push unless instructed.

## Steps

### Step 1: Disable default Sentry PII in both runtimes

Set `sendDefaultPii: false` in server and browser initializers. Keep the setting
explicit so future readers see the privacy decision. Do not add user identifiers
or request payloads as replacement context.

**Verify**: `rg -n 'sendDefaultPii' instrument.server.mjs src/router.tsx` returns exactly two explicit `false` settings.

### Step 2: Hide raw error details in production

Pass `detail` only when `import.meta.env.DEV` is true. Keep the generic production
message. If a correlation ID already exists in the error/telemetry stack, it may
be displayed only after confirming it contains no raw error text or user data;
otherwise leave correlation work out of scope.

**Verify**: a production-mode component test does not render a seeded internal
error string, while a development-mode test does.

### Step 3: Verify diagnostics without adding sensitive fixtures

Use synthetic messages such as `internal diagnostic sentinel`; never put real
environment values or patient data into tests/snapshots. Build both server and
client bundles.

**Verify**: `bun run check && bun run build` exits 0.

## Test plan

- Render the default error component in development and production modes, or
  extract a small pure helper that decides the safe detail.
- Assert the generic production message remains visible.
- Static-assert both Sentry initializers have default PII disabled.
- Do not snapshot full telemetry configuration.

## Done criteria

- [ ] Both Sentry initializers explicitly set `sendDefaultPii: false`.
- [ ] Production UI does not render raw router error messages.
- [ ] Development retains actionable local error details.
- [ ] No new user/patient/request metadata is added to telemetry.
- [ ] `bun run check` and `bun run build` pass.
- [ ] The status row in `plans/README.md` is updated.

## STOP conditions

- Sentry initialization moved to generated/vendor code.
- A production support contract explicitly requires raw errors or default PII;
  obtain a documented privacy decision before proceeding.
- Test environment flags cannot model production without changing global build configuration.

## Maintenance notes

Review Sentry retention and previously collected default PII in the vendor
dashboard. Separately define a PostHog allowlist before recording events from
authenticated medication screens.
