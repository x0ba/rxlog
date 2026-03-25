// ============================================================
// MOCK DATA — Delete this file and replace with real Convex queries
// ============================================================

export type MockPatient = {
  _id: string
  _creationTime: number
  name: string
  birthDate: string
}

export type MockMedication = {
  _id: string
  _creationTime: number
  patientId: string
  name: string
  dosage: string
  scheduledTimes: number[]
  active: boolean
}

export type MockUser = {
  _id: string
  _creationTime: number
  name: string
  email: string
}

export type MockPatientMember = {
  _id: string
  _creationTime: number
  patientId: string
  userId: string
  role: string
}

export type MockLog = {
  _id: string
  _creationTime: number
  patientId: string
  medicationId: string
  loggedBy: string
  takenAt: number
  missed: boolean
  notes?: string
}

// --- Users ---
export const MOCK_USERS: MockUser[] = [
  { _id: 'user_1', _creationTime: 1710000000000, name: 'Maria Santos', email: 'maria@example.com' },
  { _id: 'user_2', _creationTime: 1710000000000, name: 'James Chen', email: 'james.chen@example.com' },
  { _id: 'user_3', _creationTime: 1710000000000, name: 'Priya Patel', email: 'priya@example.com' },
]

// --- Patients ---
export const MOCK_PATIENTS: MockPatient[] = [
  { _id: 'patient_1', _creationTime: 1710000000000, name: 'Dorothy Williams', birthDate: '1942-03-15' },
  { _id: 'patient_2', _creationTime: 1710000000000, name: 'Robert Johnson', birthDate: '1938-11-22' },
]

// --- Medications ---
export const MOCK_MEDICATIONS: MockMedication[] = [
  { _id: 'med_1', _creationTime: 1710000000000, patientId: 'patient_1', name: 'Lisinopril', dosage: '10mg', scheduledTimes: [8, 20], active: true },
  { _id: 'med_2', _creationTime: 1710000000000, patientId: 'patient_1', name: 'Metformin', dosage: '500mg', scheduledTimes: [8, 14, 20], active: true },
  { _id: 'med_3', _creationTime: 1710000000000, patientId: 'patient_1', name: 'Amlodipine', dosage: '5mg', scheduledTimes: [9], active: true },
  { _id: 'med_4', _creationTime: 1710000000000, patientId: 'patient_1', name: 'Atorvastatin', dosage: '20mg', scheduledTimes: [21], active: true },
  { _id: 'med_5', _creationTime: 1710000000000, patientId: 'patient_2', name: 'Warfarin', dosage: '5mg', scheduledTimes: [18], active: true },
  { _id: 'med_6', _creationTime: 1710000000000, patientId: 'patient_2', name: 'Omeprazole', dosage: '20mg', scheduledTimes: [7], active: true },
]

// --- Patient Members ---
export const MOCK_PATIENT_MEMBERS: MockPatientMember[] = [
  { _id: 'pm_1', _creationTime: 1710000000000, patientId: 'patient_1', userId: 'user_1', role: 'primary' },
  { _id: 'pm_2', _creationTime: 1710000000000, patientId: 'patient_1', userId: 'user_2', role: 'caretaker' },
  { _id: 'pm_3', _creationTime: 1710000000000, patientId: 'patient_2', userId: 'user_1', role: 'primary' },
  { _id: 'pm_4', _creationTime: 1710000000000, patientId: 'patient_2', userId: 'user_3', role: 'caretaker' },
]

// --- Helpers ---
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function timeOnDay(daysBack: number, hour: number, minuteOffset = 0): number {
  const d = daysAgo(daysBack)
  d.setHours(hour, minuteOffset, 0, 0)
  return d.getTime()
}

