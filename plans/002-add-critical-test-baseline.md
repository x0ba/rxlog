# Plan 002: Add critical-path tests and a non-mutating quality gate

> **Executor instructions**: Follow every step and verification gate. Stop on a
> listed mismatch rather than inventing a different test architecture. Update
> this plan's status in `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 1322b36..HEAD -- package.json bun.lock convex src/lib .github docs/setup.md`
> Compare current package scripts and the Convex functions named below before
> proceeding.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/001-remediate-runtime-advisories.md`
- **Category**: tests / DX
- **Planned at**: commit `1322b36`, 2026-07-12

## Why this matters

Lint and typecheck pass, but RxLog has no test runner, test files, or CI. The
untested code decides who may access a patient, whether a dose is duplicated,
how DST boundaries map to schedules, and how destructive operations behave.
Establish this baseline before changing authentication, telemetry, or time
presentation.

## Current state

- `package.json:6-15` defines dev/build/lint/typecheck/format scripts but no test,
  format-check, aggregate check, or audit script.
- `package.json:13` uses `prettier --write .`, which is not a read-only check.
- `convex/logs.ts:39-156` implements taken/missed logging, slot validation, and
  duplicate prevention.
- `convex/auth.ts:58-82` is the shared patient membership/primary-role boundary.
- `convex/timezone.ts:39-129` implements day bounds, DST-aware slots, history
  windows, and export ranges.
- The repository Convex guideline requires `convex-test`, Vitest, and
  `@edge-runtime/vm`, with test files inside `convex/` and
  `const modules = import.meta.glob('./**/*.ts')` passed to `convexTest`.
- Existing code style uses single quotes, no semicolons, and named functions.

## Commands you will need

| Purpose      | Command                                          | Expected on success                            |
| ------------ | ------------------------------------------------ | ---------------------------------------------- |
| Add tools    | `bun add -d vitest convex-test @edge-runtime/vm` | exit 0                                         |
| Tests        | `bun test`                                       | all tests pass                                 |
| Format check | `bun run format:check`                           | exit 0, no writes                              |
| Aggregate    | `bun run check`                                  | format, lint, typecheck, tests, and audit pass |
| Build        | `bun run build`                                  | exit 0                                         |

## Suggested executor toolkit

- Read `convex/_generated/ai/guidelines.md` in full before editing Convex tests.
- Use `convex-test` identity helpers rather than mocking authorization functions.

## Scope

**In scope**:

- `package.json`, `bun.lock`
- `vitest.config.ts` (create)
- `convex/**/*.test.ts` (create)
- `.github/workflows/quality.yml` (create)
- `docs/setup.md`

**Out of scope**:

- Production behavior changes.
- Browser E2E infrastructure and visual tests.
- Refactoring the patient settings route.
- Existing unrelated dirty files.

## Git workflow

- Branch: `advisor/002-critical-test-baseline`
- Commit: `Add critical path test baseline`
- Do not push unless instructed by the operator.

## Steps

### Step 1: Install and configure the Convex test runner

Install the latest compatible Vitest, `convex-test`, and edge VM packages. Create
`vitest.config.ts` with the edge runtime environment required by the Convex
guideline. Add `test`, `test:watch`, `format:check`, `audit:production`, and
`check` scripts. `check` must be non-mutating and run format-check, lint,
typecheck, tests, and production audit.

**Verify**: `bun test -- --passWithNoTests` exits 0 before tests are added, and
`bun run format:check` does not change `git status`.

### Step 2: Characterize timezone behavior

Create `convex/timezone.test.ts` and directly test exported pure functions. Cover:

- normal UTC day bounds;
- a spring-forward day and fall-back day in `America/Los_Angeles`;
- slot ordering and timestamp identity;
- invalid timezone fallback to UTC;
- valid and reversed ISO date ranges.

Use fixed timestamps and assert exact millisecond results or exact local-hour
round trips, never the machine's current timezone.

**Verify**: `bun test convex/timezone.test.ts` passes with at least six focused assertions.

### Step 3: Characterize auth and medication logging

Create Convex tests using `convexTest(schema, modules)`. Seed users, patients,
memberships, and medications through the test database; apply identities with
the test library's supported identity helper. Cover:

- unauthenticated and non-member logging rejection;
- caretaker logging success;
- invalid scheduled slot rejection;
- duplicate taken/taken and taken/missed rejection;
- taken versus late status around the one-hour boundary;
- archived medication rejection.

Do not mock `requirePatientMembership`; exercise the real function graph.

**Verify**: the focused logs test command passes and includes both authorization
and duplicate-dose cases.

### Step 4: Characterize invite and destructive invariants

Add tests for primary-only invitation/team changes, email matching on acceptance,
and deletion of a patient with logs, medications, memberships, and pending
invites. For known bugs not yet fixed by plans, use `it.todo` with the exact
expected invariant rather than asserting the buggy result.

**Verify**: `bun test` passes; TODO tests are named for plans/findings rather than silently skipped.

### Step 5: Add pull-request CI and update setup docs

Create a minimal GitHub Actions workflow using the repository's Bun lockfile.
Install with a frozen lockfile and run `bun run check` plus `bun run build` on
pull requests and default-branch pushes. Update `docs/setup.md` to distinguish
`bun format` (write) from `bun run format:check` and `bun run check` (read-only).

**Verify**: inspect the workflow YAML, then run the same install/check/build
commands locally with exit 0.

## Test plan

This plan is the test plan. Minimum coverage is the explicit cases in steps 2–4.
Prefer behavioral assertions on returned documents and errors over snapshots.
Keep test data small and deterministic.

## Done criteria

- [ ] `bun test` exits 0 with meaningful timezone, auth, log, invite, and deletion tests.
- [ ] `bun run format:check`, `bun lint`, and `bun typecheck` exit 0.
- [ ] `bun audit --production` has no critical/high advisories.
- [ ] `bun run check` is non-mutating and exits 0.
- [ ] `bun run build` exits 0.
- [ ] Pull-request CI runs the same quality gate.
- [ ] `docs/setup.md` accurately distinguishes check and write commands.
- [ ] The status row in `plans/README.md` is updated.

## STOP conditions

- Plan 001 has not cleared critical/high production advisories.
- The current Convex test library API differs from the repository guideline and
  cannot model authenticated identities without production changes.
- A test requires live Clerk, Convex, RxNorm, or network access.
- Existing source behavior must be changed to make the baseline pass; record a
  TODO regression test and leave the behavior for its dedicated plan.

## Maintenance notes

Every future bug fix should first convert its corresponding TODO into a failing
test. Keep `check` read-only so humans and CI can run it without dirtying the
working tree.
