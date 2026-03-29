import { createFileRoute } from '@tanstack/react-router'
import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock, X } from 'lucide-react'
import type { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  ensurePatientAccessOnClient,
  patientHistoryQuery,
  patientMedicationsQuery,
  patientSummaryQuery,
  prefetchQueryOnClient,
} from '~/lib/convex-queries'
import { waitForAuthedAppReady } from '~/lib/auth-ready'

export const Route = createFileRoute('/_authed/patients/$patientId/history')({
  loader: async ({ context, params }) => {
    await waitForAuthedAppReady({
      queryClient: context.queryClient,
    })
    const patientId = params.patientId as Id<'patients'>
    const ensureQueryData = context.queryClient.ensureQueryData.bind(
      context.queryClient,
    )
    const patient = await ensurePatientAccessOnClient(
      ensureQueryData,
      patientId,
    )

    if (!patient) return

    await Promise.all([
      prefetchQueryOnClient(
        ensureQueryData,
        patientMedicationsQuery(patientId),
      ),
      prefetchQueryOnClient(ensureQueryData, patientHistoryQuery(patientId, 7)),
    ])
  },
  component: HistoryScreen,
})

type DateRange = 7 | 14 | 30
type SelectedMedication = 'all' | string
type HistoryData = typeof api.logs.getHistory._returnType
type HistoryLog = HistoryData['logs'][number]
type HistoryStatus = HistoryLog['status']

const STATUS_STYLES: Record<HistoryStatus, { bg: string; icon: typeof Check }> =
  {
    taken: { bg: 'bg-emerald-500', icon: Check },
    late: { bg: 'bg-amber-500', icon: Clock },
    missed: { bg: 'bg-red-500', icon: X },
  }

function getDateRange(value: string): DateRange {
  if (value === '14') return 14
  if (value === '30') return 30
  return 7
}

function getLocalDateKey(timestamp: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(timestamp)
}

function formatDateFull(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp)
}

function formatTimestamp(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

function groupLogsByDay(logs: Array<HistoryLog>, timeZone: string) {
  const groups = new Map<string, Array<HistoryLog>>()

  for (const log of logs) {
    const key = getLocalDateKey(log.scheduledFor, timeZone)
    const existingGroup = groups.get(key)

    if (existingGroup) {
      existingGroup.push(log)
      continue
    }

    groups.set(key, [log])
  }

  return [...groups.entries()]
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl border border-border bg-muted/30"
        />
      ))}
    </div>
  )
}

function HistoryScreen() {
  const { patientId } = Route.useParams()
  const typedPatientId = patientId as Id<'patients'>
  const [selectedMed, setSelectedMed] = useState<SelectedMedication>('all')
  const [dateRange, setDateRange] = useState<DateRange>(7)

  const { data: patient } = useQuery(patientSummaryQuery(typedPatientId))
  const { data: medications } = useQuery(
    patientMedicationsQuery(typedPatientId),
  )
  const { data: history } = useQuery(
    patientHistoryQuery(
      typedPatientId,
      dateRange,
      selectedMed === 'all' ? undefined : (selectedMed as Id<'medications'>),
    ),
  )
  const deferredHistory = useDeferredValue(history)
  const timeZone = patient?.timezone ?? 'UTC'

  const groupedLogs = useMemo(
    () =>
      deferredHistory ? groupLogsByDay(deferredHistory.logs, timeZone) : [],
    [deferredHistory, timeZone],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div>
          <p className="section-label mb-2">Records</p>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            History
          </h2>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select
            value={String(dateRange)}
            onValueChange={(value) => {
              if (!value) return
              startTransition(() => {
                setDateRange(getDateRange(value))
              })
            }}
          >
            <SelectTrigger className="w-[120px] rounded-xl border-border text-sm font-bold sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedMed}
            onValueChange={(value) =>
              startTransition(() => {
                setSelectedMed(
                  value === 'all' || value === null ? 'all' : value,
                )
              })
            }
          >
            <SelectTrigger className="min-w-0 flex-1 rounded-xl border-border text-sm font-bold sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border">
              <SelectItem value="all">All medications</SelectItem>
              {(medications ?? []).map((medication) => (
                <SelectItem key={medication._id} value={String(medication._id)}>
                  {medication.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {history === undefined ? (
        <HistorySkeleton />
      ) : (
        <>
          <div className="grid animate-card-enter grid-cols-3 gap-2 sm:gap-3">
            <div className="stat-block rounded-2xl border border-border bg-emerald-50 p-4 text-center text-emerald-700 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-400 sm:p-6">
              <p className="font-mono text-3xl font-black tabular-nums sm:text-4xl">
                {history.stats.taken}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60 dark:text-emerald-500/60 sm:text-xs">
                On time
              </p>
            </div>
            <div className="stat-block rounded-2xl border border-border bg-amber-50 p-4 text-center text-amber-700 shadow-sm dark:bg-amber-950/40 dark:text-amber-400 sm:p-6">
              <p className="font-mono text-3xl font-black tabular-nums sm:text-4xl">
                {history.stats.late}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60 dark:text-amber-500/60 sm:text-xs">
                Late
              </p>
            </div>
            <div className="stat-block rounded-2xl border border-border bg-red-50 p-4 text-center text-red-700 shadow-sm dark:bg-red-950/40 dark:text-red-400 sm:p-6">
              <p className="font-mono text-3xl font-black tabular-nums sm:text-4xl">
                {history.stats.missed}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600/60 dark:text-red-500/60 sm:text-xs">
                Missed
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {groupedLogs.map(([dateKey, dayLogs]) => (
              <div key={dateKey}>
                <h3 className="mb-3 border-b border-border pb-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {formatDateFull(dayLogs[0].scheduledFor, timeZone)}
                </h3>
                <div className="space-y-2">
                  {dayLogs.map((log) => {
                    const style = STATUS_STYLES[log.status]
                    const StatusIcon = style.icon
                    const medicationName =
                      log.medicationName ?? 'Deleted medication'

                    return (
                      <div
                        key={log._id}
                        className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors duration-150 hover:border-primary/30 sm:gap-4 sm:p-4"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bg} sm:h-9 sm:w-9`}
                        >
                          <StatusIcon className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold sm:text-base">
                              {medicationName}
                            </span>
                            {log.medicationDosage ? (
                              <Badge
                                variant="outline"
                                className="rounded-md font-mono text-xs"
                              >
                                {log.medicationDosage}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                            {log.status === 'missed'
                              ? 'Missed'
                              : `Taken at ${formatTimestamp(log.takenAt, timeZone)}`}
                            {log.loggedByUserName ? (
                              <span className="hidden sm:inline">
                                {' '}
                                · by {log.loggedByUserName}
                              </span>
                            ) : null}
                          </div>
                          {log.notes ? (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              &quot;{log.notes}&quot;
                            </p>
                          ) : null}
                        </div>
                        <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block sm:text-sm">
                          {log.status === 'missed'
                            ? formatTimestamp(log.scheduledFor, timeZone)
                            : formatTimestamp(log.takenAt, timeZone)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {history.logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-lg text-muted-foreground">No logs found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing the date range or filter
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