// --- Logs (last 7 days for patient_1) ---
export const MOCK_LOGS: MockLog[] = [
  // Today
  { _id: 'log_1', _creationTime: timeOnDay(0, 8, 2), patientId: 'patient_1', medicationId: 'med_1', loggedBy: 'user_1', takenAt: timeOnDay(0, 8, 2), missed: false },
  { _id: 'log_2', _creationTime: timeOnDay(0, 8, 5), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(0, 8, 5), missed: false },
  { _id: 'log_3', _creationTime: timeOnDay(0, 9, 0), patientId: 'patient_1', medicationId: 'med_3', loggedBy: 'user_1', takenAt: timeOnDay(0, 9, 0), missed: false },
  // Today — afternoon/evening doses not yet taken (future)

  // Yesterday — all taken, one late
  { _id: 'log_4', _creationTime: timeOnDay(1, 8, 3), patientId: 'patient_1', medicationId: 'med_1', loggedBy: 'user_1', takenAt: timeOnDay(1, 8, 3), missed: false },
  { _id: 'log_5', _creationTime: timeOnDay(1, 8, 10), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(1, 8, 10), missed: false },
  { _id: 'log_6', _creationTime: timeOnDay(1, 9, 45), patientId: 'patient_1', medicationId: 'med_3', loggedBy: 'user_2', takenAt: timeOnDay(1, 9, 45), missed: false, notes: 'Taken a bit late' },
  { _id: 'log_7', _creationTime: timeOnDay(1, 14, 5), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(1, 14, 5), missed: false },
  { _id: 'log_8', _creationTime: timeOnDay(1, 20, 0), patientId: 'patient_1', medicationId: 'med_1', loggedBy: 'user_2', takenAt: timeOnDay(1, 20, 0), missed: false },
  { _id: 'log_9', _creationTime: timeOnDay(1, 20, 30), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_2', takenAt: timeOnDay(1, 20, 30), missed: false },
  { _id: 'log_10', _creationTime: timeOnDay(1, 21, 0), patientId: 'patient_1', medicationId: 'med_4', loggedBy: 'user_2', takenAt: timeOnDay(1, 21, 0), missed: false },

  // 2 days ago — missed one dose
  { _id: 'log_11', _creationTime: timeOnDay(2, 8, 0), patientId: 'patient_1', medicationId: 'med_1', loggedBy: 'user_1', takenAt: timeOnDay(2, 8, 0), missed: false },
  { _id: 'log_12', _creationTime: timeOnDay(2, 8, 15), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(2, 8, 15), missed: false },
  { _id: 'log_13', _creationTime: timeOnDay(2, 9, 0), patientId: 'patient_1', medicationId: 'med_3', loggedBy: 'user_1', takenAt: timeOnDay(2, 9, 0), missed: false },
  { _id: 'log_14', _creationTime: timeOnDay(2, 14, 0), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(2, 14, 0), missed: false },
  { _id: 'log_15', _creationTime: timeOnDay(2, 20, 0), patientId: 'patient_1', medicationId: 'med_1', loggedBy: 'user_1', takenAt: timeOnDay(2, 20, 0), missed: false },
  { _id: 'log_16', _creationTime: timeOnDay(2, 23, 59), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(2, 23, 59), missed: true, notes: 'Missed evening dose — was at appointment' },
  { _id: 'log_17', _creationTime: timeOnDay(2, 21, 0), patientId: 'patient_1', medicationId: 'med_4', loggedBy: 'user_1', takenAt: timeOnDay(2, 21, 0), missed: false },

  // 3 days ago — late dose
  { _id: 'log_18', _creationTime: timeOnDay(3, 10, 30), patientId: 'patient_1', medicationId: 'med_1', loggedBy: 'user_2', takenAt: timeOnDay(3, 10, 30), missed: false, notes: 'Taken late — slept in' },
  { _id: 'log_19', _creationTime: timeOnDay(3, 10, 35), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_2', takenAt: timeOnDay(3, 10, 35), missed: false },
  { _id: 'log_20', _creationTime: timeOnDay(3, 10, 40), patientId: 'patient_1', medicationId: 'med_3', loggedBy: 'user_2', takenAt: timeOnDay(3, 10, 40), missed: false },
  { _id: 'log_21', _creationTime: timeOnDay(3, 14, 0), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(3, 14, 0), missed: false },
  { _id: 'log_22', _creationTime: timeOnDay(3, 20, 0), patientId: 'patient_1', medicationId: 'med_1', loggedBy: 'user_1', takenAt: timeOnDay(3, 20, 0), missed: false },
  { _id: 'log_23', _creationTime: timeOnDay(3, 20, 10), patientId: 'patient_1', medicationId: 'med_2', loggedBy: 'user_1', takenAt: timeOnDay(3, 20, 10), missed: false },
  { _id: 'log_24', _creationTime: timeOnDay(3, 21, 15), patientId: 'patient_1', medicationId: 'med_4', loggedBy: 'user_1', takenAt: timeOnDay(3, 21, 15), missed: false },

  // Patient 2 logs
  { _id: 'log_25', _creationTime: timeOnDay(0, 7, 5), patientId: 'patient_2', medicationId: 'med_6', loggedBy: 'user_3', takenAt: timeOnDay(0, 7, 5), missed: false },
  { _id: 'log_26', _creationTime: timeOnDay(1, 7, 0), patientId: 'patient_2', medicationId: 'med_6', loggedBy: 'user_1', takenAt: timeOnDay(1, 7, 0), missed: false },
  { _id: 'log_27', _creationTime: timeOnDay(1, 18, 0), patientId: 'patient_2', medicationId: 'med_5', loggedBy: 'user_1', takenAt: timeOnDay(1, 18, 0), missed: false },
]

// --- Helpers for UI ---

export function getPatientMedications(patientId: string) {
  return MOCK_MEDICATIONS.filter((m) => m.patientId === patientId && m.active)
}

export function getPatientLogs(patientId: string) {
  return MOCK_LOGS.filter((l) => l.patientId === patientId)
}

export function getPatientMembers(patientId: string) {
  return MOCK_PATIENT_MEMBERS.filter((pm) => pm.patientId === patientId).map((pm) => ({
    ...pm,
    user: MOCK_USERS.find((u) => u._id === pm.userId)!,
  }))
}

export function getUserById(userId: string) {
  return MOCK_USERS.find((u) => u._id === userId)
}

export function getMedicationById(medId: string) {
  return MOCK_MEDICATIONS.find((m) => m._id === medId)
}

export function formatTime(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h}:00 ${ampm}`
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateFull(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export type DoseStatus = 'taken' | 'late' | 'missed' | 'pending'

export function getDoseStatus(scheduledHour: number, log?: MockLog): DoseStatus {
  if (!log) return 'pending'
  if (log.missed) return 'missed'
  const takenHour = new Date(log.takenAt).getHours()
  const diff = Math.abs(takenHour - scheduledHour)
  if (diff > 1) return 'late'
  return 'taken'
}

export function getTodaySchedule(patientId: string) {
  const meds = getPatientMedications(patientId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const todayLogs = MOCK_LOGS.filter(
    (l) => l.patientId === patientId && l.takenAt >= today.getTime() && l.takenAt <= todayEnd.getTime()
  )

  const schedule: Array<{
    medication: MockMedication
    scheduledHour: number
    log?: MockLog
    status: DoseStatus
  }> = []

  for (const med of meds) {
    for (const hour of med.scheduledTimes) {
      const matchingLog = todayLogs.find((l) => l.medicationId === med._id && Math.abs(new Date(l.takenAt).getHours() - hour) <= 2)
      schedule.push({
        medication: med,
        scheduledHour: hour,
        log: matchingLog,
        status: getDoseStatus(hour, matchingLog),
      })
    }
  }

  return schedule.sort((a, b) => a.scheduledHour - b.scheduledHour)
}
