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

export function patientMedicationsQuery(patientId: Id<'patients'>) {
  return convexQuery(api.medications.listMedications, { patientId })
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

export async function prefetchQueryOnClient<T>(
  ensureQueryData: (options: T) => Promise<unknown>,
  query: T,
) {
  if (typeof window === 'undefined') {
    return
  }

  await ensureQueryData(query)
}
