# Plan 001: Remediate critical runtime advisories

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before continuing. If a
> STOP condition occurs, report it rather than improvising. Update this plan's
> row in `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 1322b36..HEAD -- package.json bun.lock`
> Also run `git diff -- package.json bun.lock` because `package.json` was already
> modified but uncommitted when this plan was written. If the dependency ranges
> or lockfile versions below no longer match, stop and reconcile the advisory
> ranges before updating.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security / migration
- **Planned at**: commit `1322b36`, 2026-07-12

## Why this matters

`bun audit --production` reports two critical and twenty high advisories. The
critical path includes the Clerk SDK used for route authentication, while other
high findings affect TanStack Start, Vite, Convex's websocket stack, and
PostHog's protobuf dependency. Patch compatible release lines first so the app
does not carry known authorization or code-execution advisories while broader
major migrations remain optional.

## Current state

- `package.json:17` declares `@clerk/tanstack-react-start` as `^0.29.8`; the
  lockfile resolves `0.29.9` with affected Clerk transitive packages.
- `package.json:21` declares `@tanstack/react-start` as `^1.167.13`; the lockfile
  resolves `@tanstack/start-server-core@1.167.9`, below the audited fixed range.
- `bun.lock:827` resolves `convex@1.34.1` and `ws@8.18.0`.
- `bun.lock:1353-1371` resolves `posthog-js@1.364.7` and `protobufjs@7.5.4`.
- `bun.lock:1595` resolves `vite@7.3.1`.
- `shadcn` is a build-time CLI but is currently under production dependencies.
- The repository uses Bun and commits `bun.lock`. Existing commit messages are
  terse imperatives, e.g. `Refresh dependencies and sign-in route docs`.

## Commands you will need

| Purpose                       | Command                  | Expected on success                             |
| ----------------------------- | ------------------------ | ----------------------------------------------- |
| Baseline                      | `bun audit --production` | nonzero now; save the critical/high list        |
| Available compatible versions | `bun outdated`           | shows update candidates without changing files  |
| Install                       | `bun install`            | exit 0; lockfile consistent                     |
| Lint                          | `bun lint`               | exit 0, zero warnings                           |
| Types                         | `bun typecheck`          | exit 0, no errors                               |
| Format                        | `bun format`             | exit 0; only in-scope files change              |
| Audit                         | `bun audit --production` | zero critical/high reachable runtime advisories |

## Scope

**In scope**:

- `package.json`
- `bun.lock`

**Out of scope**:

- Major-version migrations such as Clerk 1.x, Vite 8, TypeScript 7, or ESLint 10.
- Application source changes to accommodate optional new APIs.
- Existing `.agents/`, `convex/_generated/ai/`, `skills-lock.json`, and
  `vite.config.ts` working-tree changes.

## Git workflow

- Branch: `advisor/001-runtime-advisories`
- Commit: `Remediate runtime dependency advisories`
- Do not push unless the operator explicitly requests it.

## Steps

### Step 1: Capture the affected dependency paths

Run `bun audit --production` and record only package names, advisory IDs, and
affected ranges in the PR description. Never copy environment values printed by
the package manager.

**Verify**: `bun pm ls --all | rg '(@clerk|@tanstack/start-server-core|protobufjs|vite@|ws@)'` shows the affected versions listed above.

### Step 2: Update compatible direct dependencies

Update the existing release lines to at least these audited candidates, or a
newer compatible patch available at execution time:

- `@clerk/tanstack-react-start` `0.29.13` or newer 0.29.x
- `@tanstack/react-start` `1.168.27` or newer compatible 1.x
- `convex` `1.42.1` or newer compatible 1.x
- `posthog-js` `1.399.2` or newer compatible 1.x
- `vite` `7.3.6` or newer 7.x

Use targeted `bun add`/`bun add -d` commands so `package.json` records the
minimum intended ranges. Move `shadcn` to `devDependencies`; it is invoked only
as a CLI and is not imported by runtime code. Do not run a blanket major update.

**Verify**: `bun pm ls --all | rg '(@clerk/tanstack-react-start|@tanstack/start-server-core|convex@|posthog-js|protobufjs|vite@|ws@)'` shows versions outside every critical/high affected range reported in step 1.

### Step 3: Validate the updated graph

Run install, lint, typecheck, and the production audit. If a high/critical
advisory remains only through a build-time tool, move that tool to
`devDependencies` if accurate; do not add arbitrary overrides that create an
unsupported graph.

**Verify**: `bun audit --production` reports no critical/high advisory reachable from production dependencies.

### Step 4: Format and review only dependency files

Run `bun format`, then discard no user changes. If formatting touches files
outside scope because they were already unformatted, restore those hunks only
with an explicit patch that preserves the user's original contents; do not use
destructive checkout/reset commands.

**Verify**: `git status --short` shows only `package.json`, `bun.lock`, and the
operator's pre-existing files; `git diff --check -- package.json bun.lock` exits 0.

## Test plan

- This plan intentionally performs no source migration.
- Run `bun lint`, `bun typecheck`, and `bun run build` to catch package API or
  peer-dependency incompatibilities.
- Exercise sign-in and one authenticated dashboard load manually before release
  because the highest-risk update is the auth adapter.

## Done criteria

- [ ] `bun audit --production` has zero critical/high reachable advisories.
- [ ] `bun lint`, `bun typecheck`, and `bun run build` exit 0.
- [ ] `bun format` has been run and no unrelated formatting is staged.
- [ ] Clerk sign-in and authenticated dashboard loading are smoke-tested.
- [ ] No major-version migration or unsupported resolution override was added.
- [ ] The status row in `plans/README.md` is updated.

## STOP conditions

- A compatible patched Clerk/TanStack combination cannot be resolved without a
  major upgrade.
- The auth adapter's peer requirements conflict with the current TanStack stack.
- A remaining critical/high advisory has no patched compatible release.
- Updating dependencies requires editing application source; create a separate
  migration plan instead of widening this one.

## Maintenance notes

Add production dependency auditing to the quality workflow in plan 002. Review
whether Bun's audit output classifies build-only tools correctly before treating
all future advisories as runtime exposure.
