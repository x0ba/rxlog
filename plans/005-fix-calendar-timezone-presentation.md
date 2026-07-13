# Plan 005: Make patient calendar and timezone presentation consistent

> **Executor instructions**: Preserve stored values and backend schedule
> semantics; this plan changes validation helpers and presentation only. Run all
> verification gates and update `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 1322b36..HEAD -- src/lib/patient-birth-date.ts src/routes/_authed/dashboard/index.tsx src/routes/_authed/dashboard/patients/\$patientId.tsx src/routes/_authed/dashboard/patients/\$patientId/index.tsx src/routes/_authed/dashboard/patients/\$patientId/export.tsx convex/timezone.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/002-add-critical-test-baseline.md`
- **Category**: bug
- **Planned at**: commit `1322b36`, 2026-07-12

## Why this matters

Birth dates are calendar dates, not instants. Parsing `YYYY-MM-DD` with
`new Date()` shifts the displayed day for users west of UTC, and current age is
one year too high before the birthday. Separately, the backend builds “today” in
the patient's timezone while the daily screen labels that data in the viewer's
timezone. A caregiver traveling or living elsewhere can therefore see a correct
schedule under the wrong date/time labels.

## Current state

- `src/lib/patient-birth-date.ts:18-35` already parses date-only values into
  local calendar components for validation; extend this single convention.
- `src/routes/_authed/dashboard/patients/$patientId.tsx:127-131` calls
  `new Date(patient.birthDate).toLocaleDateString(...)`.
- `src/routes/_authed/dashboard/index.tsx:173-174` computes age from year
  subtraction only; `formatInviteMetadataDate` also parses birth-date strings as
  instants.
- `convex/logs.ts:246-256` computes the daily range from `patient.timezone`.
- `src/routes/_authed/dashboard/patients/$patientId/index.tsx:95-99` formats log
  timestamps without a timezone and `:330-334` labels the viewer's local day.
- `src/routes/_authed/dashboard/patients/$patientId/export.tsx:50-58` derives
  default date inputs with UTC `toISOString`, not the patient timezone.
- Existing timestamp formatting in history passes `timeZone` explicitly via
  `Intl.DateTimeFormat` (`history.tsx:73-100`); match that pattern.

## Commands you will need

| Purpose       | Command                                   | Expected on success |
| ------------- | ----------------------------------------- | ------------------- |
| Focused tests | `bun test -- patient-birth-date timezone` | all pass            |
| Lint/types    | `bun lint && bun typecheck`               | exit 0              |
| Quality       | `bun run check`                           | exit 0              |
| Build         | `bun run build`                           | exit 0              |

## Scope

**In scope**:

- `src/lib/patient-birth-date.ts`
- its test file under the plan 002 convention
- `src/routes/_authed/dashboard/index.tsx`
- `src/routes/_authed/dashboard/patients/$patientId.tsx`
- `src/routes/_authed/dashboard/patients/$patientId/index.tsx`
- `src/routes/_authed/dashboard/patients/$patientId/export.tsx`

**Out of scope**:

- Stored birth-date or timezone migrations.
- Changing the one-hour taken/late policy.
- Editable patient timezones or medication schedules.
- Historical medication activation intervals.
- PDF export implementation.

## Git workflow

- Branch: `advisor/005-calendar-timezone-presentation`
- Commit: `Fix patient calendar and timezone presentation`
- Do not push unless instructed.

## Steps

### Step 1: Centralize date-only formatting and age

In `src/lib/patient-birth-date.ts`, expose pure helpers that parse validated
`YYYY-MM-DD` components, format them for `en-US` without constructing a UTC
instant, and calculate age using year/month/day against an injectable `today`.
Invalid input must return a safe null/placeholder contract consistent with the
callers; do not silently normalize impossible dates.

**Verify**: tests cover `2000-12-31` without day shift, birthday today, birthday
tomorrow, leap-day birthdays, and invalid dates.

### Step 2: Replace every birth-date instant parse

Use the shared helpers in the patient header, dashboard age badge, and incoming
invite metadata. Keep date-time invite expiry values using `Date` because those
are timestamps; only patient birth-date strings use calendar helpers.

**Verify**: `rg -n 'new Date\([^)]*birthDate' src` returns no matches, and focused tests pass under `TZ=America/Los_Angeles` and `TZ=UTC`.

### Step 3: Format the daily screen in the patient timezone

Read `patientSummaryQuery` in the daily child screen (the parent already keeps
the same query warm) and pass `patient.timezone` to timestamp/day formatters.
The heading must represent the same patient-local day used by the backend query.
Preserve optimistic mutation behavior and schedule keys exactly.

**Verify**: a fixed instant near midnight renders the expected patient-local date
and time when viewer and patient zones differ.

### Step 4: Derive report defaults in the patient timezone

Wait for the patient summary before deriving initial report dates, or use a pure
timezone helper with the cached summary. Replace UTC `toISOString()` date
extraction with explicit `Intl.DateTimeFormat('en-CA', { timeZone, ... })` (or the
existing equivalent convention). Preserve the intended inclusive range length
and avoid resetting user-edited dates when query data refreshes.

**Verify**: tests cover a UTC instant that is the previous/next day in the
patient zone and assert stable initial form values.

## Test plan

- Pure date-only helper tests are required and must run under at least UTC and a
  negative-offset timezone.
- Add component/helper tests for a viewer in UTC with a patient in
  `America/Los_Angeles`, and the reverse.
- Cover DST transition days already characterized by plan 002.
- Do not use the current clock without fake/fixed time.

## Done criteria

- [ ] Patient DOB never shifts with browser timezone.
- [ ] Age accounts for whether the birthday has occurred this year.
- [ ] Daily heading and taken timestamps use the patient timezone.
- [ ] Export default dates use the patient timezone without overwriting edits.
- [ ] Existing backend schedule timestamps and stored data are unchanged.
- [ ] `bun run check` and `bun run build` pass.
- [ ] The status row in `plans/README.md` is updated.

## STOP conditions

- The product intends birth dates to represent instants rather than calendar dates.
- The parent/child query arrangement cannot provide patient timezone without a
  new network waterfall; redesign query composition rather than adding one.
- Fixing export defaults requires changing report range semantics.
- Any change touches backend stored timestamps or medication status policy.

## Maintenance notes

Use date-only helpers for all future DOB/calendar fields and timezone-aware
formatters for all medication instants. Reviewers should test with viewer and
patient in different zones, especially near midnight and DST transitions.
