# Plan 003: Lock down exposed Convex surfaces and bound RxNorm work

> **Executor instructions**: Follow the plan in order and use the tests from
> plan 002 as regression gates. Update `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 1322b36..HEAD -- convex/users.ts convex/medicationCatalog.ts convex/auth.ts convex/medications.ts src/routes/_authed/dashboard/patients/\$patientId/settings.tsx`
> Stop if the public functions or the cache flow no longer match the excerpts.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/002-add-critical-test-baseline.md`
- **Category**: security / performance
- **Planned at**: commit `1322b36`, 2026-07-12

## Why this matters

`getUserById` returns raw identity-provider fields without authentication and has
no repository callers. `searchMedicines` is also public and unauthenticated, then
performs an outbound request and writes every upstream result before returning a
maximum of ten. Close the unused data leak and ensure legitimate medicine search
has a strict, authenticated work budget.

## Current state

- `convex/users.ts:59-65`:

  ```ts
  export const getUserById = query({
    args: {
      id: v.id('users'),
    },
    handler: async (ctx, args) => {
      return await ctx.db.get('users', args.id)
    },
  })
  ```

  The raw document includes `authIdentifier`, `clerkUserId`, email, image URL,
  and deletion state. Repository search found no callers.

- `convex/medicationCatalog.ts:223-240` normalizes a query and calls RxNav without
  reading `ctx.auth`.
- `convex/medicationCatalog.ts:261-290` normalizes the full response, passes all
  results to `cacheSearchResults`, and only then slices the response.
- `PLAN.md:123-133` explicitly records caching and conservative schedule defaults
  as product decisions. Preserve those decisions; bound caching rather than
  silently removing it.
- Backend authorization helpers throw `Error('Unauthorized')`; public patient
  mutations use shared membership helpers in `convex/auth.ts`.

## Commands you will need

| Purpose       | Command                                                          | Expected on success |
| ------------- | ---------------------------------------------------------------- | ------------------- |
| Focused tests | `bun test convex/users.test.ts convex/medicationCatalog.test.ts` | all pass            |
| Full tests    | `bun test`                                                       | all pass            |
| Lint/types    | `bun lint && bun typecheck`                                      | exit 0              |
| Quality       | `bun run check`                                                  | exit 0, no writes   |

## Scope

**In scope**:

- `convex/users.ts`
- `convex/medicationCatalog.ts`
- `convex/users.test.ts`
- `convex/medicationCatalog.test.ts`

**Out of scope**:

- Personalized medical advice or changes to documented schedule defaults.
- A new catalog schema, medication label ingestion, or full-text search.
- Client UI redesign and rate-limit vendors.
- Other Convex query performance work.

## Git workflow

- Branch: `advisor/003-lock-down-convex-surfaces`
- Commit: `Lock down public Convex surfaces`
- Do not push unless instructed by the operator.

## Steps

### Step 1: Remove the raw user endpoint

Delete `getUserById` from `convex/users.ts` and remove now-unused imports. Do not
replace it with another public query because there are no callers. If a new
caller appeared after this plan was written, stop and document its minimum data
and authorization relationship before designing a replacement.

**Verify**: `rg 'getUserById' convex src -g '!convex/_generated/**'` returns no application matches; generated API changes are handled by normal Convex code generation.

### Step 2: Require authentication before medicine search work

At the beginning of the action handler, call `ctx.auth.getUserIdentity()` and
reject a missing identity before normalizing the query or calling `fetch`. Do not
accept a user ID argument. Keep short queries returning `[]` only after identity
has been established so unauthenticated callers cannot probe behavior.

**Verify**: a Convex test calls the action without identity, receives
`Unauthorized`, and confirms the fetch stub was not invoked.

### Step 3: Enforce a single result/work bound

Deduplicate and sort the upstream concepts, then slice to the clamped requested
limit before mapping cache payloads or calling `cacheSearchResults`. The internal
mutation must receive at most ten results. Preserve result ordering and the
documented cached-row behavior for those selected results.

Extract a pure normalization/ranking helper if necessary to test a large fake
response without invoking a live network request. Do not persist hundreds of
discarded concepts.

**Verify**: a test feeds more than ten ranked concepts and asserts at most the
requested limit reaches the cache function and response, in the same order.

### Step 4: Cover failure and success contracts

Test authenticated short-query behavior, upstream non-OK responses, deduplication,
limit clamping at 1 and 10, and unauthenticated rejection. Stub `fetch`; tests
must not call RxNav.

**Verify**: focused and full test commands pass with zero network access.

## Test plan

- `convex/users.test.ts`: generated/public API no longer exposes the raw lookup,
  or a static source/API assertion if generated typings update asynchronously.
- `convex/medicationCatalog.test.ts`: no-identity rejection before fetch;
  authenticated bounded results; duplicate RxCUI removal; non-OK upstream error;
  lower/upper limit clamping.
- Use source-shaped response fixtures containing no real patient data.

## Done criteria

- [ ] No public raw-user lookup remains.
- [ ] Unauthenticated medicine search performs no fetch or database write.
- [ ] A search caches and returns no more than ten concepts.
- [ ] Existing ordering, free-text fallback, and documented schedule suggestions remain unchanged.
- [ ] `bun run check` and `bun run build` exit 0.
- [ ] No files outside scope are modified except generated Convex artifacts if the repository convention requires them.
- [ ] The status row in `plans/README.md` is updated.

## STOP conditions

- A real client caller for `getUserById` exists.
- Authentication is unavailable in the Convex action runtime after the plan 001 upgrade.
- Bounded caching requires a schema migration.
- Tests can pass only by calling the live RxNorm service.

## Maintenance notes

If search volume later justifies caching, add a measured TTL-backed read path and
per-identity limits as separate work. Preserve the rule that authorization and
cheap input rejection happen before external work.
