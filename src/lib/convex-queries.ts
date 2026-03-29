import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function profileQuery() {
  return convexQuery(api.users.profile, {})
}

export function patientsListDigestQuery() {
  return convexQuery(api.patients.listPatientsDigest, {})
}

export function patientSummaryQuery(patientId: Id<'patients'>) {
  return convexQuery(api.patients.getPatientSummary, { patientId })
}

export async function ensureQueryDataOnClient<T>(
  ensureQueryData: (options: T) => Promise<unknown>,
  query: T,
) {
  if (typeof window === 'undefined') {
    return undefined
  }

  return await ensureQueryData(query)
}

export async function ensurePatientAccessOnClient(
  ensureQueryData: (
    options: ReturnType<typeof patientSummaryQuery>,
  ) => Promise<unknown>,
  patientId: Id<'patients'>,
) {
  return await ensureQueryDataOnClient(
    ensureQueryData,
    patientSummaryQuery(patientId),
  )
}

export function patientMedicationsQuery(patientId: Id<'patients'>) {
  return convexQuery(api.medications.listMedications, { patientId })
}

export function patientTeamQuery(patientId: Id<'patients'>) {
  return convexQuery(api.invites.getPatientTeam, { patientId })
}

export function incomingInvitesQuery() {
  return convexQuery(api.invites.listIncomingInvites, {})
}

export function todayScheduleDigestQuery(patientId: Id<'patients'>) {
  return convexQuery(api.logs.getTodayScheduleDigest, { patientId })
}

export function patientHistoryQuery(
  patientId: Id<'patients'>,
  daysBack: 7 | 14 | 30,
  medicationId?: Id<'medications'>,
) {
  return convexQuery(api.logs.getHistory, {
    patientId,
    daysBack,
    ...(medicationId ? { medicationId } : {}),
  })
}

export function patientExportPreviewQuery(
  patientId: Id<'patients'>,
  startDate: string,
  endDate: string,
) {
  return convexQuery(api.logs.getExportPreview, {
    patientId,
    startDate,
    endDate,
  })
}

export async function prefetchQueryOnClient<T>(
  ensureQueryData: (options: T) => Promise<unknown>,
  query: T,
) {
  await ensureQueryDataOnClient(ensureQueryData, query)
}
