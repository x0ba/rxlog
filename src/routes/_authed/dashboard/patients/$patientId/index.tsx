import { createFileRoute, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { AlertTriangle, Check, Clock, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldContent, FieldLabel } from '~/components/ui/field'
import { Textarea } from '~/components/ui/textarea'
import {
  ensurePatientAccessOnClient,
  patientHistoryQuery,
  prefetchQueryOnClient,
  profileQuery,
  todayScheduleDigestQuery,
} from '~/lib/convex-queries'
import { waitForAuthedAppReady } from '~/lib/auth-ready'

export const Route = createFileRoute('/_authed/dashboard/patients/$patientId/')(
  {
    loader: async ({ context, params }) => {
      await waitForAuthedAppReady({
        convexClient: context.convexClient,
        queryClient: context.queryClient,
      })
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
  },
)

type TodaySchedule = typeof api.logs.getTodayScheduleDigest._returnType
type ScheduleItem = TodaySchedule[number]
type ScheduleStatus = ScheduleItem['status']
type PendingLogAction = {
  item: ScheduleItem
  action: 'taken' | 'missed'
} | null

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
          className="border-border bg-muted/40 h-28 animate-pulse rounded-2xl border"
        />
      ))}
    </div>
  )
}

function LogScreen() {
  const { patientId } = useParams({
    from: '/_authed/dashboard/patients/$patientId/',
  })
  const typedPatientId = patientId as Id<'patients'>
  const queryClient = useQueryClient()
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingLogAction, setPendingLogAction] =
    useState<PendingLogAction>(null)
  const [noteDraft, setNoteDraft] = useState('')
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

  const closeLogActionDialog = () => {
    setPendingLogAction(null)
    setNoteDraft('')
  }

  const openTakenDialog = (item: ScheduleItem) => {
    setActionError(null)
    setPendingLogAction({ item, action: 'taken' })
    setNoteDraft('')
  }

  const openMissedDialog = (item: ScheduleItem) => {
    setActionError(null)
    setPendingLogAction({ item, action: 'missed' })
    setNoteDraft('')
  }

  const handleConfirmLogAction = async () => {
    if (!pendingLogAction) return

    const { item, action } = pendingLogAction
    const actionKey = `${item.medicationId}:${item.scheduledFor}:${action}`
    const trimmedNotes = noteDraft.trim()
    const notes = trimmedNotes.length > 0 ? trimmedNotes : undefined

    setSubmittingKey(actionKey)

    try {
      if (action === 'taken') {
        await logMedicationTaken.mutateAsync({
          patientId: typedPatientId,
          medicationId: item.medicationId,
          scheduledFor: item.scheduledFor,
          notes,
        })
      } else {
        await logMedicationMissed.mutateAsync({
          patientId: typedPatientId,
          medicationId: item.medicationId,
          scheduledFor: item.scheduledFor,
          notes,
        })
      }
      closeLogActionDialog()
    } finally {
      setSubmittingKey(null)
    }
  }

  const pendingActionKey = pendingLogAction
    ? `${pendingLogAction.item.medicationId}:${pendingLogAction.item.scheduledFor}:${pendingLogAction.action}`
    : null
  const isDialogSubmitting =
    pendingActionKey !== null && submittingKey === pendingActionKey

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="section-label mb-2">Schedule</p>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            Today&apos;s Medications
          </h2>
          <p className="text-muted-foreground mt-1 font-mono text-xs sm:text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="border-border bg-card shrink-0 rounded-2xl border px-4 py-3 text-right shadow-sm">
          <p className="text-primary font-mono text-2xl font-black tabular-nums sm:text-3xl">
            {resolvedCount}
            <span className="text-muted-foreground/50">/{totalCount}</span>
          </p>
          <p className="text-muted-foreground text-[10px] font-black tracking-[0.2em] uppercase">
            resolved
          </p>
        </div>
      </div>

      <div className="border-border bg-muted relative h-2.5 overflow-hidden rounded-full border">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-0 flex">
          {Array.from({ length: totalCount || 1 }).map((_, i) => (
            <div
              key={i}
              className="border-border/40 flex-1 border-r last:border-r-0"
            />
          ))}
        </div>
      </div>

      {actionError ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
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
                className={`haven-card animate-card-enter rounded-2xl ${
                  isPending ? 'border-primary/25 shadow-md' : ''
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div
                      className={`w-2 shrink-0 ${getAccentBarClass(item.status)}`}
                    />
                    <div className="flex flex-1 flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3
                            className={`text-base font-black sm:text-lg ${
                              isPending ? '' : 'text-muted-foreground'
                            }`}
                          >
                            {item.medicationName}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${config.badgeClass} rounded-full border text-xs font-bold`}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2 text-xs sm:mt-2 sm:gap-3 sm:text-sm">
                          <span className="border-border bg-muted/50 rounded-md border px-1.5 py-0.5 font-mono font-bold tabular-nums">
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
                              <span className="hidden font-mono sm:inline">
                                {item.status === 'missed'
                                  ? 'Marked missed'
                                  : `Taken ${formatTimestamp(item.takenAt)}`}
                              </span>
                            </>
                          ) : null}
                        </div>
                        {item.loggedByUserName ? (
                          <p className="text-muted-foreground mt-1.5 font-mono text-xs">
                            by {item.loggedByUserName}
                          </p>
                        ) : null}
                        {item.notes ? (
                          <p className="text-muted-foreground mt-1 text-xs italic">
                            &quot;{item.notes}&quot;
                          </p>
                        ) : null}
                      </div>

                      {isPending ? (
                        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-border h-12 flex-1 gap-2 rounded-xl px-4 text-sm font-black sm:h-14 sm:flex-none sm:px-6 sm:text-base"
                            disabled={isSubmitting}
                            onClick={() => openMissedDialog(item)}
                          >
                            <X className="h-5 w-5" />
                            Missed
                          </Button>
                          <Button
                            size="lg"
                            className="h-12 flex-1 gap-2 rounded-xl px-4 text-sm font-black shadow-sm sm:h-14 sm:flex-none sm:px-6 sm:text-base"
                            disabled={isSubmitting}
                            onClick={() => openTakenDialog(item)}
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
        <div className="border-border bg-muted/20 rounded-2xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-lg font-black">
            No medications scheduled
          </p>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Add medications in settings to start tracking
          </p>
        </div>
      ) : null}

      <Dialog
        open={pendingLogAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeLogActionDialog()
          }
        }}
      >
        <DialogContent className="border-border max-w-[calc(100%-2rem)] rounded-2xl border p-5 sm:max-w-md">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl font-black tracking-tight">
              {pendingLogAction?.action === 'missed'
                ? 'Mark as missed'
                : 'Mark as taken'}
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px] tracking-[0.16em] uppercase">
              Add an optional note to this log entry
            </DialogDescription>
          </DialogHeader>

          {pendingLogAction ? (
            <div className="space-y-4">
              <div className="border-border bg-muted/40 rounded-xl border p-3">
                <p className="text-base leading-tight font-black">
                  {pendingLogAction.item.medicationName}
                </p>
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="border-border bg-background rounded-md border px-1.5 py-0.5 font-mono font-bold tabular-nums">
                    {pendingLogAction.item.medicationDosage}
                  </span>
                  <span className="text-foreground/15">|</span>
                  <span className="font-mono">
                    {formatTime(pendingLogAction.item.scheduledHour)}
                  </span>
                </div>
              </div>

              <Field>
                <FieldLabel
                  htmlFor="log-note"
                  className="text-sm font-semibold"
                >
                  Note (optional)
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id="log-note"
                    rows={4}
                    placeholder="e.g. took after breakfast"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                  />
                </FieldContent>
              </Field>

              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border rounded-xl"
                  onClick={closeLogActionDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-xl shadow-sm"
                  disabled={isDialogSubmitting}
                  onClick={() => void handleConfirmLogAction()}
                >
                  {pendingLogAction.action === 'missed'
                    ? 'Confirm Missed'
                    : 'Confirm Taken'}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
