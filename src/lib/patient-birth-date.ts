const MAX_PATIENT_AGE_YEARS = 150
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function formatDateOnly(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeDate(value: Date) {
  const normalized = new Date(value)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function parseDateOnly(value: string) {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

export function getLatestAllowedPatientBirthDate(today = new Date()) {
  return formatDateOnly(normalizeDate(today))
}

export function getEarliestAllowedPatientBirthDate(today = new Date()) {
  const earliestAllowedBirthDate = normalizeDate(today)
  earliestAllowedBirthDate.setFullYear(
    earliestAllowedBirthDate.getFullYear() - MAX_PATIENT_AGE_YEARS,
  )

  return formatDateOnly(earliestAllowedBirthDate)
}

export function getPatientBirthDateValidationError(
  value: string,
  today = new Date(),
) {
  if (value.length === 0) {
    return 'Date of birth is required'
  }

  if (!parseDateOnly(value)) {
    return 'Enter a valid date of birth'
  }

  if (value > getLatestAllowedPatientBirthDate(today)) {
    return 'Date of birth cannot be in the future'
  }

  if (value < getEarliestAllowedPatientBirthDate(today)) {
    return `Date of birth cannot be more than ${MAX_PATIENT_AGE_YEARS} years ago`
  }
}
