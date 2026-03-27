import { DateTime } from 'luxon'

const defaultTimeZone = 'UTC'

function getResolvedZone(timeZone?: string | null) {
  const zone = timeZone ?? defaultTimeZone
  return DateTime.now().setZone(zone).isValid ? zone : defaultTimeZone
}

function buildSlotForDay(
  localDay: DateTime,
  scheduledHour: number,
  timeZone: string,
) {
  const slot = DateTime.fromObject(
    {
      year: localDay.year,
      month: localDay.month,
      day: localDay.day,
      hour: scheduledHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    { zone: timeZone },
  )

  if (slot.isValid) {
    return slot
  }

  return localDay.startOf('day').plus({ hours: scheduledHour })
}

export function resolveTimeZone(timeZone?: string | null) {
  return getResolvedZone(timeZone)
}

export function getLocalDayBounds(timestamp: number, timeZone?: string | null) {
  const zone = getResolvedZone(timeZone)
  const localDay = DateTime.fromMillis(timestamp, { zone }).startOf('day')
  const nextLocalDay = localDay.plus({ days: 1 })

  return {
    dayStart: localDay.toUTC().toMillis(),
    nextDayStart: nextLocalDay.toUTC().toMillis(),
  }
}

export function getHistoryWindowStart(
  timestamp: number,
  daysBack: number,
  timeZone?: string | null,
) {
  const zone = getResolvedZone(timeZone)

  return DateTime.fromMillis(timestamp, { zone })
    .startOf('day')
    .minus({ days: daysBack - 1 })
    .toUTC()
    .toMillis()
}

export function getScheduledSlotTimestamps(
  timestamp: number,
  scheduledTimes: Array<number>,
  timeZone?: string | null,
) {
  const zone = getResolvedZone(timeZone)
  const localDay = DateTime.fromMillis(timestamp, { zone })

  return [...scheduledTimes]
    .sort((a, b) => a - b)
    .map((scheduledHour) => ({
      scheduledHour,
      scheduledFor: buildSlotForDay(localDay, scheduledHour, zone)
        .toUTC()
        .toMillis(),
    }))
}
