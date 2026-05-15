# Medicine Database Search + Suggested Defaults Plan

## Goal

When adding a new medicine, users should be able to search a reputable online medicine database by name, select a result, and have the add-medication form populated with suggested values for:

- Medication name
- Dosage / strength
- Scheduled time(s)

## Proposed data sources

### Primary: NIH RxNav / RxNorm

- Reputable, public, no API key required.
- Good for normalized medicine names, RxCUIs, ingredient/brand relationships, dose form, route, and strength strings.
- Useful endpoints:
  - `getDrugs.json?name=<query>` for medication search.
  - `rxcui/<rxcui>/properties.json` for normalized display properties.
  - `rxcui/<rxcui>/allrelated.json` for related strengths/forms.

### Secondary: DailyMed / openFDA labeling, if needed

- Reputable FDA/NLM label data.
- Better for human-readable dosage/admin sections, but the data is not reliably structured into exact app-ready dose + time values.
- Could be used later to enrich suggestions or display source-backed context.

## Important limitation

Public medicine databases usually do **not** provide a single universally correct schedule like “8, 20” for a medication. Dosing schedules depend on diagnosis, age, weight, formulation, prescriber instructions, renal/hepatic function, and more.

Because of that, my proposed implementation will:

1. Populate **name** and **dosage/strength** directly from RxNorm when available.
2. Populate **scheduledTimes** from a conservative frequency-derived default only when the selected database result clearly implies a frequency or common interval, otherwise leave it editable.
3. Label these as suggestions, not medical advice.

If you want strict “only values directly present in a database,” we should likely avoid auto-populating scheduled times unless we parse label text and can cite a dosage/admin statement, which will be less consistent.

## Implementation steps

### 1. Backend Convex API

Create/replace `convex/medicationCatalog.ts` functions:

- `searchMedicines` as a Convex action, not mutation, because it performs external `fetch()` calls.
- Arguments:
  - `query: string`
  - possibly `limit?: number`
- Behavior:
  - Reject queries shorter than 2 characters.
  - Call RxNav with a debounced/frontend-driven search query.
  - Normalize results into compact objects:
    - `source: 'rxnav'`
    - `rxnormCui`
    - `displayName`
    - `genericName?`
    - `brandName?`
    - `strength?`
    - `dosageForm?`
    - `route?`
    - `suggestedDosage?`
    - `suggestedScheduledTimes?`
    - `suggestionReason?`
  - Return bounded results, e.g. top 8–10.
  - Handle network/API failures with a safe empty result or explicit error message.

I do **not** plan to cache search results in Convex initially unless you want it. RxNav is public and search result caching raises schema/migration concerns. The existing `medicationDatabase` table can support caching later.

### 2. Optional persistence link

Update `addMedication` to accept an optional catalog reference payload, likely:

- `catalogMedicationId` if cached locally, or
- a simple `catalogSource`/`catalogId` pair if we avoid caching.

Current schema has `catalogMedicationId: v.optional(v.id('medicationDatabase'))`, so if we avoid caching, we can leave persistence unchanged and only save the final user-approved name/dosage/times.

### 3. Frontend add-medication UX

In `src/routes/_authed/dashboard/patients/$patientId/settings.tsx`:

- Replace the plain medication name input with a searchable combobox/autocomplete.
- Use TanStack Query to call `api.medicationCatalog.searchMedicines` when the user types at least 2 characters.
- Debounce the query to avoid excessive API calls.
- Show compact search results with name + strength/form metadata.
- On selection:
  - Fill `name` with normalized display name.
  - Fill `dosage` with strength/suggested dosage when available.
  - Fill `scheduledTimes` with suggested times when available.
  - Preserve manual editability for all fields.
- Add helper copy like: “Suggestions come from RxNorm metadata and are not a substitute for your prescription label.”

### 4. Suggested schedule mapping

Default mappings, pending your approval:

- Once daily → `8`
- Twice daily / every 12 hours → `8, 20`
- Three times daily / every 8 hours → `8, 14, 20`
- Four times daily / every 6 hours → `6, 12, 18, 22`
- Bedtime/nightly → `21`
- Morning → `8`

These will only apply when a selected record or parsed source text has a recognizable frequency. Otherwise the field remains blank.

### 5. Safety, performance, and security

- Perform external medicine search server-side via Convex action so browser clients do not directly depend on third-party API behavior.
- Bound query length and result count.
- Avoid storing raw third-party response payloads.
- Keep the existing optimistic add-medication behavior.
- Ensure form remains usable if the medicine database is unavailable.

### 6. Validation and completion

After implementation:

- Run `bun lint`
- Run `bun typecheck`
- Run `bun format`

## Decisions

1. Source of truth: RxNorm/RxNav.
2. Scheduled times: conservative app defaults are acceptable.
3. Cache all returned search results into `medicationDatabase`.
4. Scope: US-only.
5. Free-text medication entry remains fully supported.

## Implementation note

RxNorm reliably provides names, RxCUIs, dose forms, routes, and strengths, but not patient-specific administration times. The implementation will therefore populate dosage from RxNorm strength/name metadata and scheduled time with a conservative once-daily default (`8`) unless a recognizable frequency phrase appears in returned metadata. All values remain editable before saving.
