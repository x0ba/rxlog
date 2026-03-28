import { createFileRoute, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { AlertTriangle, Check, Clock, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import {
  ensurePatientAccessOnClient,
  patientHistoryQuery,
  prefetchQueryOnClient,
  profileQuery,
  todayScheduleDigestQuery,
} from '~/lib/convex-queries'

export const Route = createFileRoute('/_authed/patients/$patientId/')({
  loader: async ({ context, params }) => {
    const patientId = params.patientId as Id<'patients'>
    const patient = await ensurePatientAccessOnClient(
      context.queryClient.ensureQueryData.bind(context.queryClient),
      patientId,
    )

    if (!patient) return

    await prefetchQueryOnClient(
      context.queryClient.ensureQueryData.bind(context.queryClient),
      todayScheduleDigestQuery(patientId),
    )
  },
  component: LogScreen,
})

type TodaySchedule = typeof api.logs.getTodayScheduleDigest._returnType
type ScheduleItem = TodaySchedule[number]
type ScheduleStatus = ScheduleItem['status']

const STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; badgeClass: string; icon: typeof Check }
> = {
  taken: {
    label: 'Taken',
    badgeClass: 'status-taken',
    icon: Check,
  },
  late: {
    label: 'Late',
    badgeClass: 'status-late',
    icon: Clock,
  },
  missed: {
    label: 'Missed',
    badgeClass: 'status-missed',
    icon: X,
  },
  pending: {
    label: 'Pending',
    badgeClass: 'status-pending',
    icon: AlertTriangle,
  },
}

function formatTime(hour: number) {
  const normalizedHour = ((hour % 24) + 24) % 24
  const amPm = normalizedHour >= 12 ? 'PM' : 'AM'
  const hour12 = normalizedHour % 12 || 12
  return `${hour12}:00 ${amPm}`
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getAccentBarClass(status: ScheduleStatus) {
  if (status === 'taken') return 'bg-emerald-500'
  if (status === 'late') return 'bg-amber-500'
  if (status === 'missed') return 'bg-red-500'
  return 'bg-foreground/20'
}

function resolveTakenStatus(
  scheduledFor: number,
  takenAt: number,
): ScheduleStatus {
  return Math.abs(takenAt - scheduledFor) <= 60 * 60 * 1000 ? 'taken' : 'late'
}

function ScheduleSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse border-2 border-border bg-muted/40"
        />
      ))}
    </div>
  )
}

function LogScreen() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId/' })
  const typedPatientId = patientId as Id<'patients'>
  const queryClient = useQueryClient()
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const logMedicationTakenMutationFn = useConvexMutation(
    api.logs.logMedicationTaken,
  )
  const logMedicationMissedMutationFn = useConvexMutation(
    api.logs.logMedicationMissed,
  )
  const { data: schedule } = useQuery(todayScheduleDigestQuery(typedPatientId))
  const { data: profile } = useQuery(profileQuery())

  const logMedicationTaken = useMutation({
    mutationFn: logMedicationTakenMutationFn,
    onMutate: async (variables) => {
      setActionError(null)
      const scheduleQuery = todayScheduleDigestQuery(typedPatientId)
      await queryClient.cancelQueries({ queryKey: scheduleQuery.queryKey })

      const previousSchedule =
        queryClient.getQueryData<TodaySchedule>(scheduleQuery.queryKey) ?? []
      const takenAt = variables.takenAt ?? Date.now()

      queryClient.setQueryData<TodaySchedule>(
        scheduleQuery.queryKey,
        (current = []) =>
          current.map((item) => {
            if (
              item.medicationId !== variables.medicationId ||
              item.scheduledFor !== variables.scheduledFor ||
              item.status !== 'pending'
            ) {
              return item
            }

            const nextStatus = resolveTakenStatus(item.scheduledFor, takenAt)
            return {
              ...item,
              status: nextStatus,
              takenAt,
              notes: variables.notes ?? null,
              logId: item.logId,
              loggedByUserName: profile?.name ?? profile?.email ?? 'You',
            }
          }),
      )

      return { previousSchedule, queryKey: scheduleQuery.queryKey }
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousSchedule)
      }
      setActionError(error.message)
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: todayScheduleDigestQuery(typedPatientId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: patientHistoryQuery(typedPatientId, 7).queryKey,
          exact: false,
        }),
      ])
    },
  })

  const logMedicationMissed = useMutation({
    mutationFn: logMedicationMissedMutationFn,
    onMutate: async (variables) => {
      setActionError(null)
      const scheduleQuery = todayScheduleDigestQuery(typedPatientId)
      await queryClient.cancelQueries({ queryKey: scheduleQuery.queryKey })

      const previousSchedule =
        queryClient.getQueryData<TodaySchedule>(scheduleQuery.queryKey) ?? []

      queryClient.setQueryData<TodaySchedule>(
        scheduleQuery.queryKey,
        (current = []) =>
          current.map((item) => {
            if (
              item.medicationId !== variables.medicationId ||
              item.scheduledFor !== variables.scheduledFor
            ) {
              return item
            }

            return {
              ...item,
              status: 'missed' as const,
              takenAt: variables.scheduledFor,
              notes: variables.notes ?? null,
              logId: item.logId,
              loggedByUserName: profile?.name ?? profile?.email ?? 'You',
            }
          }),
      )

      return { previousSchedule, queryKey: scheduleQuery.queryKey }
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousSchedule)
      }
      setActionError(error.message)
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: todayScheduleDigestQuery(typedPatientId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: patientHistoryQuery(typedPatientId, 7).queryKey,
          exact: false,
        }),
      ])
    },
  })

  const scheduleItems = schedule ?? []
  const resolvedCount = scheduleItems.filter(
    (item) => item.status !== 'pending',
  ).length
  const totalCount = scheduleItems.length
  const progressPercent =
    totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0

  const handleMarkTaken = async (item: ScheduleItem) => {
    const actionKey = `${item.medicationId}:${item.scheduledFor}:taken`
    setSubmittingKey(actionKey)

    try {
      await logMedicationTaken.mutateAsync({
        patientId: typedPatientId,
        medicationId: item.medicationId,
        scheduledFor: item.scheduledFor,
      })
    } finally {
      setSubmittingKey(null)
    }
  }

  const handleMarkMissed = async (item: ScheduleItem) => {
    const actionKey = `${item.medicationId}:${item.scheduledFor}:missed`
    setSubmittingKey(actionKey)

    try {
      await logMedicationMissed.mutateAsync({
        patientId: typedPatientId,
        medicationId: item.medicationId,
        scheduledFor: item.scheduledFor,
      })
    } finally {
      setSubmittingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="section-label mb-2">Schedule</p>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Today&apos;s Medications
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-mono">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right shrink-0 border-3 border-foreground/80 px-4 py-3 brutalist-shadow-sm">
          <p className="font-mono text-2xl sm:text-3xl font-black text-primary tabular-nums">
            {resolvedCount}
            <span className="text-muted-foreground/50">/{totalCount}</span>
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">
            resolved
          </p>
        </div>
      </div>

      <div className="h-2.5 bg-muted border-2 border-foreground/15 overflow-hidden relative">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-0 flex">
          {Array.from({ length: totalCount || 1 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-foreground/10 last:border-r-0" />
          ))}
        </div>
      </div>

      {actionError ? (
        <div className="border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {schedule === undefined ? (
        <ScheduleSkeleton />
      ) : (
        <div className="grid gap-3">
          {scheduleItems.map((item, index) => {
            const config = STATUS_CONFIG[item.status]
            const StatusIcon = config.icon
            const isPending = item.status === 'pending'
            const takeActionKey = `${item.medicationId}:${item.scheduledFor}:taken`
            const missActionKey = `${item.medicationId}:${item.scheduledFor}:missed`
            const isSubmitting =
              submittingKey === takeActionKey || submittingKey === missActionKey

            return (
              <Card
                key={`${item.medicationId}-${item.scheduledFor}`}
                className={`border-3 rounded-none transition-all animate-card-enter ${
                  isPending
                    ? 'border-foreground/80 brutalist-shadow-sm'
                    : 'border-border'
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div
                      className={`w-2 shrink-0 ${getAccentBarClass(item.status)}`}
                    />
                    <div className="flex-1 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <h3
                            className={`text-base sm:text-lg font-black ${
                              isPending ? '' : 'text-muted-foreground'
                            }`}
                          >
                            {item.medicationName}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${config.badgeClass} border-2 rounded-none text-xs font-bold`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono font-bold tabular-nums bg-muted/50 px-1.5 py-0.5 border border-border">
                            {item.medicationDosage}
                          </span>
                          <span className="text-foreground/15">|</span>
                          <span className="font-mono">
                            {formatTime(item.scheduledHour)}
                          </span>
                          {item.takenAt ? (
                            <>
                              <span className="text-foreground/15 hidden sm:inline">
                                |
                              </span>
                              <span className="hidden sm:inline font-mono">
                                {item.status === 'missed'
                                  ? 'Marked missed'
                                  : `Taken ${formatTimestamp(item.takenAt)}`}
                              </span>
                            </>
                          ) : null}
                        </div>
                        {item.loggedByUserName ? (
                          <p className="text-xs text-muted-foreground mt-1.5 font-mono">
                            by {item.loggedByUserName}
                          </p>
                        ) : null}
                        {item.notes ? (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            &quot;{item.notes}&quot;
                          </p>
                        ) : null}
                      </div>

                      {isPending ? (
                        <div className="flex w-full sm:w-auto gap-2 shrink-0">
                          <Button
                            size="lg"
                            variant="outline"
                            className="rounded-none h-12 sm:h-14 px-4 sm:px-6 text-sm sm:text-base font-black gap-2 flex-1 sm:flex-none border-3 border-foreground/80"
                            disabled={isSubmitting}
                            onClick={() => void handleMarkMissed(item)}
                          >
                            <X className="h-5 w-5" />
                            Missed
                          </Button>
                          <Button
                            size="lg"
                            className="rounded-none h-12 sm:h-14 px-4 sm:px-6 text-sm sm:text-base font-black gap-2 flex-1 sm:flex-none brutalist-shadow-accent"
                            disabled={isSubmitting}
                            onClick={() => void handleMarkTaken(item)}
                          >
                            <Check className="h-5 w-5" />
                            Taken
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {schedule !== undefined && scheduleItems.length === 0 ? (
        <div className="text-center py-16 border-3 border-dashed border-foreground/15 rounded-none crosshatch-bg">
          <p className="text-muted-foreground text-lg font-black">
            No medications scheduled
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-mono">
            Add medications in settings to start tracking
          </p>
        </div>
      ) : null}
    </div>
  )
}
